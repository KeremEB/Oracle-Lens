// IPC channel names shared between main and preload, so both sides stay in sync.

export const IPC_CHANNELS = {
  lol: {
    connectionStatus: 'lol:connectionStatus',
    connectionStatusChanged: 'lol:connectionStatusChanged',
    accountSummary: 'lol:accountSummary',
    rankedSummary: 'lol:rankedSummary',
  },
} as const;
