# Collaborative Whiteboard

A real-time collaborative whiteboard application that allows multiple users to draw together in the same workspace.

## Overview

This project provides a web-based collaborative whiteboard where users can:
- Draw in real-time with others
- Use various drawing tools (pen, eraser, shapes)
- Customize colors and line thickness
- Undo/redo actions
- Save the whiteboard as an image
- See other users' cursors in real-time

## Features

- **Real-time collaboration**: Multiple users can draw on the same canvas simultaneously
- **Drawing tools**: Pen, eraser, rectangle, circle, and line tools
- **Customization**: Change colors and line thickness
- **Action history**: Undo and redo functionality
- **Room-based system**: Create or join specific whiteboard rooms
- **User awareness**: See other users' cursors and receive notifications when users join or leave
- **Export**: Download the whiteboard as a PNG image
- **Responsive design**: Works on desktop and mobile devices

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- [npm](https://www.npmjs.com/) (v6.0.0 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collaborative-whiteboard.git
cd collaborative-whiteboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Creating a Whiteboard

1. Visit the homepage
2. Click "Create New Whiteboard"
3. Share the generated room ID with others to collaborate

### Joining a Whiteboard

1. Visit the homepage
2. Enter the room ID in the "Join Existing Whiteboard" field
3. Click "Join"

### Drawing Tools

- **Pen**: Free-hand drawing
- **Eraser**: Erase parts of the drawing
- **Rectangle**: Draw rectangles
- **Circle**: Draw circles
- **Line**: Draw straight lines

### Actions

- **Undo/Redo**: Reverse or reapply your last actions
- **Clear**: Clear the entire canvas
- **Download**: Save the whiteboard as a PNG image
- **Copy Room ID**: Copy the current room ID to clipboard
- **Leave Room**: Return to the homepage

## Technical Details

### Frontend

- HTML5 Canvas for drawing
- JavaScript for client-side logic
- Socket.IO client for real-time communication

### Backend

- Node.js server
- Express.js for HTTP routing
- Socket.IO for WebSocket communication

### Communication Protocol

The application uses WebSockets through Socket.IO to enable real-time collaboration:

- `joinRoom`: Connect to a specific whiteboard room
- `draw`: Send drawing actions to all users in the room
- `undo`: Notify all users about an undo action
- `clearCanvas`: Clear the canvas for all users
- `cursorMove`: Update cursor position for all users

## Project Structure

```
collaborative-whiteboard/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── whiteboard.js
│   └── index.html
├── server.js
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Socket.IO for enabling real-time communication
- HTML5 Canvas API for drawing functionality

## Contact

Your Name - vikash.my022@gmail.com

Project Link: [https://github.com/itzvikash022/Collaborative_Whiteboard]

---

Feel free to customize this README to better fit your specific implementation and requirements!
