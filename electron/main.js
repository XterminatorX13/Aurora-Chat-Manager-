import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GPU Acceleration flags for better performance
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//     app.quit();
// }

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Umbra',
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#050508',
            symbolColor: '#c77dff',
            height: 40
        },
        backgroundColor: '#050508',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Check if we are in dev mode (running via vite)
    // We can check if an argument is passed or an env var
    // For simplicity, we'll try to connect to localhost:5173 first
    // If it fails (production), we load the index.html

    // In this setup, 'npm run dev' starts vite on 5173 and then electron.
    // So we can just load the URL.
    // However, for production build, we need to load the file.

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    } else {
        // In production, vite builds to dist/
        // We are in electron/main.js. 
        // If we run from root: electron . -> main is electron/main.js
        // dist is at ./dist
        // But usually electron-builder packages it differently.
        // Let's assume standard vite build output.
        // For dev now, we rely on localhost.
        mainWindow.loadURL('http://localhost:5173');
    }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers

ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (err) {
        console.error('Error reading file:', err);
        throw err;
    }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return true;
    } catch (err) {
        console.error('Error writing file:', err);
        throw err;
    }
});

ipcMain.handle('fs:readUserData', async (event, fileName) => {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, fileName);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') return null; // File doesn't exist
        throw error;
    }
});

ipcMain.handle('fs:writeUserData', async (event, fileName, data) => {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
});
