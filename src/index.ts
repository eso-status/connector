import axios, { AxiosResponse } from 'axios';
import * as EventEmitter from 'events';
import { io } from 'socket.io-client';
import {
  Slug,
  EsoStatus,
  MaintenanceEsoStatus,
} from '@eso-status/types';

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
  on(event: 'maintenancePlanned', listener: (data: MaintenanceEsoStatus) => void): this;
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
   * Eso status api URI
   *
   * @private
   * @static
   *
   * @return string Eso status api URI
   */
  private static apiUri = 'https://api.eso-status.com';

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
    io(`${EsoStatusConnector.apiUri}/`, {
      path: '/v1/socket',
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
   * Methode to use to fetch eso-status.com
   *
   * @public
   * @static
   * @async
   *
   * @param slug  Slug or slugs list
   * @return Promise<EsoStatus[]> Eso status item list
   */
  public static async get(slug?: Slug|Slug[]): Promise<EsoStatus[]> {
    // Create URL
    const url: string = `${EsoStatusConnector.apiUri}/v1/status${slug ? (typeof slug === 'string' ? `/${slug}` : `/${slug?.join('-')}`) : ''}`;

    // Execute axios request
    const response: AxiosResponse = await axios.get(url);

    if (response?.status !== 200) {
      throw new Error(`Bad response ${response?.status} (${response?.data})`);
    } else if (!response?.data) {
      throw new Error(`Empty response ${response?.status} (${response?.data})`);
    } else {
      return (response ? response?.data : []);
    }
  }
}
