import { OpenNdsParams } from "@/types/database";

export type RouterDriverType = 'opennds' | 'mikrotik' | 'unifi' | 'omada';

export interface IRouterDriver {
  type: RouterDriverType;
  displayName: string;
  supportsActiveConnectionsCount: boolean;

  /**
   * Parseia e valida os parâmetros recebidos via Query String enviados pelo gateway.
   */
  parseParams(searchParams: { [key: string]: string | string[] | undefined }): OpenNdsParams;

  /**
   * Constrói a URL oficial de liberação da internet para redirecionar o cliente no roteador.
   */
  buildAuthUrl(params: {
    gatewayaddress?: string;
    gatewayport?: string;
    tok?: string;
    redir?: string;
    fasKey?: string;
  }): string;
}
