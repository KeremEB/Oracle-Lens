// IPC channel names shared between main and preload, so both sides stay in sync.

export const IPC_CHANNELS = {
  core: {
    getPreferences: 'core:getPreferences',
    setPreference: 'core:setPreference',
    saveExportFile: 'core:saveExportFile',
  },
  lol: {
    connectionStatus: 'lol:connectionStatus',
    connectionStatusChanged: 'lol:connectionStatusChanged',
    accountSummary: 'lol:accountSummary',
    rankedSummary: 'lol:rankedSummary',
    championMasteries: 'lol:championMasteries',
    masteryCrestUrl: 'lol:masteryCrestUrl',
    ownedSkins: 'lol:ownedSkins',
    rarityGemUrl: 'lol:rarityGemUrl',
    ownedChromas: 'lol:ownedChromas',
    ownedWardSkins: 'lol:ownedWardSkins',
    ownedEmotes: 'lol:ownedEmotes',
    ownedProfileIcons: 'lol:ownedProfileIcons',
    profileIconUrl: 'lol:profileIconUrl',
    levelBorderUrl: 'lol:levelBorderUrl',
    wallet: 'lol:wallet',
    rankedEmblemUrl: 'lol:rankedEmblemUrl',
  },
} as const;
