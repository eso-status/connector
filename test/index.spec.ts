import EsoStatus, { EsoStatusMaintenance, Slug } from '@eso-status/types';
import axios from 'axios';

import { Server } from 'socket.io';

import { Socket } from 'socket.io-client';
import * as io from 'socket.io-client';
import { EsoStatusConnector } from '../src';
import SpyInstance = jest.SpyInstance;

let serverSocket: Server;
let clientSocket: Socket;

const mockClient = (): void => {
  jest.spyOn(io, 'connect').mockImplementation((): Socket => clientSocket);
};

describe('should index.ts works', () => {
  const get: SpyInstance<Promise<unknown>> = jest.spyOn(axios, 'get');

  const serverXboxNa: EsoStatus = {
    slug: 'server_xbox_na',
    status: 'up',
    type: 'server',
    support: 'xbox',
    zone: 'na',
    rawData: {
      source: 'https://live-services.elderscrollsonline.com/status/realms',
      raw: 'The Elder Scrolls Online (XBox - US) UP',
      rawSlug: 'The Elder Scrolls Online (XBox - US)',
      rawStatus: 'UP',
      slug: 'server_xbox_na',
      type: 'server',
      support: 'xbox',
      zone: 'na',
      status: 'up',
    },
    statusSince: '1970-01-01T00:00:00.000Z',
  };
  const serverXboxEu: EsoStatus = {
    slug: 'server_xbox_eu',
    status: 'up',
    type: 'server',
    support: 'xbox',
    zone: 'eu',
    rawData: {
      source: 'https://live-services.elderscrollsonline.com/status/realms',
      raw: 'The Elder Scrolls Online (XBox - EU) UP',
      rawSlug: 'The Elder Scrolls Online (XBox - EU)',
      rawStatus: 'UP',
      slug: 'server_xbox_eu',
      type: 'server',
      support: 'xbox',
      zone: 'eu',
      status: 'up',
    },
    statusSince: '1970-01-01T00:00:00.000Z',
  };

  beforeEach((): void => {
    get.mockImplementation((url): Promise<unknown> => {
      if (
        url === `https://preprod.api.eso-status.com/v3/service/server_xbox_na`
      ) {
        return Promise.resolve({
          data: serverXboxNa,
          status: 200,
          statusText: 'ok',
        });
      }

      if (
        url === `https://preprod.api.eso-status.com/v3/service/server_xbox_eu`
      ) {
        return Promise.resolve({
          data: serverXboxEu,
          status: 200,
          statusText: 'ok',
        });
      }

      return Promise.resolve({
        data: [serverXboxNa, serverXboxEu],
        status: 200,
        statusText: 'ok',
      });
    });

    serverSocket = new Server(3000);
    clientSocket = io.io('ws://localhost:3000', {
      transports: ['websocket'],
    });
  });

  afterEach(async (): Promise<void> => {
    clientSocket.close();
    await serverSocket.close();
  });

  it.each([[serverXboxNa], [serverXboxEu]])(
    'should get(slug: Slug) works',
    async (esoStatus: EsoStatus): Promise<void> => {
      expect(await EsoStatusConnector.get(esoStatus.slug)).toStrictEqual(
        esoStatus,
      );
    },
  );

  it('should get(slug: Slug[]) works', async (): Promise<void> => {
    expect(
      await EsoStatusConnector.get(['server_xbox_eu', 'server_xbox_na']),
    ).toStrictEqual([serverXboxEu, serverXboxNa]);
  });

  it('should get() works', async (): Promise<void> => {
    expect(await EsoStatusConnector.get()).toStrictEqual([
      serverXboxNa,
      serverXboxEu,
    ]);
  });

  it("should get() when API don't return 200 status", async (): Promise<void> => {
    get.mockImplementation((): Promise<unknown> => {
      return Promise.resolve({
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    try {
      await EsoStatusConnector.get();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it("should get() when API don't return data", async (): Promise<void> => {
    get.mockImplementation((): Promise<unknown> => {
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'ok',
      });
    });

    try {
      await EsoStatusConnector.get();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should maintenancePlanned event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', (): void => {
        mockClient();

        const maintenanceEsoStatus: EsoStatusMaintenance = {
          rawDataList: [
            {
              source: 'https://forums.elderscrollsonline.com/',
              raw: '· EU megaservers for maintenance – August 7, 8:00 UTC (4:00AM EDT) - 16:00 UTC (12:00PM EDT)',
              slug: 'server_xbox_eu',
              rawDate:
                'August 7, 8:00 UTC (4:00AM EDT) - 16:00 UTC (12:00PM EDT)',
              dates: ['2024-08-07T08:00:00.000Z', '2024-08-07T16:00:00.000Z'],
              type: 'server',
              support: 'xbox',
              zone: 'eu',
              status: 'planned',
              rawSlug: '',
            },
          ],
          beginnerAt: '2024-08-07T08:00:00.000Z',
          endingAt: '2024-08-07T16:00:00.000Z',
          plannedSince: '1970-01-01T00:00:00.000Z',
        };

        EsoStatusConnector.listen().on(
          'maintenancePlanned',
          (data: EsoStatusMaintenance): void => {
            if (JSON.stringify(maintenanceEsoStatus) === JSON.stringify(data)) {
              expect(true).toBe(true);
              resolve();
            }
          },
        );

        serverSocket.emit('maintenancePlanned', maintenanceEsoStatus);
      });
    });
  });

  it('should maintenanceRemoved event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', (): void => {
        mockClient();

        const maintenanceRemoved: Slug = 'server_xbox_eu';

        EsoStatusConnector.listen().on(
          'maintenanceRemoved',
          (data: Slug): void => {
            if (data === maintenanceRemoved) {
              expect(true).toBe(true);
              resolve();
            }
          },
        );

        serverSocket.emit('maintenanceRemoved', maintenanceRemoved);
      });
    });
  });

  it('should statusUpdate event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', (): void => {
        mockClient();

        const statusUpdate: EsoStatus = {
          slug: 'server_xbox_na',
          status: 'up',
          type: 'server',
          support: 'xbox',
          zone: 'na',
          rawData: {
            source:
              'https://live-services.elderscrollsonline.com/status/realms',
            raw: 'The Elder Scrolls Online (XBox - US) UP',
            rawSlug: 'The Elder Scrolls Online (XBox - US)',
            rawStatus: 'UP',
            slug: 'server_xbox_na',
            type: 'server',
            support: 'xbox',
            zone: 'na',
            status: 'up',
          },
          statusSince: '1970-01-01T00:00:00.000Z',
        };

        EsoStatusConnector.listen().on(
          'statusUpdate',
          (data: EsoStatus): void => {
            if (JSON.stringify(data) === JSON.stringify(statusUpdate)) {
              expect(true).toBe(true);
              resolve();
            }
          },
        );

        serverSocket.emit('statusUpdate', statusUpdate);
      });
    });
  });

  it('should disconnect event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', async (): Promise<void> => {
        mockClient();

        EsoStatusConnector.listen().on('disconnect', resolve);

        await serverSocket.close();
      });
    });

    expect(true).toBe(true);
  });

  it('should reconnect event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', async (): Promise<void> => {
        mockClient();

        EsoStatusConnector.listen().on('reconnect', resolve);

        await serverSocket.close();
        serverSocket = new Server(3000);
      });
    });

    expect(true).toBe(true);
  });

  afterAll(async () => {
    clientSocket.removeAllListeners();
    clientSocket.close();
    serverSocket.removeAllListeners();
    await serverSocket.close();

    jest.clearAllMocks();
    jest.resetModules();
  });
});
