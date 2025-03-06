To export the whiteboard as an image, you can use the existing download functionality in the application. The code already includes a download button that saves the canvas as a PNG image.

Here's how to use it:

1. When you're on the whiteboard page, look for the download button in the toolbar
2. Click the download button
3. The browser will automatically download a PNG image of the current whiteboard state

The filename will be in the format: `whiteboard-[roomId]-[date].png`

If you want to manually trigger this functionality from the console, you could run:

```javascript
const link = document.createElement('a');
link.download = `whiteboard-export-${new Date().toISOString().slice(0, 10)}.png`;
link.href = document.getElementById('whiteboard').toDataURL('image/png');
link.click();
```

This will immediately download the current whiteboard canvas as a PNG image.
