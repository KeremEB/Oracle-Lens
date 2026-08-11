import type { OracleLensBridge } from '../shared/types/bridge';

declare global {
  interface Window {
    oracleLens: OracleLensBridge;
  }
}

export {};
