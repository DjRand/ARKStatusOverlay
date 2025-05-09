const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  onStatus: (callback) => ipcRenderer.on('server-status', (event, data) => callback(data)),
  onRefresh: (callback) => ipcRenderer.on('refresh-overlay', (event) => callback()),
  setDragging: (enabled) => ipcRenderer.send('set-dragging', enabled),
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },
  getCurrentPosition: () => {
    return ipcRenderer.invoke('get-window-position');
  },
  setWindowPosition: (x, y) => {
    ipcRenderer.send('set-window-position', x, y);
  }
});
