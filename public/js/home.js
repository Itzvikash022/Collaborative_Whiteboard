document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const roomIdInput = document.getElementById('roomIdInput');
    const roomInfo = document.getElementById('roomInfo');
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    const copyRoomId = document.getElementById('copyRoomId');
    const enterRoom = document.getElementById('enterRoom');
    
    let currentRoomId = null;
    
    // Create a new room
    createRoomBtn.addEventListener('click', () => {
        socket.emit('createRoom');
    });
    
    // Join an existing room
    joinRoomBtn.addEventListener('click', () => {
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            window.location.href = `/room/${roomId}`;
        } else {
            alert('Please enter a valid Room ID');
        }
    });
    
    // Copy room ID to clipboard
    copyRoomId.addEventListener('click', () => {
        navigator.clipboard.writeText(currentRoomId)
            .then(() => {
                alert('Room ID copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });
    
    // Enter the created room
    enterRoom.addEventListener('click', () => {
        if (currentRoomId) {
            window.location.href = `/room/${currentRoomId}`;
        }
    });
    
    // Socket event handlers
    socket.on('roomCreated', (roomId) => {
        currentRoomId = roomId;
        roomIdDisplay.textContent = roomId;
        roomInfo.classList.remove('hidden');
    });
    
    socket.on('error', (message) => {
        alert(`Error: ${message}`);
    });
});