import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc';
import type { ConnectionStatus } from '../shared/types/core';
import type { OracleLensBridge } from '../shared/types/bridge';

const core: OracleLensBridge['core'] = {
  getPreferences: () => ipcRenderer.invoke(IPC_CHANNELS.core.getPreferences),

  setPreference: (key, value) =>
    ipcRenderer.invoke(IPC_CHANNELS.core.setPreference, key, value),

  saveExportFile: (request) => ipcRenderer.invoke(IPC_CHANNELS.core.saveExportFile, request),
};

const lol: OracleLensBridge['lol'] = {
  getConnectionStatus: () => ipcRenderer.invoke(IPC_CHANNELS.lol.connectionStatus),

  onConnectionStatusChange(listener) {
    const wrapped = (_event: IpcRendererEvent, status: ConnectionStatus): void => listener(status);
    ipcRenderer.on(IPC_CHANNELS.lol.connectionStatusChanged, wrapped);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.lol.connectionStatusChanged, wrapped);
  },

  getAccountSummary: () => ipcRenderer.invoke(IPC_CHANNELS.lol.accountSummary),

  getRankedSummary: () => ipcRenderer.invoke(IPC_CHANNELS.lol.rankedSummary),

  getChampionMasteries: () => ipcRenderer.invoke(IPC_CHANNELS.lol.championMasteries),

  getMasteryCrestUrl: (level) => ipcRenderer.invoke(IPC_CHANNELS.lol.masteryCrestUrl, level),

  getOwnedSkins: () => ipcRenderer.invoke(IPC_CHANNELS.lol.ownedSkins),

  getRarityGemUrl: (rarity) => ipcRenderer.invoke(IPC_CHANNELS.lol.rarityGemUrl, rarity),

  getOwnedChromas: () => ipcRenderer.invoke(IPC_CHANNELS.lol.ownedChromas),

  getOwnedWardSkins: () => ipcRenderer.invoke(IPC_CHANNELS.lol.ownedWardSkins),

  getOwnedEmotes: () => ipcRenderer.invoke(IPC_CHANNELS.lol.ownedEmotes),

  getOwnedProfileIcons: () => ipcRenderer.invoke(IPC_CHANNELS.lol.ownedProfileIcons),

  getProfileIconUrl: (iconId) => ipcRenderer.invoke(IPC_CHANNELS.lol.profileIconUrl, iconId),

  getLevelBorderUrl: (accountLevel) =>
    ipcRenderer.invoke(IPC_CHANNELS.lol.levelBorderUrl, accountLevel),

  getWallet: () => ipcRenderer.invoke(IPC_CHANNELS.lol.wallet),

  getRankedEmblemUrl: (tier) => ipcRenderer.invoke(IPC_CHANNELS.lol.rankedEmblemUrl, tier),

  getRiotPointsIconUrl: () => ipcRenderer.invoke(IPC_CHANNELS.lol.riotPointsIconUrl),

  getBlueEssenceIconUrl: () => ipcRenderer.invoke(IPC_CHANNELS.lol.blueEssenceIconUrl),
};

const oracleLens: OracleLensBridge = { core, lol };

contextBridge.exposeInMainWorld('oracleLens', oracleLens);
