# 🚀 Inicio Rápido - Mesero Digital Colmena

## ⚡ Empezar en 30 segundos

### 1. Instalar dependencias (solo primera vez)
```bash
npm install
```

### 2. Iniciar servidor
```bash
npm start
```

### 3. Abrir en navegador
```
http://localhost:3000
```

### 4. Comenzar demo
Escribir en el chat: **`Hola`**

---

## 📋 Flujo de Configuración

1. **Saludo inicial**: Escribe `Hola`
2. **Nombre del mesero**: Por ejemplo `Tito`
3. **Nombre del restaurante**: Por ejemplo `Taquería El Buen Taco`
4. **Tipo de producto**: Por ejemplo `Tacos`
5. **Productos upselling**: Por ejemplo `Refrescos y papas`
6. **Horarios**: Por ejemplo `Lunes a domingo de 1 pm a 11 pm`

---

## 🎯 Probar como Cliente

Después de configurar, hacer un pedido:

```
Hola, quiero 3 tacos de asada
```

El mesero automáticamente:
- ✅ Registra el pedido
- ✅ Sugiere refrescos y papas
- ✅ Todo visible en el panel derecho

---

## 🔄 Reiniciar Demo

Clic en botón **🔄 Nueva Sesión** en la esquina superior derecha del chat

---

## 🆘 Solución de Problemas

### El servidor no inicia
```bash
# Verificar que no haya otro proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Reintentar
npm start
```

### Error de API Key
- Verificar que el archivo `.env` existe
- Verificar que la API key es válida

### Página en blanco
- Verificar que el servidor esté corriendo
- Abrir consola del navegador (F12) para ver errores
- Refrescar la página

---

## 📱 Para Presentaciones

1. Compartir pantalla completa
2. Asegurar que ambos paneles sean visibles
3. Seguir [GUIA_PRESENTACION.md](GUIA_PRESENTACION.md) para script detallado

---

## 💡 Consejos

- **Panel derecho es clave**: Ahí se ven todas las acciones
- **Upselling automático**: Se activa después de cada pedido
- **Visual y colorido**: Diseñado para impresionar
- **Flujo guiado**: El agente guía todo el proceso

---

¡Listo para vender! 🔥
