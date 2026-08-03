import { IRouterDriver, RouterDriverType } from './types';
import { OpenNdsParams } from '@/types/database';
import { parseOpenNdsParams, buildOpenNdsAuthUrl } from '../opennds';

export class OpenNdsDriver implements IRouterDriver {
  type: RouterDriverType = 'opennds';
  displayName = 'OpenWrt + openNDS (FAS Level 1, 2, 3)';
  
  // O openNDS redireciona e autoriza sessões via FAS. A contagem em tempo real exige consulta CLI ndsctl no roteador.
  supportsActiveConnectionsCount = false;

  parseParams(searchParams: { [key: string]: string | string[] | undefined }): OpenNdsParams {
    return parseOpenNdsParams(searchParams);
  }

  buildAuthUrl(params: {
    gatewayaddress?: string;
    gatewayport?: string;
    tok?: string;
    redir?: string;
    fasKey?: string;
  }): string {
    return buildOpenNdsAuthUrl(params);
  }
}
