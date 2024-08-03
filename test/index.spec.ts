import { EsoStatus, MaintenanceEsoStatus, Slug } from '@eso-status/types';
import { AxiosResponse } from 'axios';

import { Server } from 'socket.io';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as moment from 'moment/moment';

import { Socket } from 'socket.io-client';
import * as io from 'socket.io-client';
import { EsoStatusConnector } from '../src';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const axios = require('axios');

describe('should index.ts works', () => {
  let serverSocket: Server;
  let clientSocket: Socket;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const get: jest.SpyInstance<Promise<AxiosResponse>> = jest.spyOn(
    axios,
    'get',
  );

  const serverXboxNa: EsoStatus = {
    slug: 'server_xbox_na',
    status: 'up',
    type: 'server',
    support: 'xbox',
    zone: 'na',
    raw: {
      sources: ['https://live-services.elderscrollsonline.com/status/realms'],
      raw: ['The Elder Scrolls Online (XBox - US)', 'UP'],
      rawSlug: 'The Elder Scrolls Online (XBox - US)',
      rawStatus: 'UP',
      slugs: ['server_xbox_na'],
      support: 'xbox',
      zone: 'na',
      status: 'up',
    },
  };
  const serverXboxEu: EsoStatus = {
    slug: 'server_xbox_eu',
    status: 'up',
    type: 'server',
    support: 'xbox',
    zone: 'eu',
    raw: {
      sources: ['https://live-services.elderscrollsonline.com/status/realms'],
      raw: ['The Elder Scrolls Online (XBox - EU)', 'UP'],
      rawSlug: 'The Elder Scrolls Online (XBox - EU)',
      rawStatus: 'UP',
      slugs: ['server_xbox_eu'],
      support: 'xbox',
      zone: 'eu',
      status: 'up',
    },
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  beforeEach(async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get.mockImplementation((url): Promise<any> => {
      if (url === `https://api.eso-status.com/v2/service/server_xbox_na`) {
        return Promise.resolve({
          data: serverXboxNa,
          status: 200,
          statusText: 'ok',
        });
      }

      if (url === `https://api.eso-status.com/v2/service/server_xbox_eu`) {
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
    await new Promise<void>((resolve): void => {
      serverSocket.close((): void => {
        resolve();
      });
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get.mockImplementation((): Promise<any> => {
      return Promise.resolve({
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    try {
      await EsoStatusConnector.get();
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error).toBeInstanceOf(Error);
    }
  });

  it("should get() when API don't return data", async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get.mockImplementation((): Promise<any> => {
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'ok',
      });
    });

    try {
      await EsoStatusConnector.get();
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should maintenancePlanned event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', (): void => {
        jest
          .spyOn(io, 'connect')
          .mockImplementation((): Socket => clientSocket);

        const maintenanceEsoStatus: MaintenanceEsoStatus = {
          raw: {
            sources: [
              'https://forums.elderscrollsonline.com/',
              'https://forums.elderscrollsonline.com/en/categories/pts',
            ],
            raw: [
              '· EU megaservers for maintenance – August 7, 8:00 UTC (4:00AM EDT) - 16:00 UTC (12:00PM EDT)',
            ],
            slugs: ['server_xbox_eu'],
            rawDate:
              'August 7, 8:00 UTC (4:00AM EDT) - 16:00 UTC (12:00PM EDT)',
            dates: [
              moment()
                .utc()
                .set('years', 2024)
                .set('months', 8)
                .set('date', 7)
                .set('hours', 8)
                .set('minutes', 0)
                .set('seconds', 0)
                .set('milliseconds', 0)
                .utcOffset(0),
              moment()
                .utc()
                .set('years', 2024)
                .set('months', 8)
                .set('date', 7)
                .set('hours', 16)
                .set('minutes', 0)
                .set('seconds', 0)
                .set('milliseconds', 0)
                .utcOffset(0),
            ],
            type: 'server',
            support: 'xbox',
            zone: 'eu',
            status: 'planned',
          },
          slug: 'server_xbox_eu',
          beginnerAt: '2024-08-07T08:00:00.000Z',
          endingAt: '2024-08-07T16:00:00.000Z',
        };

        EsoStatusConnector.listen().on(
          'maintenancePlanned',
          (data: MaintenanceEsoStatus): void => {
            if (JSON.stringify(maintenanceEsoStatus) === JSON.stringify(data)) {
              // eslint-disable-next-line jest/no-conditional-expect
              expect(true).toStrictEqual(true);
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
        jest
          .spyOn(io, 'connect')
          .mockImplementation((): Socket => clientSocket);

        const maintenanceRemoved: Slug = 'server_xbox_eu';

        EsoStatusConnector.listen().on(
          'maintenanceRemoved',
          (data: Slug): void => {
            if (data === maintenanceRemoved) {
              // eslint-disable-next-line jest/no-conditional-expect
              expect(true).toStrictEqual(true);
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
        jest
          .spyOn(io, 'connect')
          .mockImplementation((): Socket => clientSocket);

        const statusUpdate: EsoStatus = {
          slug: 'server_xbox_na',
          status: 'up',
          type: 'server',
          support: 'xbox',
          zone: 'na',
          raw: {
            sources: [
              'https://live-services.elderscrollsonline.com/status/realms',
            ],
            raw: ['The Elder Scrolls Online (XBox - US)', 'UP'],
            rawSlug: 'The Elder Scrolls Online (XBox - US)',
            rawStatus: 'UP',
            slugs: ['server_xbox_na'],
            support: 'xbox',
            zone: 'na',
            status: 'up',
          },
        };

        EsoStatusConnector.listen().on(
          'statusUpdate',
          (data: EsoStatus): void => {
            if (JSON.stringify(data) === JSON.stringify(statusUpdate)) {
              // eslint-disable-next-line jest/no-conditional-expect
              expect(true).toStrictEqual(true);
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
      clientSocket.on('connect', (): void => {
        jest
          .spyOn(io, 'connect')
          .mockImplementation((): Socket => clientSocket);

        EsoStatusConnector.listen().on('disconnect', (): void => {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(true).toStrictEqual(true);
          resolve();
        });

        serverSocket.close();
      });
    });
  });

  it('should reconnect event received', async (): Promise<void> => {
    await new Promise<void>((resolve): void => {
      clientSocket.on('connect', (): void => {
        jest
          .spyOn(io, 'connect')
          .mockImplementation((): Socket => clientSocket);

        EsoStatusConnector.listen().on('reconnect', (): void => {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(true).toStrictEqual(true);
          resolve();
        });

        serverSocket.close();
        serverSocket = new Server(3000);
      });
    });
  });
});
