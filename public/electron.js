
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100, height: 750,
    frame: false, transparent: true, resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // В упакованном виде (__dirname) - это папка public или корень ресурсов
  // Поэтому ищем index.html в папке build, которая будет лежать рядом
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Вариант для CRA: путь к собранному index.html
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }
}

app.on('ready', createWindow);
ipcMain.on('window-close', () => app.quit());
ipcMain.on('window-minimize', () => mainWindow.minimize());

ipcMain.on('launch-game', (event, args) => {
  const { username, password, lang, clientPath } = args;
  let exe = lang === "Korean" ? "FinalKR.exe" : (lang === "Chinese" ? "FinalCN.exe" : "FinalRU.exe");
  const encoded = Buffer.from(username).toString('base64');
  const gameArgs = `P=&H1=&H2=MTEwMDQ=&P0=${encoded}&P1=Q19SMg==&P2=NDYxMg==&P3=&P4=${password}&P5=&PC1=Tg==&PC2=Tg==`;
  let cwd = clientPath || path.resolve(__dirname, '..', '..'); // Поднимаемся выше ресурсов
  const fullPath = path.join(cwd, exe);
  if (fs.existsSync(fullPath)) {
    spawn(fullPath, [gameArgs], { detached: true, stdio: 'ignore', cwd: cwd }).unref();
  }
});
