// config-preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('configAPI', {
  onLoadConfig: (callback) => ipcRenderer.on('load-config', (event, config) => callback(config)),
  saveConfig: (config) => ipcRenderer.send('save-config', config)
});