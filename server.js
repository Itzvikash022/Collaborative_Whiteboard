const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active rooms
const rooms = new Map();

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    let currentRoom = null;

    // Create a new room
    socket.on('createRoom', () => {
        const roomId = uuidv4().substring(0, 6); // Generate a shorter room ID
        rooms.set(roomId, { users: new Set(), actions: [] });
        socket.emit('roomCreated', roomId);
    });

    // Join a room
    socket.on('joinRoom', (roomId) => {
        if (!rooms.has(roomId)) {
            socket.emit('error', 'Room does not exist');
            return;
        }

        currentRoom = roomId;
        socket.join(roomId);
        rooms.get(roomId).users.add(socket.id);
        
        // Send existing canvas state to the new user
        socket.emit('canvasState', rooms.get(roomId).actions);
        
        // Notify others that a new user joined
        socket.to(roomId).emit('userJoined', socket.id);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Handle drawing events
    socket.on('draw', (data) => {
        if (!currentRoom) return;
        
        // Store the action
        rooms.get(currentRoom).actions.push(data);
        
        // Broadcast to other users in the room
        socket.to(currentRoom).emit('draw', { ...data, userId: socket.id });
    });

    // Handle clear canvas event
    socket.on('clearCanvas', () => {
        if (!currentRoom) return;
        
        rooms.get(currentRoom).actions = [];
        socket.to(currentRoom).emit('clearCanvas');
    });

    // Handle undo action
    socket.on('undo', () => {
        if (!currentRoom) return;
        
        const room = rooms.get(currentRoom);
        // Find the last action by this user
        for (let i = room.actions.length - 1; i >= 0; i--) {
            if (room.actions[i].userId === socket.id) {
                room.actions.splice(i, 1);
                break;
            }
        }
        
        // Broadcast the updated canvas state
        io.to(currentRoom).emit('canvasState', room.actions);
    });

    // Handle cursor movement
    socket.on('cursorMove', (position) => {
        if (!currentRoom) return;
        
        socket.to(currentRoom).emit('cursorMove', {
            userId: socket.id,
            position
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        
        if (currentRoom && rooms.has(currentRoom)) {
            const room = rooms.get(currentRoom);
            room.users.delete(socket.id);
            
            // Notify others that a user left
            socket.to(currentRoom).emit('userLeft', socket.id);
            
            // If room is empty, delete it
            if (room.users.size === 0) {
                rooms.delete(currentRoom);
                console.log(`Room ${currentRoom} deleted`);
            }
        }
    });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    if (!rooms.has(roomId)) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'whiteboard.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});