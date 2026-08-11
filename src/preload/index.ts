import { contextBridge } from 'electron';

// Populated once the connection layer (src/main/core/connection) exists.
contextBridge.exposeInMainWorld('oracleLens', {});
