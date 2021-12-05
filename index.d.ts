/// <reference types="node" />
import * as EventEmitter from 'events';
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
export declare class EsoStatusConnector {
    /**
     * Eso status api URI
     *
     * @private
     * @static
     *
     * @return string Eso status api URI
     */
    private static apiUri;
    /**
     * Methode used to get eso-status emitter
     *
     * @public
     * @static
     *
     * @return EsoStatusConnector Eso status emitter
     */
    static listen(): EsoStatusConnector;
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
    static get(slug?: Slug | Slug[]): Promise<EsoStatus[]>;
}
