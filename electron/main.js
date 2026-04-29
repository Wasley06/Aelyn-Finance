import { app, BrowserWindow, nativeImage, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const isDev = !app.isPackaged;

function getAppIcon() {
  const iconPath = isDev
    ? path.join(process.cwd(), 'src', 'assets', 'aelyn-logo.png')
    : path.join(process.resourcesPath, 'resources', 'aelyn-logo.png');

  if (fs.existsSync(iconPath)) return nativeImage.createFromPath(iconPath);
  return undefined;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1220,
    height: 820,
    backgroundColor: '#070b16',
    icon: getAppIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (isDev && devUrl) {
    await win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexHtml = path.join(process.cwd(), 'dist', 'index.html');
  await win.loadFile(indexHtml);
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

