import { IRouterDriver, RouterDriverType } from './types';
import { OpenNdsDriver } from './opennds';

const driversMap: Record<RouterDriverType, IRouterDriver> = {
  opennds: new OpenNdsDriver(),
  // Futuros drivers (Fase 4 no Roadmap):
  mikrotik: new OpenNdsDriver(), // Stub para Fase 4
  unifi: new OpenNdsDriver(),    // Stub para Fase 4
  omada: new OpenNdsDriver(),    // Stub para Fase 4
};

export function getRouterDriver(type: RouterDriverType = 'opennds'): IRouterDriver {
  return driversMap[type] || driversMap.opennds;
}

export * from './types';
export * from './opennds';
