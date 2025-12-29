
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    close: () => ipcRenderer.send('window-close'),
    minimize: () => ipcRenderer.send('window-minimize'),
    selectPath: () => ipcRenderer.send('select-client-path'),
    launchGame: (data) => ipcRenderer.send('launch-game', data),
    openSettings: (path) => ipcRenderer.send('open-settings', path),
    onPathSelected: (callback) => ipcRenderer.on('selected-client-path', (event, path) => callback(path))
});
