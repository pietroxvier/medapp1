const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('remediosAPI', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (state) => ipcRenderer.invoke('state:save', state),
});
