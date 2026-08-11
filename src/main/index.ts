import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { ConnectionManager, ProviderRegistry } from './core/connection';
import { LeagueOfLegendsProvider } from './games/lol/provider';
import { IPC_CHANNELS } from '../shared/ipc';
import type { SkinRarity } from '../shared/types/lol';

const isDev = process.env.NODE_ENV === 'development';

const registry = new ProviderRegistry();
const lolProvider = new LeagueOfLegendsProvider();
registry.register(lolProvider);
const connectionManager = new ConnectionManager(registry);

ipcMain.handle(IPC_CHANNELS.lol.connectionStatus, () => lolProvider.getStatus());
ipcMain.handle(IPC_CHANNELS.lol.accountSummary, () => lolProvider.getAccountSummary());
ipcMain.handle(IPC_CHANNELS.lol.rankedSummary, () => lolProvider.getRankedSummary());
ipcMain.handle(IPC_CHANNELS.lol.championMasteries, () => lolProvider.getChampionMasteries());
ipcMain.handle(IPC_CHANNELS.lol.masteryCrestUrl, (_event, level: number) =>
  lolProvider.getMasteryCrestUrl(level),
);
ipcMain.handle(IPC_CHANNELS.lol.ownedSkins, () => lolProvider.getOwnedSkins());
ipcMain.handle(IPC_CHANNELS.lol.rarityGemUrl, (_event, rarity: SkinRarity) =>
  lolProvider.getRarityGemUrl(rarity),
);

lolProvider.onStatusChange((status) => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC_CHANNELS.lol.connectionStatusChanged, status);
  }
});

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

  win.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error(`[preload] failed to load ${preloadPath}:`, error);
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
