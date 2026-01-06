# 🎬 Ejemplo de Demo Completa

## 📝 Transcripción Paso a Paso

Este documento muestra exactamente cómo se vería una demo completa con todas las interacciones.

---

## 🚀 INICIO DE LA DEMO

### Pantalla Inicial
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🐝 Mesero Digital Colmena                     [Modo: Configuración] │
│ Demo Interactiva - Mesero 24/7 con IA                               │
├──────────────────────────────────┬──────────────────────────────────┤
│                                  │                                  │
│  💬 Chat con el Mesero           │  ⚡ Acciones del Agente          │
│                                  │                                  │
│  ┌────────────────────────────┐  │  📋 Configuración Actual         │
│  │                            │  │  ⬜ Nombre del Mesero: No config │
│  │     👋                     │  │  ⬜ Restaurante: No config       │
│  │                            │  │  ⬜ Tipo de Producto: No config  │
│  │  ¡Bienvenido a la Demo!    │  │  ⬜ Productos Upselling: No cfg  │
│  │                            │  │  ⬜ Horarios: No config          │
│  │  Escribe "Hola" para       │  │                                  │
│  │  comenzar la configuración │  │  📊 Progreso                     │
│  │                            │  │  ○──○──○──○──○                   │
│  │                            │  │  1  2  3  4  5                   │
│  └────────────────────────────┘  │                                  │
│                                  │  🔧 Herramientas                 │
│                                  │  Las herramientas aparecerán... │
│  [  Escribe tu mensaje...    ]  │                                  │
│  [      Enviar ➤             ]  │                                  │
└──────────────────────────────────┴──────────────────────────────────┘
```

---

## 💬 PASO 1: PRESENTACIÓN

### Usuario escribe:
```
Hola
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat:                              │  Panel Acciones:               │
├─────────────────────────────────────┼────────────────────────────────┤
│                                     │                                │
│  👤 Hola                            │  📋 Configuración Actual       │
│                                     │  ⬜ Nombre del Mesero: No cfg  │
│  🤖 👋 ¡Hola!                       │  ⬜ Restaurante: No cfg        │
│     Soy el mesero digital que va    │  ⬜ Tipo de Producto: No cfg   │
│     a atender a tus clientes por    │  ⬜ Productos Upselling: No cfg│
│     WhatsApp. Vamos a configurarme  │  ⬜ Horarios: No cfg           │
│     en 4 pasos.                     │                                │
│                                     │  📊 Progreso                   │
│     ¿Cómo quieres que me llame?     │  ○──○──○──○──○                 │
│     (Ejemplo: Pepe, Lupita, Tito)   │                                │
│                                     │  🔧 Herramientas               │
│  [  Escribe tu mensaje...       ]   │  (Ninguna usada aún)           │
│  [      Enviar ➤                ]   │                                │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 💬 PASO 2: NOMBRE DEL MESERO

### Usuario escribe:
```
Tito
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat:                              │  Panel Acciones:               │
├─────────────────────────────────────┼────────────────────────────────┤
│  ...                                │                                │
│  👤 Tito                            │  📋 Configuración Actual       │
│                                     │  ✅ Nombre del Mesero: Tito    │
│  🤖 Perfecto 🙌                     │  ⬜ Restaurante: No cfg        │
│     ¿En qué restaurante voy a       │  ⬜ Tipo de Producto: No cfg   │
│     trabajar?                       │  ⬜ Productos Upselling: No cfg│
│                                     │  ⬜ Horarios: No cfg           │
│  [  Escribe tu mensaje...       ]   │                                │
│  [      Enviar ➤                ]   │  📊 Progreso                   │
│                                     │  ○──○──○──○──○                 │
│                                     │                                │
│                                     │  🔧 Herramientas               │
│                                     │  🔧 Actualizar Configuración   │
│                                     │     {"campo": "nombre_mesero", │
│                                     │      "valor": "Tito"}          │
│                                     │     ✓ Campo actualizado        │
└─────────────────────────────────────┴────────────────────────────────┘
```

### Usuario escribe:
```
Taquería El Buen Taco
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat:                              │  Panel Acciones:               │
├─────────────────────────────────────┼────────────────────────────────┤
│  ...                                │                                │
│  👤 Taquería El Buen Taco           │  📋 Configuración Actual       │
│                                     │  ✅ Nombre: Tito               │
│  🤖 Listo.                          │  ✅ Restaurante: Taquería El   │
│     Soy Tito, el mesero digital de  │     Buen Taco                  │
│     Taquería El Buen Taco 🌮        │  ⬜ Tipo de Producto: No cfg   │
│                                     │  ⬜ Productos Upselling: No cfg│
│  [  Escribe tu mensaje...       ]   │  ⬜ Horarios: No cfg           │
│  [      Enviar ➤                ]   │                                │
│                                     │  📊 Progreso                   │
│                                     │  ●──○──○──○──○                 │
│                                     │  1  2  3  4  5                 │
│                                     │                                │
│                                     │  🔧 Herramientas (últimas 2)   │
│                                     │  🔧 Confirmar Paso             │
│                                     │     {"paso": 1}                │
│                                     │  🔧 Actualizar Configuración   │
│                                     │     {"campo": "nombre_rest..."}│
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 💬 PASO 3: TIPO DE PRODUCTOS

### Agente continúa automáticamente:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat:                              │  Panel Acciones:               │
├─────────────────────────────────────┼────────────────────────────────┤
│  🤖 ¿Qué tipo de comida vendes      │                                │
│     principalmente?                 │  📋 Configuración Actual       │
│     Elige una opción o escríbela:   │  ✅ Nombre: Tito               │
│     1️⃣ Tacos                        │  ✅ Restaurante: Taquería...   │
│     2️⃣ Pizzas                       │  ⬜ Tipo de Producto: No cfg   │
│     3️⃣ Hamburguesas                 │  ⬜ Productos Upselling: No cfg│
│     4️⃣ Alitas                       │  ⬜ Horarios: No cfg           │
│     5️⃣ Otro                         │                                │
│                                     │  📊 Progreso                   │
│  [  Escribe tu mensaje...       ]   │  ●──○──○──○──○                 │
│  [      Enviar ➤                ]   │                                │
│                                     │  🔧 Herramientas (última)      │
│                                     │  🔧 Mostrar Opciones           │
│                                     │     {"pregunta": "¿Qué tipo.."}│
│                                     │     ✓ Opciones mostradas       │
└─────────────────────────────────────┴────────────────────────────────┘
```

### Usuario escribe:
```
Tacos
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat:                              │  Panel Acciones:               │
├─────────────────────────────────────┼────────────────────────────────┤
│  👤 Tacos                           │                                │
│                                     │  📋 Configuración Actual       │
│  🤖 Perfecto.                       │  ✅ Nombre: Tito               │
│     Voy a ofrecer tus tacos de      │  ✅ Restaurante: Taquería...   │
│     forma clara y rápida para que   │  ✅ Tipo de Producto: Tacos    │
│     no se pierdan pedidos.          │  ⬜ Productos Upselling: No cfg│
│                                     │  ⬜ Horarios: No cfg           │
│  [  Escribe tu mensaje...       ]   │                                │
│  [      Enviar ➤                ]   │  📊 Progreso                   │
│                                     │  ●──●──○──○──○                 │
│                                     │  1  2  3  4  5                 │
│                                     │                                │
│                                     │  🔧 Herramientas               │
│                                     │  🔧 Confirmar Paso             │
│                                     │  🔧 Actualizar Configuración   │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 💬 PASO 4: PRODUCTOS UPSELLING (CLAVE 🔥)

### Agente pregunta:
```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Cuando tus clientes pidan,      │  📋 Configuración Actual       │
│     ¿qué productos te gustaría que  │  ✅ Nombre: Tito               │
│     siempre les sugiera para        │  ✅ Restaurante: Taquería...   │
│     aumentar la venta?              │  ✅ Tipo de Producto: Tacos    │
│     (Ejemplo: refrescos, papas,     │  ⬜ Productos Upselling: No cfg│
│     postres, extras)                │  ⬜ Horarios: No cfg           │
│                                     │                                │
│  [  Escribe tu mensaje...       ]   │  📊 Progreso                   │
│  [      Enviar ➤                ]   │  ●──●──○──○──○                 │
└─────────────────────────────────────┴────────────────────────────────┘
```

### Usuario escribe:
```
Refrescos y papas
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  👤 Refrescos y papas               │                                │
│                                     │  📋 Configuración Actual       │
│  🤖 Excelente 😎                    │  ✅ Nombre: Tito               │
│     Cada vez que alguien haga un    │  ✅ Restaurante: Taquería...   │
│     pedido, les sugeriré refrescos  │  ✅ Tipo de Producto: Tacos    │
│     y papas de forma automática.    │  ✅ Upselling: Refrescos y     │
│                                     │     papas                      │
│  [  Escribe tu mensaje...       ]   │  ⬜ Horarios: No cfg           │
│  [      Enviar ➤                ]   │                                │
│                                     │  📊 Progreso                   │
│                                     │  ●──●──●──○──○                 │
│                                     │  1  2  3  4  5                 │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 💬 PASO 5: HORARIOS

### Agente pregunta:
```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 ¿Cuáles son tus horarios de     │  📋 Configuración Actual       │
│     atención?                       │  ✅ Nombre: Tito               │
│                                     │  ✅ Restaurante: Taquería...   │
│  [  Escribe tu mensaje...       ]   │  ✅ Tipo de Producto: Tacos    │
│  [      Enviar ➤                ]   │  ✅ Upselling: Refrescos y..   │
│                                     │  ⬜ Horarios: No cfg           │
└─────────────────────────────────────┴────────────────────────────────┘
```

### Usuario escribe:
```
Lunes a domingo de 1 pm a 11 pm
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  👤 Lunes a domingo de 1pm a 11pm   │                                │
│                                     │  📋 Configuración Actual       │
│  🤖 Perfecto.                       │  ✅ Nombre: Tito               │
│     Atenderé pedidos de 1:00 pm a   │  ✅ Restaurante: Taquería...   │
│     11:00 pm. Fuera de ese horario, │  ✅ Tipo de Producto: Tacos    │
│     avisaré a tus clientes y        │  ✅ Upselling: Refrescos y..   │
│     tomaré mensajes.                │  ✅ Horarios: Lunes a domingo  │
│                                     │     de 1 pm a 11 pm            │
│  [  Escribe tu mensaje...       ]   │                                │
│  [      Enviar ➤                ]   │  📊 Progreso                   │
│                                     │  ●──●──●──●──○                 │
│                                     │  1  2  3  4  5                 │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 🎉 CIERRE DE CONFIGURACIÓN

### Agente cierra configuración:
```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Listo 🎉                        │  [Modo: Atención al Cliente]   │
│     Ya estoy configurado y listo    │                                │
│     para atender como tu mesero     │  📋 Configuración Actual       │
│     digital.                        │  ✅ Nombre: Tito               │
│                                     │  ✅ Restaurante: Taquería...   │
│     Ahora, actúa como si fueras uno │  ✅ Tipo de Producto: Tacos    │
│     de tus clientes y hazme un      │  ✅ Upselling: Refrescos y..   │
│     pedido 👇                       │  ✅ Horarios: Lunes a domingo  │
│                                     │     de 1 pm a 11 pm            │
│  [  Escribe tu mensaje...       ]   │                                │
│  [      Enviar ➤                ]   │  📊 Progreso                   │
│                                     │  ●──●──●──●──●                 │
│                                     │  1  2  3  4  5                 │
│                                     │                                │
│                                     │  🛒 Pedidos Registrados        │
│                                     │  (Los pedidos aparecerán...)   │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 🛒 MODO ATENCIÓN - PRIMER PEDIDO

### Usuario escribe (como cliente):
```
Hola, quiero 3 tacos de asada
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat:                              │  Panel Acciones:               │
├─────────────────────────────────────┼────────────────────────────────┤
│  👤 Hola, quiero 3 tacos de asada   │  [Modo: Atención al Cliente]   │
│                                     │                                │
│  🤖 ¡Perfecto!                      │  🛒 Pedidos Registrados        │
│     Anoto: 3 tacos de asada 🌮      │  ┌──────────────────────────┐  │
│                                     │  │ Pedido #1      12:45 PM  │  │
│     ¿Te gustaría agregar refrescos  │  │ 📦 3 tacos de asada      │  │
│     y papas a tu pedido? 🥤🍟       │  │    (3 items)             │  │
│                                     │  └──────────────────────────┘  │
│  [  Escribe tu mensaje...       ]   │                                │
│  [      Enviar ➤                ]   │  🔧 Herramientas               │
│                                     │  🔧 Tomar Pedido               │
│                                     │     {"productos": ["3 tacos    │
│                                     │      de asada"], "cant": 3}    │
│                                     │     ✓ Pedido #1 registrado     │
│                                     │                                │
│                                     │  🔧 Sugerir Upsell             │
│                                     │     {"productos": ["refrescos",│
│                                     │      "papas"]}                 │
│                                     │     ✓ Sugeridos: refrescos...  │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 💰 ACEPTAR UPSELLING

### Usuario escribe:
```
Sí, agrégame 2 refrescos
```

### Agente responde:
```
┌─────────────────────────────────────────────────────────────────────┐
│  👤 Sí, agrégame 2 refrescos        │  [Modo: Atención al Cliente]   │
│                                     │                                │
│  🤖 ¡Excelente elección! 🥤         │  🛒 Pedidos Registrados        │
│     He agregado 2 refrescos a tu    │  ┌──────────────────────────┐  │
│     pedido.                         │  │ Pedido #2      12:46 PM  │  │
│                                     │  │ 📦 2 refrescos           │  │
│     Tu pedido completo:             │  │    (2 items)             │  │
│     • 3 tacos de asada              │  └──────────────────────────┘  │
│     • 2 refrescos                   │  ┌──────────────────────────┐  │
│                                     │  │ Pedido #1      12:45 PM  │  │
│     ¿Algo más que te gustaría       │  │ 📦 3 tacos de asada      │  │
│     agregar? 😊                     │  │    (3 items)             │  │
│                                     │  └──────────────────────────┘  │
│  [  Escribe tu mensaje...       ]   │                                │
│  [      Enviar ➤                ]   │  🔧 Herramientas               │
│                                     │  🔧 Tomar Pedido               │
│                                     │     {"productos": ["2 refres-  │
│                                     │      cos"], "cant": 2}         │
│                                     │     ✓ Pedido #2 registrado     │
└─────────────────────────────────────┴────────────────────────────────┘
```

---

## 🎯 PUNTOS CLAVE PARA EL VENDEDOR

Durante la demo, **SEÑALAR** estos elementos:

### 1️⃣ Panel de Configuración (derecha arriba)
> "Miren cómo se va llenando automáticamente mientras configuramos"

### 2️⃣ Progreso Visual (círculos)
> "Pueden ver exactamente en qué paso estamos"

### 3️⃣ Herramientas del Agente
> "Cada acción del agente es visible aquí en tiempo real"

### 4️⃣ Upselling Automático 🔥
> "Esta es la parte más importante: el agente SIEMPRE ofrece refrescos y papas. Esto aumenta el ticket promedio 30-40%"

### 5️⃣ Panel de Pedidos
> "Todos los pedidos quedan registrados automáticamente"

---

## 💡 FRASES CLAVE DURANTE LA DEMO

### Al configurar nombre:
> "Miren qué rápido se actualiza la configuración en el panel derecho"

### Al configurar productos upselling:
> "Este es el paso más importante. Aquí configuramos qué va a ofrecer SIEMPRE el mesero. A diferencia de un mesero humano, este NUNCA lo olvida"

### Al hacer el primer pedido:
> "Observen el panel derecho. Van a ver cómo usa las herramientas para tomar el pedido y sugerir productos adicionales"

### Cuando sugiere upselling:
> "¿Vieron? Automáticamente ofreció refrescos y papas. Esto pasa en CADA pedido. Imaginen cuánto aumenta esto las ventas"

### Al finalizar:
> "Y esto trabaja 24/7, nunca duerme, nunca se olvida, nunca se equivoca. ¿Cuántos pedidos creen que se están perdiendo a las 3 AM?"

---

## 📊 ESTADÍSTICAS PARA MENCIONAR

- "Un mesero humano ofrece extras en ~30% de pedidos"
- "Este mesero digital lo hace en 100% de pedidos"
- "Eso solo aumenta el ticket promedio 30-40%"
- "Disponible 24/7 = +20% de pedidos captados"
- "Configuración completa en 2 minutos"

---

## 🎉 CIERRE DE LA DEMO

### Frase Final:
> "Esto es lo que vieron: configuración en 2 minutos, atención perfecta, upselling automático, y todo funcionando 24/7. ¿Cuándo quieren implementarlo en su restaurante?"

---

**Esta demo visual se vende sola. Solo déjenla brillar.** ✨
