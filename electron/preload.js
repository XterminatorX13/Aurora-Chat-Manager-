const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ── File System ──
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    readUserData: (fileName) => ipcRenderer.invoke('fs:readUserData', fileName),
    writeUserData: (fileName, data) => ipcRenderer.invoke('fs:writeUserData', fileName, data),

    // ── AI Bridge (Generative UI) ──
    streamChat: (params) => ipcRenderer.invoke('ai:stream', params),
    abortChat: () => ipcRenderer.invoke('ai:abort'),
    saveSettings: (settings) => ipcRenderer.invoke('ai:saveSettings', settings),
    getSettings: () => ipcRenderer.invoke('ai:getSettings'),
    getModels: () => ipcRenderer.invoke('ai:getModels'),

    // AI streaming listeners (main → renderer)
    onAiChunk: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('ai:chunk', handler);
        return () => ipcRenderer.removeListener('ai:chunk', handler);
    },
    onAiToolCall: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('ai:toolCall', handler);
        return () => ipcRenderer.removeListener('ai:toolCall', handler);
    },
    onAiDone: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('ai:done', handler);
        return () => ipcRenderer.removeListener('ai:done', handler);
    },
    onAiError: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('ai:error', handler);
        return () => ipcRenderer.removeListener('ai:error', handler);
    },
});
