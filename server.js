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

try {
  if (fs.existsSync(SESSIONS_FILE)) {
    // Basic load
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    sessions = JSON.parse(data);

    // Rehydrate history - simplified
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

// EXPORT TO ALLOW FALLBACK SAVING
exports.sessions = sessions;

// Helper to save sessions
function saveSessionsToFile() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

const updateConfigTool = new DynamicStructuredTool({
  name: 'actualizar_configuracion',
  description: 'Actualiza la configuración del mesero digital con los datos proporcionados por el dueño del restaurante',
  schema: z.object({
    campo: z.enum(['nombre_mesero', 'nombre_restaurante', 'tipo_producto', 'productos_upselling', 'horarios']).describe('El campo de configuración a actualizar'),
    valor: z.string().describe('El valor para ese campo')
  }),
  func: async ({ campo, valor }, runManager) => {
    const sessionId = runManager?.metadata?.sessionId || 'default';
    if (!sessions[sessionId]) {
      sessions[sessionId] = { config: {} };
    }
    sessions[sessionId].config[campo] = valor;
    return JSON.stringify({
      accion: 'configuracion_actualizada',
      campo,
      valor,
      config_actual: sessions[sessionId].config
    });
  }
});

const mostrarOpcionesTool = new DynamicStructuredTool({
  name: 'mostrar_opciones',
  description: 'Muestra opciones visuales al usuario para que seleccione',
  schema: z.object({
    pregunta: z.string().describe('La pregunta a mostrar'),
    opciones: z.array(z.string()).describe('Lista de opciones disponibles')
  }),
  func: async ({ pregunta, opciones }) => {
    return JSON.stringify({
      accion: 'mostrar_opciones',
      pregunta,
      opciones
    });
  }
});

const confirmarPasoTool = new DynamicStructuredTool({
  name: 'confirmar_paso',
  description: 'Confirma que un paso de la configuración se completó correctamente',
  schema: z.object({
    paso: z.number().describe('Número del paso completado (1-5)'),
    descripcion: z.string().describe('Descripción de lo que se completó')
  }),
  func: async ({ paso, descripcion }) => {
    return JSON.stringify({
      accion: 'paso_completado',
      paso,
      descripcion
    });
  }
});

const cambiarModoTool = new DynamicStructuredTool({
  name: 'cambiar_modo',
  description: 'Cambia el modo de operación del mesero (configuracion o atencion)',
  schema: z.object({
    modo: z.enum(['configuracion', 'atencion']).describe('El modo al que cambiar'),
    mensaje: z.string().describe('Mensaje para el usuario')
  }),
  func: async ({ modo, mensaje }, runManager) => {
    const sessionId = runManager?.metadata?.sessionId || 'default';
    if (!sessions[sessionId]) {
      sessions[sessionId] = { config: {}, mode: 'configuracion' };
    }
    sessions[sessionId].mode = modo;
    return JSON.stringify({
      accion: 'modo_cambiado',
      modo,
      mensaje
    });
  }
});

const tomarPedidoTool = new DynamicStructuredTool({
  name: 'tomar_pedido',
  description: 'Registra un pedido del cliente con los productos solicitados',
  schema: z.object({
    productos: z.array(z.string()).describe('Lista de productos pedidos'),
    cantidad_total: z.number().describe('Cantidad total de items')
  }),
  func: async ({ productos, cantidad_total }, runManager) => {
    const sessionId = runManager?.metadata?.sessionId || 'default';
    if (!sessions[sessionId]) {
      sessions[sessionId] = { config: {}, pedidos: [] };
    }
    if (!sessions[sessionId].pedidos) {
      sessions[sessionId].pedidos = [];
    }
    const pedido = {
      id: sessions[sessionId].pedidos.length + 1,
      productos,
      cantidad_total,
      timestamp: new Date().toISOString()
    };
    sessions[sessionId].pedidos.push(pedido);
    return JSON.stringify({
      accion: 'pedido_registrado',
      pedido
    });
  }
});

const sugerirUpsellTool = new DynamicStructuredTool({
  name: 'sugerir_upsell',
  description: 'Sugiere productos adicionales al cliente para aumentar el ticket promedio',
  schema: z.object({
    productos_sugeridos: z.array(z.string()).describe('Productos que se sugieren al cliente')
  }),
  func: async ({ productos_sugeridos }) => {
    return JSON.stringify({
      accion: 'upsell_sugerido',
      productos_sugeridos
    });
  }
});

const tools = [
  updateConfigTool,
  mostrarOpcionesTool,
  confirmarPasoTool,
  cambiarModoTool,
  tomarPedidoTool,
  sugerirUpsellTool
];

const prompt = ChatPromptTemplate.fromMessages([
  ['system', `Eres un mesero digital inteligente para restaurantes que funciona 24/7.
  
  Tu objetivo principal es:
  1. CONFIGURACIÓN: Ayudar al dueño del restaurante a configurarte en 5 pasos.
  2. ATENCIÓN: Atender pedidos de clientes y maximizar ventas con upselling.

  ESTADO ACTUAL DE LA SESIÓN: {system_state}

  MODO CONFIGURACIÓN (se activa cuando el estado es "configuracion"):
  
  Paso 1 - PRESENTACIÓN:
  - Di exactamente: "👋 ¡Hola! Soy el mesero digital que va a atender a tus clientes por WhatsApp. Vamos a configurarme en 4 pasos."
  - Luego pregunta: "¿Cómo quieres que me llame? (Ejemplo: Pepe, Lupita, Tito, etc.)"
  
  Paso 2 - NOMBRE DEL MESERO Y RESTAURANTE:
  - Cuando den el nombre, DEBES llamar primero la tool "actualizar_configuracion" con campo "nombre_mesero" y el valor dado
  - Luego di "Perfecto 🙌 ¿En qué restaurante voy a trabajar?"
  - Cuando den el restaurante, DEBES llamar la tool "actualizar_configuracion" con campo "nombre_restaurante" y el valor dado
  - Luego di "Listo. Soy [nombre], el mesero digital de [restaurante] 🌮"
  - DEBES llamar la tool "confirmar_paso" con paso 1
  
  Paso 3 - TIPO DE PRODUCTOS:
  - Pregunta: "¿Qué tipo de comida vendes principalmente?"
  - DEBES llamar la tool "mostrar_opciones" con opciones: ["Tacos", "Pizzas", "Hamburguesas", "Alitas", "Otro"]
  - Cuando respondan, DEBES llamar la tool "actualizar_configuracion" con campo "tipo_producto" y el valor dado
  - Luego di "Perfecto. Voy a ofrecer tus [productos] de forma clara y rápida para que no se pierdan pedidos."
  - DEBES llamar la tool "confirmar_paso" con paso 2
  
  Paso 4 - PRODUCTOS UPSELLING (MUY IMPORTANTE):
  - Pregunta: "Cuando tus clientes pidan, ¿qué productos te gustaría que siempre les sugiera para aumentar la venta? (Ejemplo: refrescos, papas, postres, extras)"
  - Cuando respondan, DEBES llamar la tool "actualizar_configuracion" con campo "productos_upselling" y el valor dado
  - Luego di "Excelente 😎 Cada vez que alguien haga un pedido, les sugeriré [productos] de forma automática."
  - DEBES llamar la tool "confirmar_paso" con paso 3
  
  Paso 5 - HORARIOS:
  - Pregunta: "¿Cuáles son tus horarios de atención?"
  - Cuando respondan, DEBES llamar la tool "actualizar_configuracion" con campo "horarios" y el valor dado
  - Luego di "Perfecto. Atenderé pedidos de [horarios]. Fuera de ese horario, avisaré a tus clientes y tomaré mensajes."
  - DEBES llamar la tool "confirmar_paso" con paso 4
  
  CIERRE DE CONFIGURACIÓN:
  - Di: "Listo 🎉 Ya estoy configurado y listo para atender como tu mesero digital. Ahora, actúa como si fueras uno de tus clientes y hazme un pedido 👇"
  - DEBES llamar la tool "confirmar_paso" con paso 5
  - DEBES llamar la tool "cambiar_modo" con modo "atencion"
  
  MODO ATENCIÓN (se activa cuando el estado es "atencion"):
  - YA NO PIDAS CONFIGURACIÓN.
  - Saluda amigablemente si es necesario.
  
  FLUJO DE PEDIDO (IMPORTANTE):
  1. CUANDO EL CLIENTE PIDE ALGO:
     - NO registres el pedido todavía.
     - DEBES llamar la tool "sugerir_upsell" inmediatamente para ofrecer complementos.
     - Responde: "Anotado [producto]. ¿Te gustaría agregar [complemento] por un poco más?"
  
  2. CUANDO EL CLIENTE RESPONDE AL UPSELLING (Sí o No):
     - Confirma el pedido FINAL completo.
     - Di: "Perfecto. Confirmo tu orden: [resumen completo]. ¿Es correcto?"
  
  3. SOLO CUANDO EL CLIENTE CONFIRMA (Dice "Sí", "Correcto", "Ok"):
     - ENTONCES y SOLO ENTONCES llama la tool "tomar_pedido" con TODOS los productos juntos.
     - Di: "¡Excelente! Tu pedido ha sido registrado (Ticket generado)."

  REGLAS CRÍTICAS DE REGISTRO:
  - NUNCA uses "tomar_pedido" antes de que el cliente confirme el total.
  - El ticket debe generarse UNA SOLA VEZ con todo incluido.
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

// Función para parsear acciones automáticamente del texto
function parseAutoActions(userMessage, agentResponse, session) {
  const actions = [];
  const lowerResponse = agentResponse.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();

  // Detectar si es fase de configuración
  if (!session.mode || session.mode === 'configuracion') {
    // Detectar nombre del mesero
    if (lowerResponse.includes('perfecto') && lowerResponse.includes('restaurante')) {
      const nombre = userMessage.trim();
      if (nombre && nombre.length < 30) {
        session.config.nombre_mesero = nombre;
        actions.push({
          tipo: 'config_actualizada',
          campo: 'nombre_mesero',
          valor: nombre
        });
      }
    }

    // Detectar nombre del restaurante
    if (lowerResponse.includes('listo. soy') || lowerResponse.includes('mesero digital de')) {
      const matches = userMessage.match(/^[A-Za-zÀ-ÿ0-9\s]+$/);
      if (matches && userMessage.length < 50) {
        session.config.nombre_restaurante = userMessage.trim();
        actions.push({
          tipo: 'config_actualizada',
          campo: 'nombre_restaurante',
          valor: userMessage.trim()
        });
      }
    }

    // Detectar tipo de producto
    if (lowerMessage.includes('tacos') || lowerMessage.includes('pizzas') ||
      lowerMessage.includes('hamburguesas') || lowerMessage.includes('alitas')) {
      session.config.tipo_producto = userMessage.trim();
      actions.push({
        tipo: 'config_actualizada',
        campo: 'tipo_producto',
        valor: userMessage.trim()
      });
    }

    // Detectar productos upselling
    if (lowerResponse.includes('sugeriré') && (lowerMessage.includes('refrescos') ||
      lowerMessage.includes('papas') || lowerMessage.includes('postres'))) {
      session.config.productos_upselling = userMessage.trim();
      actions.push({
        tipo: 'config_actualizada',
        campo: 'productos_upselling',
        valor: userMessage.trim()
      });
    }

    // Detectar horarios
    if (lowerResponse.includes('atenderé pedidos') || lowerMessage.includes('lunes')) {
      session.config.horarios = userMessage.trim();
      actions.push({
        tipo: 'config_actualizada',
        campo: 'horarios',
        valor: userMessage.trim()
      });
    }

    // Detectar fin de configuración
    if (lowerResponse.includes('ya estoy configurado') || lowerResponse.includes('actúa como si fueras')) {
      session.mode = 'atencion';
      actions.push({
        tipo: 'modo_cambiado',
        modo: 'atencion'
      });
    }
  }

  // Detectar pedidos en modo atención
  if (session.mode === 'atencion') {
    // Detectar pedido
    const pedidoPatterns = [
      /quiero\s+(\d+)\s+(.*)/i,
      /(\d+)\s+(tacos?|pizzas?|hamburguesas?|alitas?)/i,
      /dame\s+(.*)/i,
      /pido\s+(.*)/i
    ];

    for (const pattern of pedidoPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && lowerResponse.includes('anoto')) {
        if (!session.pedidos) session.pedidos = [];

        const pedido = {
          id: session.pedidos.length + 1,
          productos: [userMessage],
          timestamp: new Date().toISOString(),
          estado: 'registrado'
        };

        session.pedidos.push(pedido);

        actions.push({
          tipo: 'pedido_registrado',
          pedido
        });
        break;
      }
    }

    // Detectar upselling
    if ((lowerResponse.includes('agregar') || lowerResponse.includes('gustaría')) &&
      (lowerResponse.includes('refrescos') || lowerResponse.includes('papas'))) {
      actions.push({
        tipo: 'upselling_ofrecido',
        productos: session.config.productos_upselling || 'productos adicionales'
      });
    }

    // Detectar aceptación de upselling
    if ((lowerMessage.includes('sí') || lowerMessage.includes('si') ||
      lowerMessage.includes('agrégame') || lowerMessage.includes('dame')) &&
      (lowerMessage.includes('refresco') || lowerMessage.includes('papa'))) {

      if (!session.pedidos) session.pedidos = [];

      const pedido = {
        id: session.pedidos.length + 1,
        productos: [userMessage],
        timestamp: new Date().toISOString(),
        estado: 'adicional',
        esUpselling: true
      };

      session.pedidos.push(pedido);

      actions.push({
        tipo: 'upselling_aceptado',
        pedido
      });
    }
  }

  return actions;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    // Initialize session if not exists
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        config: {},
        mode: 'configuracion',
        history: [],
        pedidos: []
      };
    }

    const session = sessions[sessionId];
    session.history.push(new HumanMessage(message));

    // --- TOOL DEFINITIONS WITH CLOSED-OVER SESSIONID ---

    // Helper to save session state immediately
    // Helper to save session state immediately
    const saveSession = () => {
      saveSessionsToFile();
    };

    const updateConfigTool = new DynamicStructuredTool({
      name: 'actualizar_configuracion',
      description: 'Actualiza la configuración del mesero digital. ÚSALO cuando el usuario te de un dato: nombre, restaurante, tipo de comida, horarios.',
      schema: z.object({
        campo: z.enum(['nombre_mesero', 'nombre_restaurante', 'tipo_producto', 'productos_upselling', 'horarios']),
        valor: z.string()
      }),
      func: async ({ campo, valor }) => {
        session.config[campo] = valor;
        saveSession();
        return JSON.stringify({ accion: 'configuracion_actualizada', campo, valor });
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
        paso: z.number(),
        descripcion: z.string()
      }),
      func: async ({ paso, descripcion }) => {
        return JSON.stringify({ accion: 'paso_completado', paso, descripcion });
      }
    });

    const cambiarModoTool = new DynamicStructuredTool({
      name: 'cambiar_modo',
      description: 'Cambia entre modo "configuracion" y "atencion".',
      schema: z.object({
        modo: z.enum(['configuracion', 'atencion']),
        mensaje: z.string()
      }),
      func: async ({ modo, mensaje }) => {
        session.mode = modo;
        saveSession();
        return JSON.stringify({ accion: 'modo_cambiado', modo, mensaje });
      }
    });

    const tomarPedidoTool = new DynamicStructuredTool({
      name: 'tomar_pedido',
      description: 'Registra un pedido. ÚSALO SIEMPRE que el cliente pida algo.',
      schema: z.object({
        productos: z.array(z.string()),
        cantidad_total: z.number()
      }),
      func: async ({ productos, cantidad_total }) => {
        const pedido = {
          id: (session.pedidos?.length || 0) + 1,
          productos,
          cantidad_total,
          timestamp: new Date().toISOString(),
          estado: 'registrado'
        };
        if (!session.pedidos) session.pedidos = [];
        session.pedidos.push(pedido);
        saveSession();
        return JSON.stringify({ accion: 'pedido_registrado', pedido });
      }
    });

    const sugerirUpsellTool = new DynamicStructuredTool({
      name: 'sugerir_upsell',
      description: 'Muestra opciones de upselling (bebidas, postres) configuradas.',
      schema: z.object({
        productos_sugeridos: z.array(z.string())
      }),
      func: async ({ productos_sugeridos }) => {
        return JSON.stringify({ accion: 'upsell_sugerido', productos_sugeridos });
      }
    });

    const tools = [
      updateConfigTool,
      mostrarOpcionesTool,
      confirmarPasoTool,
      cambiarModoTool,
      tomarPedidoTool,
      sugerirUpsellTool
    ];

    // --- AGENT EXECUTION ---

    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      returnIntermediateSteps: true, // IMPORTANT: Allows frontend to see tool calls
      maxIterations: 5
    });

    // Provide context about current state in the input or system prompt update?
    // We'll stick to history, but we can verify mode logic in prompt
    // Let's rely on the predefined prompt but ensure the Agent knows it MUST use tools.

    // Inject current state into "system" context if possible, or just trust the history?
    // Let's trust history but if mode is attention, we should hint it.
    let systemSuffix = "";
    if (session.mode === 'atencion') {
      systemSuffix = " [SISTEMA: ESTÁS EN MODO ATENCIÓN. ACTÚA COMO MESERO. NO CONFIGURES NADA. SI PIDEN ALGO, USA tomar_pedido.]";
    }

    const result = await agentExecutor.invoke({
      input: message + systemSuffix,
      chat_history: session.history.slice(-15),
      system_state: `Modo: ${session.mode}, Configuración: ${JSON.stringify(session.config)}`
    });

    session.history.push(new AIMessage(result.output));

    const toolCalls = [];
    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        try {
          // Langchain intermediate steps: step.action (tool, toolInput, log) and step.observation (output)
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

    // Parseo manual de acciones (Fallback)
    // Pasamos toolCalls para que el fallback sepa si ya se ejecutó algo
    const autoActions = parseAutoActions(message, result.output, session, toolCalls.length > 0);

    res.json({
      response: result.output,
      toolCalls,
      autoActions,
      sessionState: {
        config: session.config,
        mode: session.mode,
        pedidos: session.pedidos
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

// Función para parsear acciones automáticamente del texto
function parseAutoActions(userMessage, agentResponse, session, toolCallsExecuted) {
  const actions = [];
  const lowerResponse = agentResponse.toLowerCase();

  // Fallback mode change if LLM forgets to call tool but says it's ready
  // We check for "listo" AND some indication of being configured or ready to serve
  if ((!session.mode || session.mode === 'configuracion')) {
    // Broaden criteria: "listo" + "configurado" OR "listo" + "atender" OR "ya estoy listo"
    if ((lowerResponse.includes('listo') || lowerResponse.includes('excelente') || lowerResponse.includes('perfecto')) &&
      (lowerResponse.includes('configurado') || lowerResponse.includes('atender') || lowerResponse.includes('actúa'))) {

      if (session.mode !== 'atencion') {
        session.mode = 'atencion';
        actions.push({
          tipo: 'modo_cambiado',
          modo: 'atencion'
        });
        // Force save session here just in case
        try {
          const fs = require('fs');
          const path = require('path');
          fs.writeFileSync(path.join(__dirname, 'sessions.json'), JSON.stringify(require('./server').sessions || {}, null, 2));
        } catch (e) { }
      }
    }
  }

  // Fallback logic for detecting orders REMOVED to avoid false positives (e.g. "Si" becoming a ticket)
  // We rely significantly on the Agent Prompt and Tools now.

  return actions;
}

app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId] || { config: {}, mode: 'configuracion', pedidos: [] };
  res.json(session);
});

const PORT = process.env.PORT || 3000;

// Solo iniciar el servidor si NO estamos en un entorno serverless (Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`💬 Demo del Mesero Digital Colmena lista!`);
  });
}

// Exportar la app para Vercel
module.exports = app;
