# 🏗️ Arquitectura Técnica - Mesero Digital Colmena

## 📐 Visión General

Aplicación web full-stack que demuestra un agente conversacional de IA configurado con LangChain para automatizar la atención en restaurantes.

---

## 🔧 Stack Tecnológico

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **IA Framework**: LangChain
- **LLM**: OpenAI GPT-4o-mini
- **Tools**: LangChain DynamicStructuredTool
- **Validación**: Zod schemas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive con gradientes y animaciones
- **JavaScript**: Vanilla JS (sin frameworks)
- **API Communication**: Fetch API

---

## 🎯 Componentes Principales

### 1. Servidor Express (`server.js`)

#### Gestión de Sesiones
```javascript
const sessions = {};
// Estructura:
{
  sessionId: {
    config: {},      // Configuración del mesero
    mode: 'configuracion' | 'atencion',
    history: [],     // Historial de mensajes
    pedidos: []      // Pedidos registrados
  }
}
```

#### Endpoints

**POST `/api/chat`**
- Recibe mensaje del usuario
- Ejecuta el agente LangChain
- Retorna respuesta + tool calls + estado de sesión

**GET `/api/session/:sessionId`**
- Obtiene estado actual de una sesión

---

### 2. Agente LangChain

#### Configuración
- **Modelo**: `gpt-4o-mini`
- **Temperature**: 0.7 (balance creatividad/consistencia)
- **Max Iterations**: 5 (previene loops infinitos)
- **Tipo**: OpenAI Functions Agent (soporte nativo para tools)

#### Prompt Template
Incluye:
- System message con instrucciones detalladas
- Placeholder para historial de chat
- Placeholder para input del usuario
- Placeholder para agent scratchpad (pensamiento interno)

---

### 3. LangChain Tools (6 herramientas)

#### 1. `actualizar_configuracion`
**Propósito**: Guardar datos de configuración

**Schema**:
```typescript
{
  campo: 'nombre_mesero' | 'nombre_restaurante' | 'tipo_producto' |
         'productos_upselling' | 'horarios',
  valor: string
}
```

**Output**: Config actualizada + confirmación

#### 2. `mostrar_opciones`
**Propósito**: Presentar opciones visuales al usuario

**Schema**:
```typescript
{
  pregunta: string,
  opciones: string[]
}
```

**Output**: Acción de mostrar opciones

#### 3. `confirmar_paso`
**Propósito**: Marcar paso como completado (progreso visual)

**Schema**:
```typescript
{
  paso: number (1-5),
  descripcion: string
}
```

**Output**: Confirmación de paso

#### 4. `cambiar_modo`
**Propósito**: Cambiar entre modo configuración y atención

**Schema**:
```typescript
{
  modo: 'configuracion' | 'atencion',
  mensaje: string
}
```

**Output**: Modo actualizado

#### 5. `tomar_pedido`
**Propósito**: Registrar pedido del cliente

**Schema**:
```typescript
{
  productos: string[],
  cantidad_total: number
}
```

**Output**: Pedido registrado con ID y timestamp

#### 6. `sugerir_upsell`
**Propósito**: Sugerir productos adicionales (aumentar ticket)

**Schema**:
```typescript
{
  productos_sugeridos: string[]
}
```

**Output**: Lista de productos sugeridos

---

### 4. Frontend

#### Estructura de Archivos
```
public/
├── index.html      # Estructura HTML
├── styles.css      # Estilos y animaciones
└── script.js       # Lógica de interacción
```

#### Componentes UI

1. **Header**: Logo + badge de estado
2. **Chat Section**:
   - Mensajes (user/agent)
   - Input + botón enviar
   - Indicador de typing
3. **Actions Panel**:
   - Configuración actual
   - Progreso de pasos
   - Herramientas utilizadas
   - Pedidos registrados

#### Flujo de Datos Frontend

```
Usuario escribe mensaje
    ↓
sendMessage()
    ↓
POST /api/chat
    ↓
Recibe: { response, toolCalls, sessionState }
    ↓
Actualiza:
  - Chat (addMessageToChat)
  - Panel de herramientas (processToolCalls)
  - Estado de sesión (updateSessionState)
  - Configuración (updateConfigDisplay)
  - Progreso (markStepCompleted)
  - Pedidos (updateOrdersDisplay)
```

---

## 🔄 Flujo de Ejecución

### Configuración (Pasos 1-5)

```
1. Usuario: "Hola"
   ↓
2. Agent: Saludo + pregunta nombre
   ↓
3. Usuario: "Tito"
   ↓
4. Agent: Usa actualizar_configuracion(nombre_mesero, "Tito")
   ↓
5. Frontend: Actualiza panel de configuración
   ↓
6. Agent: Pregunta restaurante
   ↓
7. [Repite para cada campo de configuración]
   ↓
8. Agent: Usa cambiar_modo("atencion")
   ↓
9. Frontend: Muestra panel de pedidos
```

### Atención (Modo Pedidos)

```
1. Usuario: "Quiero 3 tacos"
   ↓
2. Agent: Usa tomar_pedido(["3 tacos"], 3)
   ↓
3. Frontend: Añade pedido al panel
   ↓
4. Agent: Usa sugerir_upsell(["refrescos", "papas"])
   ↓
5. Frontend: Muestra tool en panel de herramientas
   ↓
6. Agent: Ofrece productos al cliente
```

---

## 🎨 Sistema de Diseño

### Paleta de Colores

- **Primario**: Gradiente púrpura (#667eea → #764ba2)
- **Secundario**: Gradiente naranja (#FFC837 → #FF8008)
- **Success**: Verde (#10b981)
- **Neutral**: Grises (#f9fafb, #e5e7eb, #6b7280)
- **Upsell**: Amarillo (#fef3c7 → #fde68a)

### Animaciones

- `slideIn`: Entrada de mensajes
- `slideInRight`: Entrada de herramientas
- `fillIn`: Relleno de configuración
- `pulse`: Indicador de estado
- `typing`: Indicador de escritura

---

## 🔒 Seguridad

### Implementado
- ✅ CORS habilitado
- ✅ API key en .env (no commiteada)
- ✅ .gitignore para proteger credenciales
- ✅ Validación de schemas con Zod
- ✅ Sesiones aisladas por ID

### Consideraciones Producción
- 🔸 Agregar rate limiting
- 🔸 Autenticación de usuarios
- 🔸 Sanitización de inputs
- 🔸 HTTPS obligatorio
- 🔸 Logging y monitoreo
- 🔸 Manejo de errores más robusto

---

## 📊 Gestión de Estado

### Backend (en memoria)
```javascript
sessions = {
  'session_123': {
    config: {
      nombre_mesero: 'Tito',
      nombre_restaurante: 'Taquería El Buen Taco',
      tipo_producto: 'Tacos',
      productos_upselling: 'Refrescos y papas',
      horarios: 'Lunes a domingo de 1 pm a 11 pm'
    },
    mode: 'atencion',
    history: [HumanMessage, AIMessage, ...],
    pedidos: [{ id: 1, productos: [...], ... }]
  }
}
```

### Frontend (en DOM)
- Configuración: Elementos `.config-item`
- Progreso: Elementos `.step`
- Herramientas: Lista en `#toolsList`
- Pedidos: Lista en `#ordersList`

---

## 🚀 Optimizaciones Posibles

### Rendimiento
1. **Streaming de respuestas**: LangChain soporta streaming
2. **Caché de configuraciones**: Redis para sesiones persistentes
3. **Lazy loading**: Cargar componentes bajo demanda
4. **Minificación**: CSS/JS minificados en producción

### Funcionalidad
1. **Persistencia**: Base de datos (MongoDB/PostgreSQL)
2. **Multi-idioma**: i18n para soporte internacional
3. **Analytics**: Tracking de conversiones y upselling
4. **A/B Testing**: Diferentes prompts/estrategias
5. **Integración WhatsApp**: API oficial de WhatsApp Business

### UX
1. **Voice input**: Reconocimiento de voz
2. **Temas**: Modo oscuro/claro
3. **Personalización**: Colores del restaurante
4. **Export**: Descargar conversaciones/configuraciones

---

## 🧪 Testing

### Áreas a Testear
1. **Unit Tests**: Cada tool por separado
2. **Integration Tests**: Flujo completo de configuración
3. **E2E Tests**: Puppeteer/Playwright para UI
4. **Load Tests**: Múltiples sesiones simultáneas

### Herramientas Sugeridas
- Jest (unit/integration)
- Supertest (API testing)
- Playwright (E2E)
- Artillery (load testing)

---

## 📈 Métricas a Monitorear

### Negocio
- Tasa de configuración completada
- Promedio de productos upselling aceptados
- Tiempo promedio de configuración
- Tasa de conversión en pedidos

### Técnicas
- Latencia de respuestas del LLM
- Uso de cada tool
- Errores de API
- Sesiones activas concurrentes

---

## 🔮 Roadmap Futuro

### Fase 1 (MVP Actual) ✅
- Chat funcional
- Configuración en 5 pasos
- Visualización en tiempo real
- Upselling automático

### Fase 2
- Persistencia en DB
- Múltiples restaurantes
- Dashboard de analytics
- Integración WhatsApp

### Fase 3
- Panel de administración
- Personalización de prompts
- Multi-idioma
- Reportes avanzados

### Fase 4
- IA mejorada con fine-tuning
- Integración con POS
- Pagos integrados
- App móvil nativa

---

## 📚 Referencias

- [LangChain Docs](https://js.langchain.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Express.js](https://expressjs.com/)
- [Zod](https://zod.dev/)

---

**Versión**: 1.0.0
**Última actualización**: 2026-01-05
**Autor**: Equipo Colmena
