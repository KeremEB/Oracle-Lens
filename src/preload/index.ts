import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc';
import type { ConnectionStatus } from '../shared/types/core';
import type { OracleLensBridge } from '../shared/types/bridge';

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
};

const oracleLens: OracleLensBridge = { lol };

contextBridge.exposeInMainWorld('oracleLens', oracleLens);
