import EsoStatus, { EsoStatusMaintenance, Slug } from '@eso-status/types';
import axios from 'axios';

import { Server } from 'socket.io';

import { Socket } from 'socket.io-client';
import * as io from 'socket.io-client';
import { EsoStatusConnector } from '../src';
import SpyInstance = jest.SpyInstance;

let serverSocket: Server;
let clientSocket: Socket;

const mockClient = (): jest.SpiedFunction<typeof io.connect> =>
  // ⚠️ `import * as io` gives a read-only copy of the module (esModuleInterop): the spy goes on the
  // module itself, which the source reads at every call.
  jest
    .spyOn(jest.requireActual<typeof io>('socket.io-client'), 'connect')
    .mockImplementation((): Socket => clientSocket);

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
      pattern: 'The Elder Scrolls Online (XBox - US) UP',
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
      pattern: 'The Elder Scrolls Online (XBox - EU) UP',
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

  afterAll(async () => {
    clientSocket.removeAllListeners();
    clientSocket.close();
    serverSocket.removeAllListeners();
    await serverSocket.close();

    jest.clearAllMocks();
    jest.resetModules();
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

  it('should verify the api certificate', (): void => {
    const connect = mockClient();

    EsoStatusConnector.listen();

    expect(connect).toHaveBeenCalledWith('https://preprod.api.eso-status.com', {
      secure: true,
      transports: ['websocket'],
    });
  });

  it('should maintenancePlanned event received', async (): Promise<void> => {
    const maintenanceEsoStatus: EsoStatusMaintenance = {
      rawDataList: [
        {
          source: 'https://forums.elderscrollsonline.com/',
          raw: '· EU megaservers for maintenance – August 7, 8:00 UTC (4:00AM EDT) - 16:00 UTC (12:00PM EDT)',
          pattern:
            '· EU megaservers for maintenance – [month] [day number], [hour]:[minute] [timezone] ([hour]:[minute][meridiem] [timezone]) - [hour]:[minute] [timezone] ([hour]:[minute][meridiem] [timezone])',
          slug: 'server_xbox_eu',
          rawDate: 'August 7, 8:00 UTC (4:00AM EDT) - 16:00 UTC (12:00PM EDT)',
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

    const received = await new Promise<EsoStatusMaintenance>(
      (resolve): void => {
        clientSocket.on('connect', (): void => {
          mockClient();

          EsoStatusConnector.listen().on('maintenancePlanned', resolve);

          serverSocket.emit('maintenancePlanned', maintenanceEsoStatus);
        });
      },
    );

    expect(JSON.stringify(received)).toBe(JSON.stringify(maintenanceEsoStatus));
  });

  it('should maintenanceRemoved event received', async (): Promise<void> => {
    const maintenanceRemoved: Slug = 'server_xbox_eu';

    const received = await new Promise<Slug>((resolve): void => {
      clientSocket.on('connect', (): void => {
        mockClient();

        EsoStatusConnector.listen().on('maintenanceRemoved', resolve);

        serverSocket.emit('maintenanceRemoved', maintenanceRemoved);
      });
    });

    expect(received).toBe(maintenanceRemoved);
  });

  it('should statusUpdate event received', async (): Promise<void> => {
    const statusUpdate: EsoStatus = {
      slug: 'server_xbox_na',
      status: 'up',
      type: 'server',
      support: 'xbox',
      zone: 'na',
      rawData: {
        source: 'https://live-services.elderscrollsonline.com/status/realms',
        raw: 'The Elder Scrolls Online (XBox - US) UP',
        pattern: 'The Elder Scrolls Online (XBox - US) UP',
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

    const received = await new Promise<EsoStatus>((resolve): void => {
      clientSocket.on('connect', (): void => {
        mockClient();

        EsoStatusConnector.listen().on('statusUpdate', resolve);

        serverSocket.emit('statusUpdate', statusUpdate);
      });
    });

    expect(JSON.stringify(received)).toBe(JSON.stringify(statusUpdate));
  });

  it('should disconnect event received', async (): Promise<void> => {
    const listener = jest.fn();

    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', (): void => {
        mockClient();

        EsoStatusConnector.listen().on('disconnect', (): void => {
          listener();
          resolve();
        });

        void serverSocket.close();
      });
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should reconnect event received', async (): Promise<void> => {
    // ⚠️ Since socket.io 4.8, close() releases the port only once its promise resolves.
    const restartServer = async (): Promise<void> => {
      await serverSocket.close();
      serverSocket = new Server(3000);
    };
    const listener = jest.fn();

    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', resolve);
    });
    mockClient();
    const emitter = EsoStatusConnector.listen();

    const connected = new Promise<void>((resolve): void => {
      emitter.on('connected', resolve);
    });
    await restartServer();
    await connected;

    const reconnected = new Promise<void>((resolve): void => {
      emitter.on('reconnect', (): void => {
        listener();
        resolve();
      });
    });
    await restartServer();
    await reconnected;

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
