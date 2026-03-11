import axios, { AxiosResponse } from 'axios';
import * as EventEmitter from 'events';
import * as io from 'socket.io-client';
import EsoStatus, { Slug, EsoStatusMaintenance } from '@eso-status/types';

/**
 * Event declaration
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface EsoStatusConnector extends EventEmitter {
  /**
   * Event emitted when maintenance is planned
   *
   * @param event string Event name
   * @param listener (data:EsoStatusMaintenance)=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(
    event: 'maintenancePlanned',
    listener: (data: EsoStatusMaintenance) => void,
  ): this;
  /**
   * Event emitted when maintenance is removed
   *
   * @param event string Event name
   * @param listener (data:Slug)=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(event: 'maintenanceRemoved', listener: (data: Slug) => void): this;
  /**
   * Event emitted when maintenance is removed
   *
   * @param event string Event name
   * @param listener (data:EsoStatus)=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(event: 'statusUpdate', listener: (data: EsoStatus) => void): this;
  /**
   * Event emitted when socket is connected
   *
   * @param event string Event name
   * @param listener ()=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(event: 'connected', listener: () => void): this;
  /**
   * Event emitted when socket is disconnected
   *
   * @param event string Event name
   * @param listener ()=>void Event listener
   *
   * @return EsoStatusConnector
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  on(event: 'disconnect', listener: () => void): this;
  /**
   * Event emitted when socket is reconnected
   *
   * @param event string Event name
   * @param listener ()=>void Event listener
   *
   * @return EsoStatusConnector
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  on(event: 'reconnect', listener: () => void): this;
}

/**
 * Connector to fetch data from api.eso-status.com
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class,@typescript-eslint/no-unsafe-declaration-merging
export class EsoStatusConnector {
  /**
   * Methode used to get eso-status emitter
   *
   * @public
   * @static
   *
   * @return EsoStatusConnector Eso status emitter
   */
  public static listen(): EsoStatusConnector {
    // Initialize emitter
    const emitter: EsoStatusConnector = new EventEmitter();

    // Create first connect status
    let socketFirstConnect = false;

    // Connect to eso-status.com io server
    io.connect('https://preprod.api.eso-status.com', {
      secure: true,
      rejectUnauthorized: false,
      transports: ['websocket'],
    })
      .on('maintenancePlanned', (data: EsoStatusMaintenance): void => {
        emitter.emit('maintenancePlanned', data);
      })
      .on('maintenanceRemoved', (data: Slug): void => {
        emitter.emit('maintenanceRemoved', data);
      })
      .on('statusUpdate', (data: EsoStatus): void => {
        emitter.emit('statusUpdate', data);
      })
      .on('disconnect', (): void => {
        emitter.emit('disconnect');
      })
      .on('connect', (): void => {
        if (!socketFirstConnect) {
          socketFirstConnect = true;
          emitter.emit('connected');
        } else {
          emitter.emit('reconnect');
        }
      });
    return emitter;
  }

  /**
   * Methode to use to fetch eso-status.com from single slug
   *
   * @public
   * @static
   * @async
   *
   * @param slug  Slug or slugs list
   * @return Promise<EsoStatus> Eso status item
   */
  public static async get(slug: Slug): Promise<EsoStatus>;

  /**
   * Methode to use to fetch eso-status.com from multiple slug
   *
   * @public
   * @static
   * @async
   *
   * @param slug Slug[] or slugs list
   * @return Promise<EsoStatus[]> Eso status item list
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  public static async get(slug: Slug[]): Promise<EsoStatus[]>;

  /**
   * Methode to use to fetch all services eso-status.com
   *
   * @public
   * @static
   * @async
   *
   * @return Promise<EsoStatus[]> Eso status item list
   */
  public static async get(): Promise<EsoStatus[]>;

  /**
   * Methode to use to fetch eso-status.com from multiple slug
   *
   * @public
   * @static
   * @async
   *
   * @param slug Slug|Slug[]|null or slugs list
   * @return Promise<EsoStatus[]> Eso status item list
   */
  public static async get(
    slug?: Slug | Slug[],
  ): Promise<EsoStatus | EsoStatus[]> {
    if (Array.isArray(slug)) {
      return Promise.all(
        slug.map(
          (item: Slug): Promise<EsoStatus> => EsoStatusConnector.get(item),
        ),
      );
    }

    const urlEnding: string = slug && !Array.isArray(slug) ? `/${slug}` : '';
    const axiosResult: AxiosResponse = await axios.get(
      `https://preprod.api.eso-status.com/v3/service${urlEnding}`,
    );

    if (axiosResult.status !== 200) {
      throw new Error(
        `Bad response ${String(axiosResult.status)} (${String(axiosResult.data)})`,
      );
    } else if (
      !axiosResult.data ||
      Object.values(axiosResult.data as EsoStatus | EsoStatus[]).length === 0
    ) {
      throw new Error(
        `Empty response ${String(axiosResult.status)} (${String(axiosResult.data)})`,
      );
    } else {
      return axiosResult.data as EsoStatus | EsoStatus[];
    }
  }
}
