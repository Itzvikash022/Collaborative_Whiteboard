document.addEventListener('DOMContentLoaded', () => {
    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];
    
    // Initialize socket connection
    const socket = io();
    
    // Canvas setup
    const canvas = document.getElementById('whiteboard');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.querySelector('.canvas-container');
    
    // Action history for undo/redo
    const actionHistory = [];
    let currentActionIndex = -1;
    
    // Drawing state
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#000000';  // Default color
    let currentThickness = 3;      // Default thickness
    let startX, startY;
    
    // Set canvas to fixed size
    canvas.width = 1200;
    canvas.height = 800;
    canvas.style.border = '2px solid #333';
    
    // Tool elements
    const tools = document.querySelectorAll('.tool[data-tool]');
    const colorPicker = document.getElementById('colorPicker');
    const thicknessSlider = document.getElementById('thicknessSlider');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const currentRoomIdDisplay = document.getElementById('currentRoomId');
    const copyCurrentRoomId = document.getElementById('copyCurrentRoomId');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    
    // User cursors
    const userCursors = document.getElementById('userCursors');
    const userColors = {};

    // Set room ID in display
    if (currentRoomIdDisplay) {
        currentRoomIdDisplay.textContent = roomId;
    }
    
    // Join the room
    socket.emit('joinRoom', roomId);
    
    // Tool selection
    if (tools) {
        tools.forEach(tool => {
            tool.addEventListener('click', () => {
                // Remove active class from all tools
                tools.forEach(t => t.classList.remove('active'));
                // Add active class to selected tool
                tool.classList.add('active');
                // Set current tool
                currentTool = tool.dataset.tool;
                
                // Update cursor based on tool
                if (currentTool === 'eraser') {
                    canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Crect width=\'20\' height=\'20\' x=\'2\' y=\'2\' fill=\'white\' stroke=\'black\' stroke-width=\'1\'/%3E%3C/svg%3E") 10 10, auto';
                } else {
                    canvas.style.cursor = 'crosshair';
                }
            });
        });
    }
    
    // Color picker
    if (colorPicker) {
        colorPicker.addEventListener('input', () => {
            currentColor = colorPicker.value;
        });
    }
    
    // Thickness slider
    if (thicknessSlider) {
        thicknessSlider.addEventListener('input', () => {
            currentThickness = thicknessSlider.value;
        });
    }
    
    // Add action to history
    function addAction(action) {
        // Remove any actions after current index (for redo functionality)
        if (currentActionIndex < actionHistory.length - 1) {
            actionHistory.splice(currentActionIndex + 1);
        }
        
        actionHistory.push(action);
        currentActionIndex = actionHistory.length - 1;
        
        // Enable/disable undo/redo buttons
        updateUndoRedoButtons();
    }
    
    // Update undo/redo button states
    function updateUndoRedoButtons() {
        if (undoBtn) undoBtn.disabled = currentActionIndex < 0;
        if (redoBtn) redoBtn.disabled = currentActionIndex >= actionHistory.length - 1;
    }
    
    // Mouse events for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Track cursor position for collaboration
    canvasContainer.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        socket.emit('cursorMove', { 
            x, 
            y,
            position: { x, y },
            userId: socket.id
        });
    });
    
    // Start drawing
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        
        // For pen tool, start a new path
        if (currentTool === 'pen' || currentTool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Add action to history
            const action = {
                tool: currentTool,
                color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
                thickness: currentThickness,
                points: [{ x: startX, y: startY }],
                userId: socket.id
            };
            
            addAction(action);
            socket.emit('draw', action);
        }
    }
    
    // Draw based on mouse movement
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (currentTool === 'pen' || currentTool === 'eraser') {
            // Continue the path for pen/eraser
            ctx.lineTo(x, y);
            ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
            ctx.lineWidth = currentThickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // Update the last action with new point
            const lastAction = actionHistory[currentActionIndex];
            lastAction.points.push({ x, y });
            
            // Send the updated point to server
            socket.emit('draw', {
                tool: currentTool,
                color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
                thickness: currentThickness,
                points: [{ x, y }],
                userId: socket.id,
                isUpdate: true
            });
        } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
            // Preview the shape
            redrawCanvas();
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentThickness;
            ctx.beginPath();
            
            if (currentTool === 'rectangle') {
                ctx.rect(startX, startY, x - startX, y - startY);
            } else if (currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            } else if (currentTool === 'line') {
                ctx.moveTo(startX, startY);
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }
    
    // Stop drawing
    function stopDrawing(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
            // Add the shape to action history
            const action = {
                tool: currentTool,
                color: currentColor,
                thickness: currentThickness,
                start: { x: startX, y: startY },
                end: { x, y },
                userId: socket.id
            };
            
            addAction(action);
            socket.emit('draw', action);
            
            // Redraw to ensure clean rendering
            redrawCanvas();
        }
        
        isDrawing = false;
    }
    
    // Handle touch events
    function handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Undo last action
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (currentActionIndex >= 0) {
                currentActionIndex--;
                redrawCanvas();
                socket.emit('undo');
                updateUndoRedoButtons();
            }
        });
    }
    
    // Redo action
    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            if (currentActionIndex < actionHistory.length - 1) {
                currentActionIndex++;
                redrawCanvas();
                updateUndoRedoButtons();
            }
        });
    }
    
    // Clear canvas
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                actionHistory.length = 0;
                currentActionIndex = -1;
                updateUndoRedoButtons();
                socket.emit('clearCanvas');
            }
        });
    }
    
    // Download canvas as image
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `whiteboard-${roomId}-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
    
    // Copy room ID
    if (copyCurrentRoomId) {
        copyCurrentRoomId.addEventListener('click', () => {
            navigator.clipboard.writeText(roomId)
                .then(() => {
                    alert('Room ID copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    }
    
    // Leave room
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to leave this room?')) {
                window.location.href = '/';
            }
        });
    }
    
    // Redraw canvas based on action history
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i <= currentActionIndex; i++) {
            const action = actionHistory[i];
            
            if (action.tool === 'pen' || action.tool === 'eraser') {
                ctx.beginPath();
                ctx.strokeStyle = action.color;
                ctx.lineWidth = action.thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                const points = action.points;
                if (points && points.length > 0) {
                    ctx.moveTo(points[0].x, points[0].y);
                    
                    for (let j = 1; j < points.length; j++) {
                        ctx.lineTo(points[j].x, points[j].y);
                    }
                    
                    ctx.stroke();
                }
            } else if (action.tool === 'rectangle') {
                ctx.strokeStyle = action.color;
                ctx.lineWidth = action.thickness;
                ctx.beginPath();
                ctx.rect(
                    action.start.x,
                    action.start.y,
                    action.end.x - action.start.x,
                    action.end.y - action.start.y
                );
                ctx.stroke();
            } else if (action.tool === 'circle') {
                ctx.strokeStyle = action.color;
                ctx.lineWidth = action.thickness;
                ctx.beginPath();
                const radius = Math.sqrt(
                    Math.pow(action.end.x - action.start.x, 2) +
                    Math.pow(action.end.y - action.start.y, 2)
                );
                ctx.arc(action.start.x, action.start.y, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (action.tool === 'line') {
                ctx.strokeStyle = action.color;
                ctx.lineWidth = action.thickness;
                ctx.beginPath();
                ctx.moveTo(action.start.x, action.start.y);
                ctx.lineTo(action.end.x, action.end.y);
                ctx.stroke();
            }
        }
    }
    
    // Handle socket events
    socket.on('draw', (data) => {
        // Generate a consistent color for each user
        if (!userColors[data.userId]) {
            userColors[data.userId] = getRandomColor();
        }
        
        if (data.isUpdate) {
            // For pen/eraser updates, find the last action by this user
            for (let i = actionHistory.length - 1; i >= 0; i--) {
                if (actionHistory[i].userId === data.userId) {
                    actionHistory[i].points.push(data.points[0]);
                    break;
                }
            }
        } else {
            // Add the new action to history
            actionHistory.push(data);
            currentActionIndex = actionHistory.length - 1;
        }
        // Redraw the canvas
        redrawCanvas();
        updateUndoRedoButtons();
    });
    
    socket.on('clearCanvas', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        actionHistory.length = 0;
        currentActionIndex = -1;
        updateUndoRedoButtons();
    });
    
    socket.on('canvasState', (actions) => {
        actionHistory.length = 0;
        actions.forEach(action => actionHistory.push(action));
        currentActionIndex = actionHistory.length - 1;
        redrawCanvas();
        updateUndoRedoButtons();
    });
    socket.on('cursorMove', (data) => {
        // Create or update cursor element for this user
        let cursorElement = document.getElementById(`cursor-${data.userId}`);
        
        if (!cursorElement) {
            cursorElement = document.createElement('div');
            cursorElement.id = `cursor-${data.userId}`;
            cursorElement.className = 'user-cursor';
            cursorElement.setAttribute('data-user-id', data.userId.substring(0, 6));
            
            // Generate a consistent color for each user
            if (!userColors[data.userId]) {
                userColors[data.userId] = getRandomColor();
            }
            
            cursorElement.style.backgroundColor = userColors[data.userId];
            cursorElement.style.borderBottomColor = userColors[data.userId];
            
            userCursors.appendChild(cursorElement);
        }
        // Update cursor position
        cursorElement.style.left = `${data.position.x}px`;
        cursorElement.style.top = `${data.position.y}px`;
    });
    socket.on('userJoined', (userId) => {
        // Display a notification that a new user joined
        showNotification(`User ${userId.substring(0, 6)} joined the room`);
    });
    socket.on('userLeft', (userId) => {
        // Remove the cursor of the user who left
        const cursorElement = document.getElementById(`cursor-${userId}`);
        if (cursorElement) {
            cursorElement.remove();
        }
        // Display a notification that a user left
        showNotification(`User ${userId.substring(0, 6)} left the room`);
    });
    socket.on('error', (message) => {
        alert(`Error: ${message}`);
    });
    // Helper function to show notifications
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        // Remove notification after a delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
    // Helper function to generate random colors
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    // Add notification styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeIn 0.3s ease-in-out;
        }
        .notification.fade-out {
            animation: fadeOut 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);
});