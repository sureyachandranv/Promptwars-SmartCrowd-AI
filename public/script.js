document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const statsContainer = document.getElementById('stats-container');
    const terminal = document.getElementById('terminal-content');
    const pathSvg = document.getElementById('active-path');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const routeBtn = document.getElementById('route-btn');
    const emBtn = document.getElementById('em-btn');
    const startNode = document.getElementById('start-node');
    const endNode = document.getElementById('end-node');

    let currentZones = {};

    // Drag Element Logic
    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = elmnt.querySelector('.terminal-header');
        if (header) {
            header.onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            elmnt.style.bottom = "auto"; 
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    const consoleEl = document.querySelector('.thought-inspector');
    if (consoleEl) dragElement(consoleEl);

    // Terminal Logging Logic
    const logToTerminal = (msg) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const line = document.createElement('div');
        line.innerHTML = `<span style="color: #666">[${time}]</span> ${msg}`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    };

    // Calculate node centers relative to viewport map
    const getZonePosition = (zoneId) => {
        const node = document.querySelector(`.node[data-zone="${zoneId}"]`);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        const containerRect = document.getElementById('map-container').getBoundingClientRect();
        return {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
        };
    };

    const drawPath = (pathNodes) => {
        if (!pathNodes || pathNodes.length < 2) {
            pathSvg.setAttribute('d', '');
            return;
        }

        let d = '';
        pathNodes.forEach((node, index) => {
            const pos = getZonePosition(node);
            if (pos) {
                if (index === 0) d += `M ${pos.x} ${pos.y} `;
                else {
                    const prevPos = getZonePosition(pathNodes[index - 1]);
                    // Create a subtle curve (cubic bezier)
                    const cp1x = prevPos.x;
                    const cp1y = pos.y;
                    d += `C ${cp1x} ${cp1y}, ${cp1x} ${cp1y}, ${pos.x} ${pos.y} `;
                }
            }
        });
        pathSvg.setAttribute('d', d);
        logToTerminal(`System: Calculated optimal path via ${pathNodes.length} nodes.`);
    };

    const fetchSimulation = async () => {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            currentZones = data.zones;
            updateUI(data.zones);
        } catch (err) {
            console.error("Simulation sync error", err);
        }
    };

    const forecastSlider = document.getElementById('forecast-slider');
    const forecastVal = document.getElementById('forecast-val');
    let forecastMultiplier = 1;

    forecastSlider.addEventListener('input', (e) => {
        forecastMultiplier = 1 + (e.target.value / 100);
        forecastVal.innerText = e.target.value;
        logToTerminal(`Prediction: System scaling crowd density by ${e.target.value}% for stress testing.`);
        updateUI(currentZones); // trigger immediate visual update
    });

    const updateUI = (zones) => {
        statsContainer.innerHTML = '';
        
        for (let key in zones) {
            const z = {...zones[key]};
            
            // Apply forecast multiplier for "what-if" scenario
            z.current = Math.min(z.capacity, Math.floor(z.current * forecastMultiplier));
            z.density = z.current / z.capacity;
            z.status = z.density < 0.5 ? 'Green' : z.density < 0.8 ? 'Yellow' : 'Red';

            const densityPct = (z.density * 100).toFixed(0);
            
            // Sidebar Stat Item
            const color = z.status === 'Green' ? 'var(--green)' : z.status === 'Yellow' ? 'var(--yellow)' : 'var(--red)';
            const el = document.createElement('div');
            el.className = 'stat-item';
            el.innerHTML = `
                <div class="stat-top">
                    <span class="stat-name">${key}</span>
                    <span class="stat-value">${z.current}/${z.capacity}</span>
                </div>
                <div class="stat-progress-bg">
                    <div class="stat-progress-fill" style="width: ${densityPct}%; background: ${color}"></div>
                </div>
                <div class="stat-status">
                    <div class="status-dot" style="background: ${color}; box-shadow: 0 0 5px ${color}"></div>
                    <span style="color: ${color}">${z.status}</span>
                    <span style="color: var(--text-muted); margin-left: auto;">${z.waitTime}m wait</span>
                </div>
            `;
            statsContainer.appendChild(el);

            // Update Map Nodes
            const mapNode = document.querySelector(`.node[data-zone="${key}"]`);
            if (mapNode) {
                mapNode.setAttribute('data-status', z.status);
            }

            // Random Log for high density
            if (z.density > 0.8 && Math.random() > 0.95) {
                logToTerminal(`Warning: Critical density detected in ${key}. Recommendations updated.`);
            }
        }
    };

    const sendChat = async (inputVal = null) => {
        const text = inputVal || chatInput.value.trim();
        if (!text) return;
        
        appendMessage('user', text);
        if(!inputVal) chatInput.value = '';

        logToTerminal(`AI Agent: Processing query "${text}"...`);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, location: startNode.value })
            });
            const data = await res.json();
            appendMessage('ai', data.reply);
        } catch (err) {
            appendMessage('ai', 'Error connecting to intelligence matrix.');
        }
    };

    const appendMessage = (sender, text) => {
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${sender}`;
        wrapper.innerHTML = `<div class="chat-bubble">${text}</div>`;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    routeBtn.addEventListener('click', async () => {
        logToTerminal(`User: Requested routing from ${startNode.value} to ${endNode.value}`);
        const res = await fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: startNode.value, end: endNode.value })
        });
        const data = await res.json();
        if (data.path) {
            drawPath(data.path);
            const pathStr = data.path.join(' -> ');
            logToTerminal(`System: Calculated optimal path: ${pathStr}`);
            // Fire off a silent or explicit AI query so the Assistant narrates the route
            const queryMsg = `I need an optimal route from ${startNode.value} to ${endNode.value}. The system suggests: ${pathStr}. Can you confirm this is safe based on live crowd data?`;
            chatInput.value = queryMsg;
            sendChat(queryMsg);
        }
    });

    emBtn.addEventListener('click', async () => {
        logToTerminal(`CRITICAL: EMERGENCY PROTOCOL INITIATED BY USER.`);
        const res = await fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: startNode.value, end: 'Exit' })
        });
        const data = await res.json();
        drawPath(data.path);
        appendMessage('ai', '🚨 EMERGENCY MODE. Follow the glowing path to the nearest Exit South immediately.');
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });

    // Start Simulation
    setInterval(fetchSimulation, 3000);
    fetchSimulation();

    // Resize draw path upkeep
    window.addEventListener('resize', () => {
        // Redraw if path exists
        pathSvg.setAttribute('d', ''); // logic simplified
    });
});
