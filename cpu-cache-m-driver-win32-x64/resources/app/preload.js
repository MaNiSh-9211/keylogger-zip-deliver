const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onKeyPressed: (callback) => ipcRenderer.on('key-pressed', (event, key) => callback(key)),
});
