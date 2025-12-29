
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

const API_URL = "http://188.124.37.192:5000";
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100, height: 750, frame: false, resizable: false, transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // УМНАЯ ЗАГРУЗКА: Сначала пробуем localhost (dev), если не вышло - грузим файл (prod)
  mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.whenReady().then(createWindow);

ipcMain.on('window-close', () => app.quit());
ipcMain.on('window-minimize', () => mainWindow.minimize());

ipcMain.on('select-client-path', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
    event.reply('selected-client-path', result.filePaths[0]);
  }
});

ipcMain.on('launch-game', async (event, data) => {
    const { username, lang, clientPath } = data;
    if (!clientPath) return;

    try {
        await axios.post(`${API_URL}/server/update_ip`, { username }).catch(() => {});
        const encodedUser = Buffer.from(username).toString('base64');

        let exeName = "TURBORU.exe";
        if (lang === "Korean") exeName = "TURBOKR.exe";
        if (lang === "Chinese") exeName = "TURBOCN.exe";

        const args = `"P=&H1=&H2=MTEwMDQ=&P0=${encodedUser}&P1=Q19SMg==&P2=NDYxMg==&P3=&P4=McOWP774R2&P5=&PC1=Tg==&PC2=Tg=="`;
        const command = `cmd /c start "" "${exeName}" ${args}`;

        exec(command, { cwd: clientPath }, (err) => {
            if (err) console.error("Error launching game:", err);
        });

    } catch (e) { console.error("System Error:", e.message); }
});

ipcMain.on('open-settings', (event, clientPath) => {
    if(!clientPath) return;
    exec(`cmd /c start "" "R2Option.exe"`, { cwd: clientPath });
});
