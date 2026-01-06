# 🐝 Mesero Digital Colmena - Demo Interactiva

Demo visual e interactiva de un agente de IA que funciona como mesero digital 24/7 para restaurantes, configurado con LangChain y OpenAI.

## ✨ Características

- **Chat Interactivo**: Interfaz de chat en tiempo real con el agente IA
- **Visualización de Acciones**: Panel lateral que muestra todas las acciones del agente en tiempo real
- **Flujo de Configuración en 5 Pasos**:
  1. Presentación
  2. Nombre del mesero y restaurante
  3. Tipo de productos
  4. Productos para upselling
  5. Horarios de atención
- **Modo de Atención**: Después de configurar, el agente toma pedidos y sugiere productos adicionales
- **Tools de LangChain**: 6 herramientas especializadas para diferentes acciones
- **Estado Visual**: Progreso, configuración actual y pedidos visibles en todo momento

## 🚀 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. La API key de OpenAI ya está configurada en el archivo `.env`

3. Iniciar el servidor:
```bash
npm start
```

4. Abrir el navegador en:
```
http://localhost:3000
```

## 🎯 Cómo usar la Demo

1. **Iniciar configuración**: Escribe "Hola" en el chat
2. **Seguir el flujo**: El agente te guiará paso a paso
3. **Observar el panel derecho**: Verás todas las acciones del agente en tiempo real:
   - Configuración actualizada
   - Herramientas utilizadas
   - Progreso de los pasos
   - Pedidos registrados

4. **Probar el modo atención**: Al finalizar la configuración, haz un pedido como cliente

## 🔧 Herramientas del Agente (LangChain Tools)

1. **actualizar_configuracion**: Guarda datos de configuración
2. **mostrar_opciones**: Presenta opciones visuales al usuario
3. **confirmar_paso**: Marca pasos como completados
4. **cambiar_modo**: Cambia entre modo configuración y atención
5. **tomar_pedido**: Registra pedidos de clientes
6. **sugerir_upsell**: Sugiere productos adicionales

## 📁 Estructura del Proyecto

```
Agente Restaurante Colmena/
├── server.js              # Backend Express + LangChain
├── package.json          # Dependencias
├── .env                  # API Key de OpenAI
├── public/
│   ├── index.html        # Interfaz principal
│   ├── styles.css        # Estilos visuales
│   └── script.js         # Lógica del frontend
└── README.md
```

## 💡 Ejemplo de Flujo

```
Usuario: Hola
Agente: 👋 ¡Hola! Soy el mesero digital...

Usuario: Tito
Agente: Perfecto 🙌 ¿En qué restaurante voy a trabajar?

Usuario: Taquería El Buen Taco
Agente: Listo. Soy Tito, el mesero digital de Taquería El Buen Taco 🌮

[... continúa el flujo de configuración ...]
```

## 🎨 Características Visuales

- Diseño moderno con gradientes y animaciones
- Panel dividido: Chat a la izquierda, Acciones a la derecha
- Indicadores de progreso en tiempo real
- Visualización de herramientas utilizadas
- Seguimiento de configuración completo
- Vista de pedidos con timestamps

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **IA**: LangChain + OpenAI (gpt-4o-mini)
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Herramientas**: LangChain Dynamic Tools

## 📝 Notas

- El modelo usado es `gpt-4o-mini` (no existe gpt-5-mini aún, pero gpt-4o-mini es el más reciente y eficiente)
- Cada sesión es independiente con su propio ID
- El botón "Nueva Sesión" reinicia todo el flujo
- Todas las acciones del agente son visibles en tiempo real

## 🎉 ¡Listo para Demo!

Esta aplicación está optimizada para presentaciones comerciales. El equipo de ventas solo necesita:
1. Abrir la aplicación
2. Escribir "Hola"
3. Dejar que el agente muestre su magia

¡Todo es visual y altamente interactivo! 🔥
