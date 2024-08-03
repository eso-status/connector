import axios, { AxiosResponse } from 'axios';
import * as EventEmitter from 'events';
import * as io from 'socket.io-client';
import { Slug, EsoStatus, MaintenanceEsoStatus } from '@eso-status/types';

/**
 * Event declaration
 */
export declare interface EsoStatusConnector extends EventEmitter {
  /**
   * Event emitted when maintenance is planned
   *
   * @param event string Event name
   * @param listener (data:MaintenanceEsoStatus)=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(
    event: 'maintenancePlanned',
    listener: (data: MaintenanceEsoStatus) => void,
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
   * Event emitted when socket is disconnected
   *
   * @param event string Event name
   * @param listener ()=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(event: 'disconnect', listener: () => void): this;
  /**
   * Event emitted when socket is reconnected
   *
   * @param event string Event name
   * @param listener ()=>void Event listener
   *
   * @return EsoStatusConnector
   */
  on(event: 'reconnect', listener: () => void): this;
}

/**
 * Connector to fetch data from api.eso-status.com
 */
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
    let socketFirstConnect: boolean = false;

    // Connect to eso-status.com io server
    io.connect('https://api.eso-status.com', {
      secure: true,
      rejectUnauthorized: false,
      transports: ['websocket'],
    })
      .on('maintenancePlanned', (data: MaintenanceEsoStatus): void => {
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

    const axiosResult: AxiosResponse = await axios.get(
      `https://api.eso-status.com/v2/service${slug && !Array.isArray(slug) ? `/${slug}` : ''}`,
    );

    if (axiosResult?.status !== 200) {
      throw new Error(
        `Bad response ${axiosResult?.status} (${axiosResult?.data})`,
      );
    } else if (
      !axiosResult ||
      !axiosResult?.data ||
      Object.values(<EsoStatus | EsoStatus[]>axiosResult.data).length === 0
    ) {
      throw new Error(
        `Empty response ${axiosResult?.status} (${axiosResult?.data})`,
      );
    } else {
      return <EsoStatus | EsoStatus[]>axiosResult.data;
    }
  }
}
