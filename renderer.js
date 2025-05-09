// Store current status message and color
let currentMessage = '';
let currentColor = '';

// Initial transparency fix on load
document.addEventListener('DOMContentLoaded', () => {
  // Force body background to be fully transparent
  document.body.style.backgroundColor = 'transparent';
  document.documentElement.style.backgroundColor = 'transparent';
  
  // Apply styles to prevent any white background
  const style = document.createElement('style');
  style.textContent = `
    body, html { 
      background-color: transparent !important; 
      transition: none !important;
    }
    * { transition: none !important; }
  `;
  document.head.appendChild(style);
});

window.overlayAPI.onStatus((data) => {
  const el = document.getElementById('status');
  el.textContent = data.message;
  el.style.color = data.status ? 'limegreen' : 'red';
  
  // Store current values
  currentMessage = data.message;
  currentColor = data.status ? 'limegreen' : 'red';
  
  // Force transparency update
  document.body.style.backgroundColor = 'transparent';
  document.documentElement.style.backgroundColor = 'transparent';
});

// Handle refresh requests without resetting the status
window.overlayAPI.onRefresh(() => {
  // Force transparency again
  document.body.style.backgroundColor = 'transparent';
  document.documentElement.style.backgroundColor = 'transparent';
  
  // If we have stored values, ensure they're still displayed
  if (currentMessage) {
    const el = document.getElementById('status');
    el.textContent = currentMessage;
    el.style.color = currentColor;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const dragHandle = document.getElementById('dragHandle');
  
  // When mouse enters the drag handle, allow mouse events
  dragHandle.addEventListener('mouseenter', () => {
    window.overlayAPI.setIgnoreMouseEvents(false);
  });
  
  // When mouse leaves the drag handle, ignore mouse events again
  dragHandle.addEventListener('mouseleave', () => {
    window.overlayAPI.setIgnoreMouseEvents(true, { forward: true });
  });
  
  // Make the drag handle actually draggable
  let dragging = false;
  let mouseStartX, mouseStartY;
  let windowStartX, windowStartY;
  
  dragHandle.addEventListener('mousedown', async (e) => {
    dragging = true;
    mouseStartX = e.screenX;
    mouseStartY = e.screenY;
    
    // Get current window position from main process
    const position = await window.overlayAPI.getCurrentPosition();
    windowStartX = position.x;
    windowStartY = position.y;
    
    // Prevent text selection during drag
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    
    const dx = e.screenX - mouseStartX;
    const dy = e.screenY - mouseStartY;
    
    // Move relative to the starting position
    window.overlayAPI.setWindowPosition(
      Math.round(windowStartX + dx),
      Math.round(windowStartY + dy)
    );
  });
  
  document.addEventListener('mouseup', () => {
    dragging = false;
  });
});