require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require('@langchain/openai');
const { DynamicStructuredTool } = require('@langchain/core/tools');
const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const { z } = require('zod');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- SESSION STORAGE ---
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
let sessions = {};

// Default address (inventado) - usado solo si el usuario no proporciona uno
const DEFAULT_ADDRESS = {
  direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, Benito Juárez, CDMX',
  maps_link: 'https://maps.google.com/?q=19.3846,-99.1786'
};

try {
  if (fs.existsSync(SESSIONS_FILE)) {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    sessions = JSON.parse(data);

    Object.keys(sessions).forEach(key => {
      if (sessions[key].history) {
        sessions[key].history = sessions[key].history.map(msg => {
          if (msg.id && msg.kwargs && msg.kwargs.content) {
            return msg.id.includes('Human') ? new HumanMessage(msg.kwargs.content) : new AIMessage(msg.kwargs.content);
          }
          return msg.type === 'human' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
        });
      }
    });
  }
} catch (error) {
  console.error('Error loading sessions:', error);
  sessions = {};
}

exports.sessions = sessions;

function saveSessionsToFile() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

const prompt = ChatPromptTemplate.fromMessages([
  ['system', `Eres COLMENA, mesero digital para restaurantes.

ESTADO: {system_state}

=== SI MODO ES "atencion" ===
NO pidas configuración. Eres el mesero del restaurante. Saluda, muestra menú, toma pedidos.
- Sugiere upselling con tool "sugerir_upsell"
- Pregunta: domicilio o sucursal
- Pregunta forma de pago
- Usa tool "calcular" para totales
- Usa tool "tomar_pedido" para registrar

=== SI MODO ES "configuracion" ===

FLUJO SIMPLIFICADO (3 interacciones):

PRIMERA INTERACCIÓN (cuando dicen "Hola" o similar):
1. Saluda: "👋 ¡Hola! Soy COLMENA, tu mesero digital. Te ayudaré a configurar tu restaurante en segundos."
2. Pregunta: "¿Cómo te llamas, cuál es el nombre de tu restaurante y qué tipo de comida vendes? (Ej: tacos, pizzas, hamburguesas, alitas, sushi, comida peruana, etc.)"

SEGUNDA INTERACCIÓN (cuando dan la información):
1. Llama tool "configuracion_rapida" con:
   - nombre_usuario: el nombre que dieron
   - nombre_restaurante: el nombre del restaurante
   - tipo_comida: el tipo de comida que mencionaron (tacos/pizzas/hamburguesas/alitas/otro)
2. Esta tool generará automáticamente: menú con precios, upselling, horarios y dirección
3. Muestra el resumen generado y pregunta: "¿Te parece bien? Puedes pedirme cambiar cualquier detalle."

TERCERA INTERACCIÓN (cuando confirman):
1. Llama tool "activar_modo_atencion" con confirmacion=true
2. El sistema mostrará la transición automáticamente

REGLAS:
- Sé conciso y amigable
- Si dicen "sí", "ok", "vale", "perfecto", "está bien" → es confirmación
- Si quieren cambiar algo, usa las tools correspondientes y vuelve a preguntar
`],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad')
]);

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0.7
});

function parseAutoActions(userMessage, agentResponse, session, toolCallsExecuted) {
  const actions = [];
  // Only trigger mode change via tool now, not via text detection
  // This prevents premature mode changes
  return actions;
}

// Check if all configuration steps are complete
function isConfigurationComplete(config) {
  const requiredFields = ['nombre_mesero', 'nombre_restaurante', 'tipo_producto', 'horarios', 'direccion'];
  const hasAllFields = requiredFields.every(field => config[field] && config[field].trim() !== '');
  const hasMenu = config.menu_productos && config.menu_productos.length > 0;
  return hasAllFields && hasMenu;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        config: {},
        mode: 'configuracion',
        history: [],
        pedidos: [],
        pasos_completados: []
      };
    }

    const session = sessions[sessionId];
    session.history.push(new HumanMessage(message));

    const saveSession = () => {
      saveSessionsToFile();
    };

    // Get restaurant address
    const restaurantAddress = session.config.direccion || DEFAULT_ADDRESS.direccion;
    const mapsLink = session.config.maps_link || DEFAULT_ADDRESS.maps_link;

    // Get menu if exists
    const menuStr = session.config.menu_productos
      ? session.config.menu_productos.map((p, i) => `${i + 1}. ${p.nombre} - $${p.precio}`).join('\n')
      : 'No configurado aún';

    // NEW: Quick configuration tool - generates everything automatically
    const configuracionRapidaTool = new DynamicStructuredTool({
      name: 'configuracion_rapida',
      description: 'Configura TODO el restaurante automáticamente. Genera menú, upselling, horarios y dirección basándose en el tipo de negocio.',
      schema: z.object({
        nombre_usuario: z.string().describe('Nombre del dueño/mesero'),
        nombre_restaurante: z.string().describe('Nombre del restaurante'),
        tipo_comida: z.string().describe('Tipo de comida: tacos, pizzas, hamburguesas, alitas, sushi, mariscos, pollo, cafe, peruana, mexicana, otro')
      }),
      func: async ({ nombre_usuario, nombre_restaurante, tipo_comida }) => {
        // Normalize the food type
        const tipoLower = (tipo_comida || '').toLowerCase();
        let tipo = 'otro';

        if (tipoLower.includes('taco')) tipo = 'tacos';
        else if (tipoLower.includes('pizza')) tipo = 'pizzas';
        else if (tipoLower.includes('burger') || tipoLower.includes('hambur')) tipo = 'hamburguesas';
        else if (tipoLower.includes('alita') || tipoLower.includes('wing')) tipo = 'alitas';
        else if (tipoLower.includes('sushi') || tipoLower.includes('japon')) tipo = 'sushi';
        else if (tipoLower.includes('marisco') || tipoLower.includes('pescado')) tipo = 'mariscos';
        else if (tipoLower.includes('pollo') || tipoLower.includes('rostizado')) tipo = 'pollo';
        else if (tipoLower.includes('cafe') || tipoLower.includes('café') || tipoLower.includes('coffee')) tipo = 'cafe';
        else if (tipoLower.includes('peru')) tipo = 'peruana';
        else if (tipoLower.includes('mexic')) tipo = 'mexicana';

        // Generate menu based on type
        const menus = {
          'tacos': [
            { nombre: 'Taco al Pastor', precio: 25 },
            { nombre: 'Taco de Bistec', precio: 28 },
            { nombre: 'Taco de Carnitas', precio: 27 },
            { nombre: 'Taco de Suadero', precio: 26 },
            { nombre: 'Orden de Quesadillas (3)', precio: 55 }
          ],
          'pizzas': [
            { nombre: 'Pizza Pepperoni Personal', precio: 89 },
            { nombre: 'Pizza Hawaiana Mediana', precio: 159 },
            { nombre: 'Pizza 4 Quesos Grande', precio: 199 },
            { nombre: 'Pizza Mexicana Familiar', precio: 249 }
          ],
          'hamburguesas': [
            { nombre: 'Hamburguesa Clásica', precio: 79 },
            { nombre: 'Hamburguesa con Queso', precio: 89 },
            { nombre: 'Hamburguesa Doble', precio: 115 },
            { nombre: 'Hamburguesa BBQ Bacon', precio: 105 },
            { nombre: 'Papas Fritas', precio: 45 }
          ],
          'alitas': [
            { nombre: 'Alitas BBQ (6 pz)', precio: 89 },
            { nombre: 'Alitas Buffalo (12 pz)', precio: 159 },
            { nombre: 'Alitas Mixtas (18 pz)', precio: 219 },
            { nombre: 'Boneless (orden)', precio: 99 }
          ],
          'sushi': [
            { nombre: 'Roll California (8 pz)', precio: 120 },
            { nombre: 'Roll Filadelfia (8 pz)', precio: 135 },
            { nombre: 'Roll Spicy Tuna (8 pz)', precio: 145 },
            { nombre: 'Nigiri Mixto (6 pz)', precio: 160 },
            { nombre: 'Combo Sushi (20 pz)', precio: 299 }
          ],
          'mariscos': [
            { nombre: 'Cóctel de Camarón', precio: 120 },
            { nombre: 'Ceviche de Pescado', precio: 95 },
            { nombre: 'Aguachile Verde', precio: 140 },
            { nombre: 'Tostada de Mariscos', precio: 65 },
            { nombre: 'Pescado Zarandeado', precio: 180 }
          ],
          'pollo': [
            { nombre: 'Pollo Rostizado (entero)', precio: 149 },
            { nombre: 'Medio Pollo', precio: 85 },
            { nombre: 'Cuarto de Pollo', precio: 55 },
            { nombre: 'Pechuga Asada', precio: 75 },
            { nombre: 'Pierna con Arroz', precio: 65 }
          ],
          'cafe': [
            { nombre: 'Café Americano', precio: 35 },
            { nombre: 'Cappuccino', precio: 55 },
            { nombre: 'Latte', precio: 60 },
            { nombre: 'Frappe Mokka', precio: 75 },
            { nombre: 'Croissant', precio: 45 }
          ],
          'peruana': [
            { nombre: 'Ceviche Clásico', precio: 120 },
            { nombre: 'Lomo Saltado', precio: 140 },
            { nombre: 'Ají de Gallina', precio: 110 },
            { nombre: 'Arroz con Mariscos', precio: 150 },
            { nombre: 'Causa Limeña', precio: 85 }
          ],
          'mexicana': [
            { nombre: 'Enchiladas Rojas', precio: 85 },
            { nombre: 'Chilaquiles', precio: 75 },
            { nombre: 'Pozole', precio: 95 },
            { nombre: 'Quesadillas de Huitlacoche', precio: 70 },
            { nombre: 'Tamal Oaxaqueño', precio: 45 }
          ],
          'otro': [
            { nombre: 'Platillo del Día', precio: 85 },
            { nombre: 'Platillo Especial', precio: 120 },
            { nombre: 'Entrada', precio: 55 },
            { nombre: 'Guarnición', precio: 35 },
            { nombre: 'Postre', precio: 45 }
          ]
        };

        const upselling = [
          { nombre: 'Refresco 600ml', precio: 25 },
          { nombre: 'Agua Mineral', precio: 20 },
          { nombre: 'Postre del Día', precio: 35 }
        ];

        // Save all config
        session.config = {
          nombre_mesero: nombre_usuario,
          nombre_restaurante: nombre_restaurante,
          tipo_producto: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          menu_productos: menus[tipo] || menus['otro'],
          productos_upselling: upselling,
          productos_upselling_texto: upselling.map(p => `${p.nombre} $${p.precio}`).join(', '),
          horarios: 'Lunes a Domingo de 12:00 PM a 10:00 PM',
          direccion: 'Av. Principal #123, Centro',
          maps_link: 'https://maps.google.com/?q=Av.+Principal+123'
        };

        session.pasos_completados = [1, 2, 3, 4]; // Mark first 4 steps as complete
        saveSession();

        const menuFormateado = session.config.menu_productos.map((p, i) => `  ${i + 1}. ${p.nombre} - $${p.precio}`).join('\n');

        return JSON.stringify({
          accion: 'configuracion_generada',
          config: session.config,
          resumen: `
🤖 Mesero: ${nombre_usuario}
🏪 Restaurante: ${nombre_restaurante}
🍽️ Tipo: ${session.config.tipo_producto}

📋 Menú:
${menuFormateado}

💰 Productos Upselling: ${session.config.productos_upselling_texto}
🕐 Horarios: ${session.config.horarios}
📍 Dirección: ${session.config.direccion}
          `.trim()
        });
      }
    });

    // NEW: Activate attention mode
    const activarModoAtencionTool = new DynamicStructuredTool({
      name: 'activar_modo_atencion',
      description: 'Activa el modo atención después de que el usuario confirme la configuración. Úsalo cuando digan "sí", "ok", "vale", "perfecto", etc.',
      schema: z.object({
        confirmacion: z.boolean().describe('true si el usuario confirmó')
      }),
      func: async ({ confirmacion }) => {
        if (!confirmacion) {
          return JSON.stringify({ accion: 'esperando_confirmacion', mensaje: 'Pregunta al usuario si quiere modificar algo' });
        }

        session.pasos_completados = [1, 2, 3, 4, 5];
        session.mode = 'atencion';
        saveSession();

        const mensajeBienvenida = `¡Hola! Bienvenido a ${session.config.nombre_restaurante}. Soy ${session.config.nombre_mesero} 🤖\n\nEste es nuestro menú:\n${session.config.menu_productos?.map((p, i) => `${i + 1}. ${p.nombre} - $${p.precio}`).join('\n')}\n\n¿Qué te gustaría ordenar?`;

        return JSON.stringify({
          accion: 'configuracion_completada_y_modo_cambiado',
          modo: 'atencion',
          mensaje_bienvenida: mensajeBienvenida,
          config: session.config
        });
      }
    });

    const updateConfigTool = new DynamicStructuredTool({
      name: 'actualizar_configuracion',
      description: 'Actualiza un campo específico de la configuración.',
      schema: z.object({
        campo: z.enum(['nombre_mesero', 'nombre_restaurante', 'tipo_producto', 'horarios', 'direccion']),
        valor: z.string()
      }),
      func: async ({ campo, valor }) => {
        session.config[campo] = valor;

        if (campo === 'direccion') {
          session.config.maps_link = `https://maps.google.com/?q=${encodeURIComponent(valor)}`;
        }

        saveSession();
        return JSON.stringify({ accion: 'configuracion_actualizada', campo, valor });
      }
    });

    const generarMenuTool = new DynamicStructuredTool({
      name: 'generar_menu',
      description: 'Genera el menú personalizado basado en los productos que el usuario proporciona. Úsalo cuando el usuario te diga sus productos y precios.',
      schema: z.object({
        productos: z.array(z.object({
          nombre: z.string().describe('Nombre del producto'),
          precio: z.number().describe('Precio del producto en pesos')
        })).describe('Lista de productos con sus precios')
      }),
      func: async ({ productos }) => {
        session.config.menu_productos = productos;
        session.config.tipo_producto = session.config.tipo_producto || 'Comida';
        saveSession();

        const menuFormateado = productos.map((p, i) => `${i + 1}. ${p.nombre} - $${p.precio}`).join('\n');
        return JSON.stringify({
          accion: 'menu_generado',
          productos,
          menu_formateado: menuFormateado,
          mensaje: `Menú personalizado guardado con ${productos.length} productos`
        });
      }
    });

    const generarUpsellingTool = new DynamicStructuredTool({
      name: 'generar_upselling',
      description: 'Guarda los productos de upselling proporcionados por el usuario.',
      schema: z.object({
        productos: z.array(z.object({
          nombre: z.string().describe('Nombre del producto de upselling'),
          precio: z.number().describe('Precio del producto')
        })).describe('Lista de productos de upselling con precios')
      }),
      func: async ({ productos }) => {
        session.config.productos_upselling = productos;
        session.config.productos_upselling_texto = productos.map(p => `${p.nombre} $${p.precio}`).join(', ');
        saveSession();
        return JSON.stringify({
          accion: 'upselling_configurado',
          productos,
          mensaje: `Productos de upselling guardados: ${productos.map(p => p.nombre).join(', ')}`
        });
      }
    });

    const calcularTool = new DynamicStructuredTool({
      name: 'calcular',
      description: 'Realiza operaciones matemáticas básicas. SIEMPRE usa esta herramienta para sumas, restas y multiplicaciones de precios.',
      schema: z.object({
        operacion: z.enum(['suma', 'resta', 'multiplicacion', 'total']).describe('Tipo de operación'),
        numeros: z.array(z.number()).describe('Lista de números para la operación'),
        descripcion: z.string().optional().describe('Descripción de qué se está calculando')
      }),
      func: async ({ operacion, numeros, descripcion }) => {
        let resultado;
        switch (operacion) {
          case 'suma':
          case 'total':
            resultado = numeros.reduce((a, b) => a + b, 0);
            break;
          case 'resta':
            resultado = numeros.reduce((a, b) => a - b);
            break;
          case 'multiplicacion':
            resultado = numeros.reduce((a, b) => a * b, 1);
            break;
          default:
            resultado = 0;
        }
        return JSON.stringify({
          accion: 'calculo_realizado',
          operacion,
          numeros,
          resultado,
          descripcion: descripcion || `Resultado de ${operacion}`,
          resultado_formateado: `$${resultado}`
        });
      }
    });

    const mostrarOpcionesTool = new DynamicStructuredTool({
      name: 'mostrar_opciones',
      description: 'Muestra botones con opciones al usuario.',
      schema: z.object({
        pregunta: z.string(),
        opciones: z.array(z.string())
      }),
      func: async ({ pregunta, opciones }) => {
        return JSON.stringify({ accion: 'mostrar_opciones', pregunta, opciones });
      }
    });

    const confirmarPasoTool = new DynamicStructuredTool({
      name: 'confirmar_paso',
      description: 'Marca un paso de configuración como completado (1-5).',
      schema: z.object({
        paso: z.number().min(1).max(5),
        descripcion: z.string()
      }),
      func: async ({ paso, descripcion }) => {
        if (!session.pasos_completados) session.pasos_completados = [];
        if (!session.pasos_completados.includes(paso)) {
          session.pasos_completados.push(paso);
        }

        const todosCompletos = session.pasos_completados.length >= 5;

        // AUTO-TRIGGER: When step 5 is complete, automatically change to attention mode
        if (paso === 5 && todosCompletos) {
          session.mode = 'atencion';

          const mensajeBienvenida = `¡Hola! Bienvenido a ${session.config.nombre_restaurante || 'nuestro restaurante'}. Soy ${session.config.nombre_mesero || 'tu mesero digital'} 🤖\n\nEste es nuestro menú:\n${session.config.menu_productos?.map((p, i) => `${i + 1}. ${p.nombre} - $${p.precio}`).join('\n') || 'Menú disponible'}\n\n¿Qué te gustaría ordenar?`;

          saveSession();

          return JSON.stringify({
            accion: 'configuracion_completada_y_modo_cambiado',
            paso,
            descripcion,
            pasos_completados: session.pasos_completados,
            configuracion_completa: true,
            modo: 'atencion',
            mensaje_bienvenida: mensajeBienvenida,
            config: session.config
          });
        }

        saveSession();
        return JSON.stringify({
          accion: 'paso_completado',
          paso,
          descripcion,
          pasos_completados: session.pasos_completados,
          configuracion_completa: todosCompletos
        });
      }
    });

    const cambiarModoTool = new DynamicStructuredTool({
      name: 'cambiar_modo',
      description: 'Cambia entre modo "configuracion" y "atencion". SOLO usa cuando TODOS los 5 pasos estén completados.',
      schema: z.object({
        modo: z.enum(['configuracion', 'atencion']),
        mensaje: z.string()
      }),
      func: async ({ modo, mensaje }) => {
        // Verify all steps are complete before allowing mode change
        const pasosCompletos = session.pasos_completados?.length >= 5;

        if (modo === 'atencion' && !pasosCompletos) {
          return JSON.stringify({
            accion: 'modo_no_cambiado',
            error: 'Debes completar los 5 pasos de configuración primero',
            pasos_completados: session.pasos_completados || [],
            pasos_faltantes: 5 - (session.pasos_completados?.length || 0)
          });
        }

        session.mode = modo;
        saveSession();

        // Generate welcome message for attention mode
        const mensajeBienvenida = modo === 'atencion'
          ? `¡Hola! Bienvenido a ${session.config.nombre_restaurante || 'nuestro restaurante'}. Soy ${session.config.nombre_mesero || 'tu mesero digital'} 🤖\n\nEste es nuestro menú:\n${session.config.menu_productos?.map((p, i) => `${i + 1}. ${p.nombre} - $${p.precio}`).join('\n') || 'Menú disponible'}\n\n¿Qué te gustaría ordenar?`
          : mensaje;

        return JSON.stringify({
          accion: 'modo_cambiado',
          modo,
          mensaje: mensajeBienvenida,
          mensaje_bienvenida: mensajeBienvenida,
          config: session.config
        });
      }
    });

    const tomarPedidoTool = new DynamicStructuredTool({
      name: 'tomar_pedido',
      description: 'Registra un pedido COMPLETO con todos los detalles. Incluye productos, precios, modalidad de entrega, dirección y forma de pago.',
      schema: z.object({
        productos: z.array(z.string()).describe('Lista de nombres de productos pedidos'),
        productos_detalle: z.array(z.object({
          nombre: z.string(),
          precio: z.number()
        })).optional().describe('Lista detallada de productos con precios'),
        cantidad_total: z.number().describe('Cantidad total de items'),
        total: z.number().describe('Total a pagar en pesos (usa la herramienta calcular para obtener este número)'),
        modalidad: z.enum(['domicilio', 'sucursal']).describe('Modalidad de entrega'),
        direccion_cliente: z.string().optional().describe('Dirección de entrega si es a domicilio'),
        forma_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']).describe('Forma de pago elegida')
      }),
      func: async ({ productos, productos_detalle, cantidad_total, total, modalidad, direccion_cliente, forma_pago }) => {
        const pedido = {
          id: (session.pedidos?.length || 0) + 1,
          productos,
          productos_detalle: productos_detalle || productos.map(p => ({ nombre: p, precio: 0 })),
          cantidad_total,
          total,
          modalidad,
          direccion_cliente: direccion_cliente || null,
          direccion_sucursal: session.config.direccion || DEFAULT_ADDRESS.direccion,
          maps_link: session.config.maps_link || DEFAULT_ADDRESS.maps_link,
          forma_pago: forma_pago.charAt(0).toUpperCase() + forma_pago.slice(1),
          timestamp: new Date().toISOString(),
          estado: 'Confirmado'
        };
        if (!session.pedidos) session.pedidos = [];
        session.pedidos.push(pedido);
        saveSession();
        return JSON.stringify({
          accion: 'pedido_registrado',
          pedido,
          mensaje: `Ticket #${String(pedido.id).padStart(4, '0')} generado exitosamente`
        });
      }
    });

    const sugerirUpsellTool = new DynamicStructuredTool({
      name: 'sugerir_upsell',
      description: 'Sugiere productos adicionales al cliente. Usa los productos de upselling configurados.',
      schema: z.object({
        productos_sugeridos: z.array(z.string()).describe('Productos a sugerir con sus precios')
      }),
      func: async ({ productos_sugeridos }) => {
        const upsellingConfig = session.config.productos_upselling || [];
        return JSON.stringify({
          accion: 'upsell_sugerido',
          productos_sugeridos,
          productos_disponibles: upsellingConfig
        });
      }
    });

    const tools = [
      configuracionRapidaTool,
      activarModoAtencionTool,
      updateConfigTool,
      generarMenuTool,
      generarUpsellingTool,
      calcularTool,
      mostrarOpcionesTool,
      confirmarPasoTool,
      cambiarModoTool,
      tomarPedidoTool,
      sugerirUpsellTool
    ];

    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      returnIntermediateSteps: true,
      maxIterations: 10
    });

    let systemSuffix = "";
    if (session.mode === 'atencion') {
      systemSuffix = " [MODO: atencion - Atiende pedidos]";
    } else {
      systemSuffix = ` [MODO: configuracion]`;
    }

    const result = await agentExecutor.invoke({
      input: message + systemSuffix,
      chat_history: session.history.slice(-15),
      system_state: `Modo: ${session.mode}, Pasos completados: ${JSON.stringify(session.pasos_completados || [])}, Configuración: ${JSON.stringify(session.config)}`
    });

    session.history.push(new AIMessage(result.output));

    const toolCalls = [];
    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        try {
          const toolResult = typeof step.observation === 'string' ? JSON.parse(step.observation) : step.observation;
          toolCalls.push({
            tool: step.action.tool,
            input: step.action.toolInput,
            result: toolResult
          });
        } catch (e) {
          toolCalls.push({
            tool: step.action.tool,
            input: step.action.toolInput,
            result: { raw: step.observation }
          });
        }
      }
    }

    const autoActions = parseAutoActions(message, result.output, session, toolCalls.length > 0);

    res.json({
      response: result.output,
      toolCalls,
      autoActions,
      sessionState: {
        config: session.config,
        mode: session.mode,
        pedidos: session.pedidos,
        pasos_completados: session.pasos_completados || []
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error procesando mensaje',
      details: error.message
    });
  }
});

app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId] || {
    config: {},
    mode: 'configuracion',
    pedidos: [],
    pasos_completados: []
  };
  res.json(session);
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor COLMENA corriendo en http://localhost:${PORT}`);
    console.log(`💬 Mesero Digital listo para atender!`);
  });
}

module.exports = app;
