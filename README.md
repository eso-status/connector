# eso-status/connector

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=bugs)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=coverage)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=eso-status_connector&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=eso-status_connector)

[![npm](https://img.shields.io/npm/v/@eso-status/connector)](https://www.npmjs.com/package/@eso-status/connector)
[![license](https://img.shields.io/npm/l/@eso-status/connector)](https://github.com/eso-status/connector/blob/master/LICENSE.md)
<img src="https://img.shields.io/npm/dt/@eso-status/connector" alt="Downloads" />
<img src="https://img.shields.io/node/v/@eso-status/connector" alt="Node version" />

[![Build Status](https://github.com/eso-status/connector/workflows/CI/badge.svg)](https://github.com/eso-status/connector/actions/workflows/CI.yaml)
[![Build Status](https://github.com/eso-status/connector/workflows/CD/badge.svg)](https://github.com/eso-status/connector/actions/workflows/CD.yaml)


eso-status/connector is a library for retrieving data from the eso-status.com API

## Table of Contents
- [How to get it ?](#how-to-get-it-)
- [How to use it ?](#how-to-use-it-)
- [Slugs list](#slugs-list)

## How to get it ?
```shell
npm i @eso-status/connector
```

## How to use it ?

### Listen api socket for service status update
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

EsoStatusConnector.listen().on('statusUpdate', (esoStatus: EsoStatus): void => {
  ...
});

```

### Listen api socket for service maintenance emitted
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { MaintenanceEsoStatus } from '@eso-status/types';

EsoStatusConnector.listen().on(
  'maintenancePlanned',
  (maintenanceEsoStatus: MaintenanceEsoStatus): void => {
    ...
  },
);

```

### Listen api socket for service maintenance removed
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { Slug } from '@eso-status/types';

EsoStatusConnector.listen().on('maintenanceRemoved', (slug: Slug): void => {
  ...
});


```

### Get status for specific slug
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

const esoStatus: EsoStatus = await EsoStatusConnector.get('server_pc_eu');
```

### Get status for multi slugs
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

const esoStatusList: EsoStatus[] = await EsoStatusConnector.get([
  'server_pc_eu',
  'server_pc_na',
]);
```

### Get status for all slugs
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

const esoStatusList: EsoStatus[] = await EsoStatusConnector.get();
```

## Slugs list
| Server/Service name | slug                   |
|---------------------|------------------------|
| XBOX NA             | server_xbox_na         |
| XBOX EU             | server_xbox_eu         |
| PlayStation NA      | server_ps_na           |
| PlayStation EU      | server_ps_eu           |
| PC NA               | server_pc_na           |
| PC EU               | server_pc_eu           |
| PTS                 | server_pc_pts          |
| Web site            | service_web_site       |
| Official forum      | service_web_forum      |
| Web crown store     | service_store_crown    |
| In game crown store | service_store_eso      |
| Account system      | service_system_account |

