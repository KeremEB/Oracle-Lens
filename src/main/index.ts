import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { ConnectionManager, ProviderRegistry } from './core/connection';
import { LeagueOfLegendsProvider } from './games/lol/provider';

const isDev = process.env.NODE_ENV === 'development';

const registry = new ProviderRegistry();
registry.register(new LeagueOfLegendsProvider());
const connectionManager = new ConnectionManager(registry);

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Oracle Lens',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  connectionManager.start();
});

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

app.on('before-quit', () => {
  connectionManager.stop();
});
