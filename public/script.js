const API_URL = '';
let sessionId = generateSessionId();
let currentMode = 'configuracion';

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
    'horarios': 'Horarios',
    'direccion': 'Dirección',
    'menu_productos': 'Menú'
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

        const paramsStr = JSON.stringify(toolCall.input);
        toolParams.textContent = paramsStr.length > 100 ? paramsStr.substring(0, 100) + '...' : paramsStr;

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
        'sugerir_upsell': 'Sugerir Upselling',
        'generar_menu': 'Generar Menú',
        'generar_upselling': 'Configurar Upselling',
        'calcular': 'Calculadora'
    };
    return names[toolName] || toolName;
}

function getToolResultSummary(result) {
    if (result.accion === 'configuracion_actualizada') {
        return `Campo "${result.campo}" actualizado`;
    } else if (result.accion === 'configuracion_generada') {
        return `✨ Configuración generada automáticamente`;
    } else if (result.accion === 'paso_completado') {
        return `Paso ${result.paso} completado`;
    } else if (result.accion === 'configuracion_completada_y_modo_cambiado') {
        return `✅ Configuración completa - Modo Atención activado`;
    } else if (result.accion === 'modo_cambiado') {
        return `Modo cambiado a: ${result.modo}`;
    } else if (result.accion === 'modo_no_cambiado') {
        return `⚠️ Faltan ${result.pasos_faltantes} pasos`;
    } else if (result.accion === 'esperando_confirmacion') {
        return `⏳ Esperando confirmación`;
    } else if (result.accion === 'pedido_registrado') {
        return `Pedido #${result.pedido.id} registrado`;
    } else if (result.accion === 'upsell_sugerido') {
        return `Sugeridos: ${result.productos_sugeridos?.join(', ') || 'productos'}`;
    } else if (result.accion === 'menu_generado') {
        return `Menú con ${result.productos?.length || 0} productos`;
    } else if (result.accion === 'upselling_configurado') {
        return `Upselling configurado`;
    } else if (result.accion === 'calculo_realizado') {
        return `${result.descripcion}: ${result.resultado_formateado}`;
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

    // Trigger transition when any of these actions complete successfully
    if (result.accion === 'configuracion_completada_y_modo_cambiado') {
        triggerChatTransition(result);
        return;
    }

    if (tool === 'cambiar_modo' && result.modo === 'atencion') {
        triggerChatTransition(result);
        return;
    }

    // Handle configuracion_generada - update the config display
    if (result.accion === 'configuracion_generada' && result.config) {
        updateConfigDisplay(result.config);
        return;
    }

    // Handle menu updates
    if (tool === 'generar_menu' && result.productos) {
        // Update menu display
        const configGrid = document.getElementById('configGrid');
        const items = configGrid.querySelectorAll('.config-item');
        items.forEach(item => {
            const labelElement = item.querySelector('.config-label');
            if (labelElement && labelElement.textContent === 'Menú') {
                const valueElement = item.querySelector('.config-value');
                valueElement.textContent = `${result.productos.length} productos`;
                item.classList.remove('empty');
                item.classList.add('filled');
                // Add update animation
                item.style.animation = 'none';
                item.offsetHeight; // Trigger reflow
                item.style.animation = 'pulseUpdate 0.5s ease';
            }
        });
    }

    // Handle individual config updates
    if (tool === 'actualizar_configuracion' && result.campo && result.valor) {
        const label = configFieldMap[result.campo];
        if (label) {
            const configGrid = document.getElementById('configGrid');
            const items = configGrid.querySelectorAll('.config-item');
            items.forEach(item => {
                const labelElement = item.querySelector('.config-label');
                if (labelElement && labelElement.textContent === label) {
                    const valueElement = item.querySelector('.config-value');
                    valueElement.textContent = result.valor;
                    item.classList.remove('empty');
                    item.classList.add('filled');
                    // Add update animation
                    item.style.animation = 'none';
                    item.offsetHeight;
                    item.style.animation = 'pulseUpdate 0.5s ease';
                }
            });
        }
    }

    // Handle upselling updates
    if ((tool === 'generar_upselling' || result.accion === 'upselling_configurado') && result.productos) {
        const configGrid = document.getElementById('configGrid');
        const items = configGrid.querySelectorAll('.config-item');
        items.forEach(item => {
            const labelElement = item.querySelector('.config-label');
            if (labelElement && labelElement.textContent === 'Productos Upselling') {
                const valueElement = item.querySelector('.config-value');
                valueElement.textContent = result.productos.map(p => p.nombre).join(', ');
                item.classList.remove('empty');
                item.classList.add('filled');
                item.style.animation = 'none';
                item.offsetHeight;
                item.style.animation = 'pulseUpdate 0.5s ease';
            }
        });
    }
}

// Chat transition with animation - clears chat and shows welcome from configured agent
function triggerChatTransition(result) {
    const chatMessages = document.getElementById('chatMessages');
    const chatSection = document.querySelector('.chat-section');

    // Add fade out class to chat messages
    chatMessages.classList.add('fade-out-transition');

    // After fade out, clear and add new welcome
    setTimeout(() => {
        // Clear all messages
        chatMessages.innerHTML = '';

        // Create new welcome message for attention mode
        const nombreMesero = result.config?.nombre_mesero || 'Tu mesero digital';
        const nombreRestaurante = result.config?.nombre_restaurante || 'nuestro restaurante';
        const menuProductos = result.config?.menu_productos || [];

        const menuHtml = menuProductos.length > 0
            ? menuProductos.map(p => `<li>${p.nombre} - <strong>$${p.precio}</strong></li>`).join('')
            : '<li>Menú disponible</li>';

        const newWelcome = document.createElement('div');
        newWelcome.className = 'attention-welcome';
        newWelcome.innerHTML = `
            <div class="attention-welcome-header">
                <div class="agent-avatar-large">🤖</div>
                <div class="agent-info">
                    <h3>¡Hola! Soy ${nombreMesero}</h3>
                    <p>Tu mesero digital de ${nombreRestaurante}</p>
                </div>
            </div>
            <div class="menu-preview">
                <h4>📋 Nuestro Menú</h4>
                <ul class="menu-list">
                    ${menuHtml}
                </ul>
            </div>
            <div class="attention-prompt">
                <p>¿Qué te gustaría ordenar hoy?</p>
            </div>
        `;

        chatMessages.appendChild(newWelcome);

        // Remove fade out and add fade in
        chatMessages.classList.remove('fade-out-transition');
        chatMessages.classList.add('fade-in-transition');

        // Update mode display
        updateModeDisplay('atencion');

        // Update mobile toggle icon
        const toggleIcon = document.getElementById('panelToggleIcon');
        if (toggleIcon) {
            toggleIcon.textContent = '🛒';
        }

        setTimeout(() => {
            chatMessages.classList.remove('fade-in-transition');
        }, 500);

    }, 500);
}

function updateSessionState(state) {
    if (state.config) {
        updateConfigDisplay(state.config);
    }

    // Only update mode if it changed and we're not already in that mode
    if (state.mode && state.mode !== currentMode) {
        if (state.mode === 'atencion' && state.pasos_completados?.length >= 5) {
            // Mode change is handled by the transition
            currentMode = state.mode;
        }
    }

    if (state.pedidos && state.pedidos.length > 0 && state.mode === 'atencion') {
        updateOrdersDisplay(state.pedidos, state.config);
    }
}

function updateConfigDisplay(config) {
    const configGrid = document.getElementById('configGrid');
    const items = configGrid.querySelectorAll('.config-item');

    Object.keys(config).forEach(key => {
        const value = config[key];
        const label = configFieldMap[key];

        if (!label) return;

        items.forEach(item => {
            const labelElement = item.querySelector('.config-label');
            if (labelElement && labelElement.textContent === label) {
                const valueElement = item.querySelector('.config-value');

                if (Array.isArray(value)) {
                    if (key === 'menu_productos') {
                        valueElement.textContent = `${value.length} productos`;
                    } else if (key === 'productos_upselling') {
                        valueElement.textContent = value.map(p => p.nombre).join(', ');
                    } else {
                        valueElement.textContent = value.join(', ');
                    }
                } else {
                    valueElement.textContent = value;
                }

                item.classList.remove('empty');
                item.classList.add('filled');
            }
        });
    });
}

function updateModeDisplay(mode) {
    currentMode = mode;
    const modeText = document.getElementById('modeText');
    const modeNames = {
        'configuracion': 'Configuración',
        'atencion': 'Atención al Cliente'
    };
    modeText.textContent = modeNames[mode] || mode;

    if (mode === 'atencion') {
        document.querySelector('.status-dot').style.background = '#6B1FC0';
        document.querySelector('.status-dot').style.boxShadow = '0 0 8px rgba(107, 31, 192, 0.5)';

        const configDisplay = document.getElementById('configDisplay');
        const toolsDisplay = document.getElementById('toolsDisplay');
        const ordersDisplay = document.getElementById('ordersDisplay');

        // Fade out config panels
        [configDisplay, toolsDisplay].forEach(el => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            configDisplay.style.display = 'none';
            toolsDisplay.style.display = 'none';

            // Show orders panel with animation
            ordersDisplay.style.display = 'block';
            ordersDisplay.style.opacity = '0';
            ordersDisplay.style.transform = 'translateY(20px)';
            ordersDisplay.classList.add('full-height');

            setTimeout(() => {
                ordersDisplay.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                ordersDisplay.style.opacity = '1';
                ordersDisplay.style.transform = 'translateY(0)';
            }, 50);
        }, 500);
    } else {
        document.querySelector('.status-dot').style.background = '#10b981';
        document.querySelector('.status-dot').style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.5)';
        document.getElementById('configDisplay').style.display = 'block';
        document.getElementById('toolsDisplay').style.display = 'block';
        document.getElementById('ordersDisplay').style.display = 'none';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(amount);
}

function updateOrdersDisplay(pedidos, config) {
    const ordersList = document.getElementById('ordersList');

    const emptyState = ordersList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    ordersList.innerHTML = '';

    pedidos.forEach(pedido => {
        const ticket = document.createElement('div');
        ticket.className = 'ticket-card';
        if (pedido.esUpselling) ticket.classList.add('upsell');

        const ticketHeader = document.createElement('div');
        ticketHeader.className = 'ticket-header';
        ticketHeader.innerHTML = `
            <span class="ticket-id">TICKET #${String(pedido.id).padStart(4, '0')}</span>
            <span class="ticket-time">${new Date(pedido.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
        `;

        const ticketBody = document.createElement('div');
        ticketBody.className = 'ticket-body';

        let total = pedido.total || 0;
        if (pedido.productos_detalle && pedido.productos_detalle.length > 0) {
            pedido.productos_detalle.forEach(prod => {
                const item = document.createElement('div');
                item.className = 'ticket-item';
                item.innerHTML = `
                    <span>• ${prod.nombre}</span>
                    <span class="ticket-item-price">${formatCurrency(prod.precio)}</span>
                `;
                ticketBody.appendChild(item);
            });
        } else {
            pedido.productos.forEach(prod => {
                const item = document.createElement('div');
                item.className = 'ticket-item';
                item.innerHTML = `<span>• ${prod}</span>`;
                ticketBody.appendChild(item);
            });
        }

        const ticketInfo = document.createElement('div');
        ticketInfo.className = 'ticket-info';

        const modalidadIcon = pedido.modalidad === 'domicilio' ? '🛵' : '🏪';
        const modalidadText = pedido.modalidad === 'domicilio' ? 'Envío a Domicilio' : 'Recoger en Sucursal';

        ticketInfo.innerHTML = `
            <div class="ticket-info-row">
                <span class="ticket-info-icon">${modalidadIcon}</span>
                <span class="ticket-info-label">Modalidad:</span>
                <span class="ticket-info-value">${modalidadText}</span>
            </div>
            <div class="ticket-info-row">
                <span class="ticket-info-icon">💳</span>
                <span class="ticket-info-label">Pago:</span>
                <span class="ticket-info-value">${pedido.forma_pago || 'Por confirmar'}</span>
            </div>
        `;

        if (pedido.modalidad === 'domicilio' && pedido.direccion_cliente) {
            ticketInfo.innerHTML += `
                <div class="ticket-info-row">
                    <span class="ticket-info-icon">📍</span>
                    <span class="ticket-info-label">Entregar:</span>
                    <span class="ticket-info-value">${pedido.direccion_cliente}</span>
                </div>
            `;
        } else {
            const direccionSucursal = pedido.direccion_sucursal || config?.direccion || 'Dirección del restaurante';
            const mapsLink = pedido.maps_link || `https://maps.google.com/?q=${encodeURIComponent(direccionSucursal)}`;
            ticketInfo.innerHTML += `
                <div class="ticket-info-row">
                    <span class="ticket-info-icon">🏪</span>
                    <span class="ticket-info-label">Recoger:</span>
                    <span class="ticket-info-value">${direccionSucursal}</span>
                </div>
                <div class="ticket-info-row">
                    <span class="ticket-info-icon">🗺️</span>
                    <span class="ticket-info-label">Ubicación:</span>
                    <span class="ticket-info-value"><a href="${mapsLink}" target="_blank" rel="noopener">Ver en Google Maps</a></span>
                </div>
            `;
        }

        const ticketFooter = document.createElement('div');
        ticketFooter.className = 'ticket-footer';
        ticketFooter.innerHTML = `
            <div class="ticket-total">
                <span class="ticket-total-label">Total</span>
                <span class="ticket-total-amount">${formatCurrency(total)}</span>
            </div>
            <span class="status-tag">${pedido.estado || 'Recibido'}</span>
        `;

        ticket.appendChild(ticketHeader);
        ticket.appendChild(ticketBody);
        ticket.appendChild(ticketInfo);
        ticket.appendChild(ticketFooter);

        if (pedido.esUpselling) {
            const upsellBadge = document.createElement('div');
            upsellBadge.className = 'upsell-badge';
            upsellBadge.innerHTML = '✨ Upselling Convertido';
            ticket.appendChild(upsellBadge);
        }

        ordersList.appendChild(ticket);
    });

    setTimeout(() => {
        const panel = document.querySelector('.actions-panel');
        if (panel) panel.scrollTop = panel.scrollHeight;
    }, 100);
}

function resetSession() {
    if (confirm('¿Estás seguro de que quieres reiniciar la sesión?')) {
        localStorage.removeItem('colmena_session_id');
        sessionId = generateSessionId();
        currentMode = 'configuracion';

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

        const toolsList = document.getElementById('toolsList');
        toolsList.innerHTML = '<p class="empty-state">Las acciones aparecerán aquí</p>';

        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '<p class="empty-state">Los pedidos aparecerán aquí</p>';

        // Reset panel visibility
        document.getElementById('ordersDisplay').style.display = 'none';
        document.getElementById('configDisplay').style.display = 'block';
        document.getElementById('toolsDisplay').style.display = 'block';

        // Reset opacity and transform
        ['configDisplay', 'toolsDisplay'].forEach(id => {
            const el = document.getElementById(id);
            el.style.opacity = '1';
            el.style.transform = 'none';
        });

        document.getElementById('modeText').textContent = 'Configuración';
        document.querySelector('.status-dot').style.background = '#10b981';
        document.querySelector('.status-dot').style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.5)';

        // Reset mobile toggle icon
        const toggleIcon = document.getElementById('panelToggleIcon');
        if (toggleIcon) {
            toggleIcon.textContent = '📋';
        }

        // Close mobile panel
        document.getElementById('actionsPanel').classList.remove('mobile-visible');

        document.getElementById('messageInput').focus();
    }
}

async function loadSessionState() {
    try {
        const response = await fetch(`${API_URL}/api/session/${sessionId}`);
        const state = await response.json();

        if (state) {
            updateSessionState(state);

            if (state.mode === 'atencion' && state.pasos_completados?.length >= 5) {
                currentMode = 'atencion';
                document.getElementById('configDisplay').style.display = 'none';
                document.getElementById('toolsDisplay').style.display = 'none';
                document.getElementById('ordersDisplay').style.display = 'block';
                document.getElementById('ordersDisplay').classList.add('full-height');
                document.getElementById('modeText').textContent = 'Atención al Cliente';
                document.querySelector('.status-dot').style.background = '#6B1FC0';

                const toggleIcon = document.getElementById('panelToggleIcon');
                if (toggleIcon) {
                    toggleIcon.textContent = '🛒';
                }
            }
        }
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

// Toggle actions panel for mobile
function toggleActionsPanel() {
    const panel = document.getElementById('actionsPanel');
    panel.classList.toggle('mobile-visible');
}

function checkMobileView() {
    const isMobile = window.innerWidth <= 768;
    const panel = document.getElementById('actionsPanel');

    if (!isMobile) {
        panel.classList.remove('mobile-visible');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('messageInput').focus();
    loadSessionState();
    checkMobileView();
});

window.addEventListener('resize', checkMobileView);

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
