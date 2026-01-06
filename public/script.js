const API_URL = 'http://localhost:3000';
let sessionId = generateSessionId();

function generateSessionId() {
    let id = localStorage.getItem('colmena_session_id');
    if (!id) {
        id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('colmena_session_id', id);
    }
    return id;
}

const configFieldMap = {
    'nombre_mesero': 'Nombre del Mesero',
    'nombre_restaurante': 'Restaurante',
    'tipo_producto': 'Tipo de Producto',
    'productos_upselling': 'Productos Upselling',
    'horarios': 'Horarios'
};

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    input.value = '';
    addMessageToChat('user', message);
    showTypingIndicator();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                sessionId
            })
        });

        const data = await response.json();

        hideTypingIndicator();

        if (data.error) {
            addMessageToChat('agent', '❌ Error: ' + data.error);
            return;
        }

        addMessageToChat('agent', data.response);

        if (data.toolCalls && data.toolCalls.length > 0) {
            processToolCalls(data.toolCalls);
        }

        if (data.autoActions && data.autoActions.length > 0) {
            processAutoActions(data.autoActions);
        }

        if (data.sessionState) {
            updateSessionState(data.sessionState);
        }

    } catch (error) {
        hideTypingIndicator();
        addMessageToChat('agent', '❌ Error de conexión: ' + error.message);
        console.error('Error:', error);
    }
}

function addMessageToChat(sender, text) {
    const chatMessages = document.getElementById('chatMessages');

    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);

    // Scroll suave hacia el final
    setTimeout(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(dots);

    chatMessages.appendChild(typingDiv);

    // Scroll suave hacia el final
    setTimeout(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function processToolCalls(toolCalls) {
    const toolsList = document.getElementById('toolsList');

    const emptyState = toolsList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    toolCalls.forEach(toolCall => {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';

        const toolName = document.createElement('div');
        toolName.className = 'tool-name';
        toolName.textContent = `🔧 ${getToolDisplayName(toolCall.tool)}`;

        const toolParams = document.createElement('div');
        toolParams.className = 'tool-params';
        toolParams.textContent = JSON.stringify(toolCall.input);

        const toolResult = document.createElement('div');
        toolResult.className = 'tool-result';
        toolResult.textContent = '✓ ' + getToolResultSummary(toolCall.result);

        toolItem.appendChild(toolName);
        toolItem.appendChild(toolParams);
        toolItem.appendChild(toolResult);

        toolsList.insertBefore(toolItem, toolsList.firstChild);

        if (toolsList.children.length > 8) {
            toolsList.removeChild(toolsList.lastChild);
        }

        handleSpecificToolActions(toolCall);
    });
}

function getToolDisplayName(toolName) {
    const names = {
        'actualizar_configuracion': 'Actualizar Configuración',
        'mostrar_opciones': 'Mostrar Opciones',
        'confirmar_paso': 'Confirmar Paso',
        'cambiar_modo': 'Cambiar Modo',
        'tomar_pedido': 'Tomar Pedido',
        'sugerir_upsell': 'Sugerir Upselling'
    };
    return names[toolName] || toolName;
}

function getToolResultSummary(result) {
    if (result.accion === 'configuracion_actualizada') {
        return `Campo "${result.campo}" actualizado`;
    } else if (result.accion === 'paso_completado') {
        return `Paso ${result.paso} completado`;
    } else if (result.accion === 'modo_cambiado') {
        return `Modo cambiado a: ${result.modo}`;
    } else if (result.accion === 'pedido_registrado') {
        return `Pedido #${result.pedido.id} registrado`;
    } else if (result.accion === 'upsell_sugerido') {
        return `Sugeridos: ${result.productos_sugeridos.join(', ')}`;
    }
    return 'Ejecutado exitosamente';
}

function processAutoActions(actions) {
    actions.forEach(action => {
        if (action.tipo === 'config_actualizada') {
            addActionToPanel('Configuración Actualizada',
                `${action.campo}: ${action.valor}`, 'config');
        } else if (action.tipo === 'pedido_registrado') {
            addActionToPanel('Pedido Registrado',
                `Pedido #${action.pedido.id}: ${action.pedido.productos.join(', ')}`, 'pedido');
        } else if (action.tipo === 'upselling_ofrecido') {
            addActionToPanel('Upselling Ofrecido',
                `Productos sugeridos: ${action.productos}`, 'upsell');
        } else if (action.tipo === 'upselling_aceptado') {
            addActionToPanel('¡Upselling Exitoso!',
                `Cliente aceptó: ${action.pedido.productos.join(', ')}`, 'upsell-success');
        } else if (action.tipo === 'modo_cambiado') {
            document.getElementById('ordersDisplay').style.display = 'block';
            addActionToPanel('Configuración Completa',
                'Mesero listo para atender pedidos', 'modo');
        }
    });
}

function addActionToPanel(titulo, descripcion, tipo) {
    const toolsList = document.getElementById('toolsList');

    const emptyState = toolsList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const actionItem = document.createElement('div');
    actionItem.className = `action-item action-${tipo}`;

    const iconMap = {
        'config': '⚙️',
        'pedido': '🛒',
        'upsell': '💰',
        'upsell-success': '✅💰',
        'modo': '🎉'
    };

    actionItem.innerHTML = `
        <div class="action-icon">${iconMap[tipo] || '📌'}</div>
        <div class="action-content">
            <div class="action-title">${titulo}</div>
            <div class="action-description">${descripcion}</div>
            <div class="action-time">${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;

    toolsList.insertBefore(actionItem, toolsList.firstChild);

    if (toolsList.children.length > 10) {
        toolsList.removeChild(toolsList.lastChild);
    }
}

function handleSpecificToolActions(toolCall) {
    const { tool, result } = toolCall;

    if (tool === 'confirmar_paso' && result.paso) {
        markStepCompleted(result.paso);
    }

    if (tool === 'cambiar_modo' && result.modo === 'atencion') {
        document.getElementById('ordersDisplay').style.display = 'block';
    }
}

function updateSessionState(state) {
    if (state.config) {
        updateConfigDisplay(state.config);
    }

    if (state.mode) {
        updateModeDisplay(state.mode);
    }

    if (state.pedidos && state.pedidos.length > 0) {
        updateOrdersDisplay(state.pedidos);
    }
}

function updateConfigDisplay(config) {
    const configGrid = document.getElementById('configGrid');
    const items = configGrid.querySelectorAll('.config-item');

    Object.keys(config).forEach(key => {
        const value = config[key];
        const label = configFieldMap[key];

        items.forEach(item => {
            const labelElement = item.querySelector('.config-label');
            if (labelElement && labelElement.textContent === label) {
                const valueElement = item.querySelector('.config-value');
                valueElement.textContent = value;
                item.classList.remove('empty');
                item.classList.add('filled');
            }
        });
    });
}

function updateModeDisplay(mode) {
    const modeText = document.getElementById('modeText');
    const modeNames = {
        'configuracion': 'Modo: Configuración',
        'atencion': 'Modo: Atención al Cliente'
    };
    modeText.textContent = modeNames[mode] || mode;

    if (mode === 'atencion') {
        document.querySelector('.status-dot').style.background = '#3b82f6';

        // Hide config panels
        document.getElementById('configDisplay').style.display = 'none';
        document.getElementById('progressTracker').style.display = 'none';
        document.getElementById('toolsDisplay').style.display = 'none'; // Optional: hide detailed tool logs to focus on orders

        // Show orders panel prominently
        const ordersDisplay = document.getElementById('ordersDisplay');
        ordersDisplay.style.display = 'block';
        ordersDisplay.classList.add('full-height');
    } else {
        document.querySelector('.status-dot').style.background = '#10b981';
        document.getElementById('configDisplay').style.display = 'block';
        document.getElementById('progressTracker').style.display = 'block';
        document.getElementById('toolsDisplay').style.display = 'block';
        document.getElementById('ordersDisplay').style.display = 'none';
    }
}

function markStepCompleted(stepNumber) {
    const step = document.querySelector(`.step[data-step="${stepNumber}"]`);
    if (step) {
        step.classList.add('completed');
    }
}

function updateOrdersDisplay(pedidos) {
    const ordersList = document.getElementById('ordersList');

    const emptyState = ordersList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    // Instead of rebuilding, we can check diffs, but for now rebuilding is safe for small lists
    // To keep the "timeline" feel, we might want to just append new ones if possible, but let's just render all in reverse chronological (or chronological)
    // The user wants "fills up", so chronological (top to bottom) makes sense.

    ordersList.innerHTML = '';

    pedidos.forEach(pedido => {
        const ticket = document.createElement('div');
        ticket.className = 'ticket-card';
        if (pedido.esUpselling) ticket.classList.add('upsell');

        const ticketHeader = document.createElement('div');
        ticketHeader.className = 'ticket-header';

        const ticketId = document.createElement('span');
        ticketId.className = 'ticket-id';
        ticketId.textContent = `TICKET #${String(pedido.id).padStart(4, '0')}`;

        const ticketTime = document.createElement('span');
        ticketTime.className = 'ticket-time';
        ticketTime.textContent = new Date(pedido.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        ticketHeader.appendChild(ticketId);
        ticketHeader.appendChild(ticketTime);

        const ticketBody = document.createElement('div');
        ticketBody.className = 'ticket-body';

        pedido.productos.forEach(prod => {
            const item = document.createElement('div');
            item.className = 'ticket-item';
            item.innerHTML = `<span>• ${prod}</span>`;
            ticketBody.appendChild(item);
        });

        const ticketFooter = document.createElement('div');
        ticketFooter.className = 'ticket-footer';
        ticketFooter.innerHTML = `${pedido.cantidad_total || 1} items &bull; <span class="status-tag">${pedido.estado || 'Recibido'}</span>`;

        if (pedido.esUpselling) {
            const upsellBadge = document.createElement('div');
            upsellBadge.className = 'upsell-badge';
            upsellBadge.textContent = '✨ Upselling Convertido';
            ticket.appendChild(upsellBadge);
        }

        ticket.appendChild(ticketHeader);
        ticket.appendChild(ticketBody);
        ticket.appendChild(ticketFooter);

        ordersList.appendChild(ticket);
    });

    // Auto scroll to bottom to see new orders "filling up"
    const ordersDisplay = document.getElementById('ordersDisplay');
    // We scroll the container (actions-panel is the scrolling parent usually, but ordersList might need its own if it gets huge)
    // Based on styles, actions-panel scrolls.
    setTimeout(() => {
        const panel = document.querySelector('.actions-panel');
        if (panel) panel.scrollTop = panel.scrollHeight;
    }, 100);
}

function resetSession() {
    if (confirm('¿Estás seguro de que quieres reiniciar la sesión?')) {
        localStorage.removeItem('colmena_session_id');
        sessionId = generateSessionId();

        // Limpiar estado en servidor (opcional, o simplemente cambiar ID)

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">👋</div>
                <h3>¡Bienvenido a la Demo!</h3>
                <p>Escribe <strong>"Hola"</strong> para comenzar la configuración del mesero digital</p>
            </div>
        `;

        const configGrid = document.getElementById('configGrid');
        const items = configGrid.querySelectorAll('.config-item');
        items.forEach(item => {
            item.classList.remove('filled');
            item.classList.add('empty');
            const valueElement = item.querySelector('.config-value');
            valueElement.textContent = 'No configurado';
        });

        const steps = document.querySelectorAll('.step');
        steps.forEach(step => step.classList.remove('completed'));

        const toolsList = document.getElementById('toolsList');
        toolsList.innerHTML = '<p class="empty-state">Las acciones del agente aparecerán aquí</p>';

        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '<p class="empty-state">Los pedidos aparecerán aquí</p>';

        document.getElementById('ordersDisplay').style.display = 'none';
        document.getElementById('configDisplay').style.display = 'block';
        document.getElementById('progressTracker').style.display = 'block';

        document.getElementById('modeText').textContent = 'Modo: Configuración';
        document.querySelector('.status-dot').style.background = '#10b981';

        document.getElementById('messageInput').focus();
    }
}

async function loadSessionState() {
    try {
        const response = await fetch(`${API_URL}/api/session/${sessionId}`);
        const state = await response.json();

        if (state) {
            updateSessionState(state);

            // Restore history if needed, or just keep config
            // Simple history restoration could be added here if the server sent it
        }
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('messageInput').focus();
    loadSessionState();
});
