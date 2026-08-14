import { app, BrowserWindow, ipcMain, Menu, type MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import { ConnectionManager, ProviderRegistry } from './core/connection';
import { getPreferences, setPreference } from './core/store/preferences';
import {
  clearSnapshots,
  deleteSnapshot,
  getSnapshot,
  listSnapshots,
  saveSnapshot,
} from './core/store/snapshots';
import { saveExportFile } from './core/export/saveExportFile';
import type { SaveExportRequest } from '../shared/types/export';
import { LeagueOfLegendsProvider } from './games/lol/provider';
import { IPC_CHANNELS } from '../shared/ipc';
import type { GameId, Preferences } from '../shared/types/core';
import type { SkinRarity } from '../shared/types/lol';

const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
}

const registry = new ProviderRegistry();
const lolProvider = new LeagueOfLegendsProvider();
registry.register(lolProvider);
const connectionManager = new ConnectionManager(registry);

ipcMain.handle(IPC_CHANNELS.core.getPreferences, () => getPreferences());
ipcMain.handle(
  IPC_CHANNELS.core.setPreference,
  (_event, key: keyof Preferences, value: Preferences[keyof Preferences]) =>
    setPreference(key, value),
);

ipcMain.handle(IPC_CHANNELS.core.saveExportFile, (event, request: SaveExportRequest) =>
  saveExportFile(BrowserWindow.fromWebContents(event.sender), request),
);

ipcMain.handle(IPC_CHANNELS.core.listSnapshots, (_event, gameId?: GameId) => listSnapshots(gameId));
ipcMain.handle(IPC_CHANNELS.core.getSnapshot, (_event, id: string) => getSnapshot(id));
ipcMain.handle(
  IPC_CHANNELS.core.saveSnapshot,
  (
    _event,
    input: { gameId: GameId; accountKey: string; label: string; subtitle: string; data: unknown },
  ) => {
    const { data, ...meta } = input;
    return saveSnapshot(meta, data);
  },
);
ipcMain.handle(IPC_CHANNELS.core.deleteSnapshot, (_event, id: string) => deleteSnapshot(id));
ipcMain.handle(IPC_CHANNELS.core.clearSnapshots, (_event, gameId?: GameId) => clearSnapshots(gameId));

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
ipcMain.handle(IPC_CHANNELS.lol.ownedChromas, () => lolProvider.getOwnedChromas());
ipcMain.handle(IPC_CHANNELS.lol.ownedWardSkins, () => lolProvider.getOwnedWardSkins());
ipcMain.handle(IPC_CHANNELS.lol.ownedEmotes, () => lolProvider.getOwnedEmotes());
ipcMain.handle(IPC_CHANNELS.lol.ownedProfileIcons, () => lolProvider.getOwnedProfileIcons());
ipcMain.handle(IPC_CHANNELS.lol.profileIconUrl, (_event, iconId: number) =>
  lolProvider.getProfileIconUrl(iconId),
);
ipcMain.handle(IPC_CHANNELS.lol.levelBorderUrl, (_event, accountLevel: number) =>
  lolProvider.getLevelBorderUrl(accountLevel),
);
ipcMain.handle(IPC_CHANNELS.lol.wallet, () => lolProvider.getWallet());
ipcMain.handle(IPC_CHANNELS.lol.rankedEmblemUrl, (_event, tier: string) =>
  lolProvider.getRankedEmblemUrl(tier),
);
ipcMain.handle(IPC_CHANNELS.lol.riotPointsIconUrl, () => lolProvider.getRiotPointsIconUrl());
ipcMain.handle(IPC_CHANNELS.lol.blueEssenceIconUrl, () => lolProvider.getBlueEssenceIconUrl());
ipcMain.handle(IPC_CHANNELS.lol.masteryBannerUrl, (_event, level: number) =>
  lolProvider.getMasteryBannerUrl(level),
);
ipcMain.handle(IPC_CHANNELS.lol.honorBadgeUrl, (_event, level: number) =>
  lolProvider.getHonorBadgeUrl(level),
);
ipcMain.handle(IPC_CHANNELS.lol.playerLoot, () => lolProvider.getPlayerLoot());

lolProvider.onStatusChange((status) => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC_CHANNELS.lol.connectionStatusChanged, status);
  }
});

// Electron's default application menu binds CmdOrCtrl+R (and +Shift+R) to
// Reload/Force Reload — a native accelerator that fires regardless of the
// renderer's own keydown handling, and regardless of autoHideMenuBar (the
// bar is hidden, but its accelerators still work). Ctrl+R is repurposed in
// the renderer to refresh account data instead (see App.tsx), so the menu is
// rebuilt here without any reload entry. Edit's standard shortcuts
// (copy/paste/undo/redo/select-all) are kept via the built-in role, and dev
// tools stay reachable in development.
const menuTemplate: MenuItemConstructorOptions[] = [
  { role: 'editMenu' },
  {
    label: 'View',
    submenu: [
      ...(isDev ? [{ role: 'toggleDevTools' } as MenuItemConstructorOptions] : []),
      { role: 'togglefullscreen' },
    ],
  },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

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
