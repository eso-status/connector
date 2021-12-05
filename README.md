# eso-status/connector
[![npm](https://img.shields.io/npm/v/@eso-status/connector)](https://www.npmjs.com/package/@eso-status/connector)
[![license](https://img.shields.io/npm/l/@eso-status/connector)](https://github.com/eso-status/connector/blob/master/LICENSE.md)
<img src="https://img.shields.io/npm/dt/@eso-status/connector" alt="Downloads" />
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/eso-status/connector)](https://lgtm.com/projects/g/eso-status/connector/context:javascript)
<img src="https://img.shields.io/node/v/@eso-status/connector" alt="Node version" />
[![Build Status](https://github.com/eso-status/connector/workflows/CI/badge.svg)](https://github.com/eso-status/connector/actions/workflows/CI.yaml)
[![Delivery Status](https://github.com/eso-status/connector/workflows/CD/badge.svg)](https://github.com/eso-status/connector/actions/workflows/CD.yaml)

eso-status/connector is a library for getting eso-status.com api data

## Table of Contents
- [How to get it ?](#how-to-get-it-)
- [How to use it ?](#how-to-use-it-)
- [Slugs list](#slugs-list)

## How to get it ?
```shell
npm i @eso-status/connector
```

## How to use it ?

### Listen api socket
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

EsoStatusConnector
  .listen()
  .on('update', (esoService: EsoStatus): void => { ... });
```

### Get status for specific slug
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

EsoStatusConnector
  .get('server_ps_eu')
  .then((esoService: EsoStatus): void => { ... })
  .catch((error: Error): void => { ... });
```

### Get status for multi slugs
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

EsoStatusConnector
  .get(['server_ps_eu', 'server_ps_na'])
  .then((esoServices: EsoStatus[]): void => { ... })
  .catch((error: Error): void => { ... });
```

### Get status for all slugs
```typescript
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus } from '@eso-status/types';

EsoStatusConnector
  .get()
  .then((esoServices: EsoStatus[]): void => { ... })
  .catch((error: Error): void => { ... });
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
