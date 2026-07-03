# Notifications Module — Line-by-Line Explanation

## position-events.types.ts

```ts
1:  export const POSITION_EVENTS_EXCHANGE = 'organization.events';
```
Defines the RabbitMQ topic exchange name `organization.events`. All position-related events are published to this exchange.

```ts
2:  export const POSITION_EVENTS_ROUTING_PREFIX = 'position';
```
Routing key prefix used when binding queues. Currently exported but not used in this folder — intended for consumer-side queue binding.

```ts
4:  export type PositionChangeEventType =
5:    | 'position.created'
6:    | 'position.updated'
7:    | 'position.deleted';
```
Union type of the three possible position lifecycle events: create, update, and delete. The actual event string becomes the routing key when publishing.

```ts
9:  export type PositionSnapshot = {
10:   id: string;
11:   name: string;
12:   description: string;
13:   email: string | null;
14:   parentId: string | null;
15: };
```
Shape of a position record at a point in time. Used inside `PositionChangeEvent` to represent the current state (`position`) and the before/after state when changes occur.

```ts
17: export type PositionChangeEvent = {
18:   eventId: string;
```
Unique identifier for the event (usually a UUID). Can be used for deduplication by consumers.

```ts
19:   eventType: PositionChangeEventType;
```
Which operation occurred: `position.created`, `position.updated`, or `position.deleted`.

```ts
20:   entityType: 'position';
```
Literal type `'position'` so consumers can distinguish position events from other entity events on the same exchange.

```ts
21:   occurredAt: string;
```
ISO 8601 timestamp of when the event was generated.

```ts
22:   positionId: string;
23:   positionName: string;
```
Convenience fields so consumers can identify the affected position without parsing the full snapshot.

```ts
24:   position: PositionSnapshot;
```
The complete current state of the position after the event.

```ts
25:   actorId?: string | null;
```
Optional ID of the user who performed the action.

```ts
26:   changes?: {
27:     before: PositionSnapshot;
28:     after: PositionSnapshot;
29:   };
```
Optional diff — present only for `position.updated` events. Contains the state before and after the change, so consumers know exactly what changed.

---

## position-events.publisher.ts

```ts
1:  import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
```
NestJS decorator `@Injectable()` marks the class as a provider; `Logger` for structured logging; `OnModuleDestroy` lifecycle hook for graceful shutdown.

```ts
2:  import { ConfigService } from '@nestjs/config';
```
NestJS configuration service to read the `RABBITMQ_URL` environment variable.

```ts
3:  import * as amqp from 'amqplib';
```
The `amqplib` library — the official Node.js AMQP 0-9-1 client for RabbitMQ.

```ts
4:  import {
5:    POSITION_EVENTS_EXCHANGE,
6:    PositionChangeEvent,
7:  } from './position-events.types';
```
Imports the exchange name constant and the event type from the types file.

```ts
9:  @Injectable()
10: export class PositionEventsPublisherService implements OnModuleDestroy {
```
NestJS injectable service. Implements `OnModuleDestroy` to close RabbitMQ connections when the application shuts down.

```ts
11:   private readonly logger = new Logger(PositionEventsPublisherService.name);
```
Creates a logger instance scoped to this service's class name for consistent log output.

```ts
12:   private connection: amqp.Connection | null = null;
13:   private channel: amqp.Channel | null = null;
14:   private connecting: Promise<void> | null = null;
```
Three private fields:
- `connection` — the TCP connection to RabbitMQ broker.
- `channel` — a lightweight multiplexed channel over the connection, used for actual publish operations.
- `connecting` — a promise that acts as a lock so concurrent calls to `getChannel()` share a single connection attempt instead of creating multiple connections.

```ts
16:   constructor(private readonly configService: ConfigService) {}
```
Injects `ConfigService` to read `RABBITMQ_URL` from environment/config at connection time.

### `publish(event)` — lines 18-49

```ts
18:   async publish(event: PositionChangeEvent): Promise<void> {
```
Public method called by the positions service. Takes a fully-formed `PositionChangeEvent` and publishes it to RabbitMQ.

```ts
19:     try {
20:       const channel = await this.getChannel();
```
Gets a reusable channel (lazy-connects on first call). The entire publish is wrapped in try/catch so failures don't crash the caller.

```ts
22:       if (!channel) {
23:         return;
24:       }
```
If `RABBITMQ_URL` is not configured, `getChannel()` returns `null` and the publish is silently skipped. This allows the application to run without RabbitMQ in development.

```ts
26:       channel.publish(
27:         POSITION_EVENTS_EXCHANGE,
28:         event.eventType,
29:         Buffer.from(JSON.stringify(event)),
30:         {
31:           contentType: 'application/json',
32:           contentEncoding: 'utf-8',
33:           deliveryMode: 2,
34:           messageId: event.eventId,
35:           timestamp: Date.now(),
36:           headers: {
37:             'x-event-type': event.eventType,
38:             'x-entity-type': event.entityType,
39:             'x-position-id': event.positionId,
40:           },
41:         },
42:       );
```
The core publish call:
- **Exchange:** `organization.events` — a topic exchange.
- **Routing key:** `event.eventType` — e.g., `position.created`, so consumers can filter by event type.
- **Message body:** JSON-serialized `PositionChangeEvent` as a `Buffer`.
- **Options:**
  - `contentType` / `contentEncoding` — tell consumers the payload is UTF-8 JSON.
  - `deliveryMode: 2` — persistent message (survives broker restart).
  - `messageId` — set to the event's own ID for deduplication.
  - `timestamp` — broker-independent timestamp.
  - `headers` — custom headers so consumers can route/filter without deserializing the body.

```ts
43:     } catch (error) {
44:       this.logger.error(
45:         `Failed to publish ${event.eventType} for position ${event.positionId}`,
46:         error instanceof Error ? error.stack : undefined,
47:       );
48:     }
```
On publish failure (e.g., connection lost), logs the error with stack trace. The method does **not** rethrow — the caller is expected to continue its business logic even if the notification fails.

### `onModuleDestroy()` — lines 51-54

```ts
51:   async onModuleDestroy(): Promise<void> {
52:     await this.channel?.close().catch(() => undefined);
53:     await this.connection?.close().catch(() => undefined);
54:   }
```
Graceful shutdown hook. Closes the channel first, then the connection. The `.catch(() => undefined)` swallows any errors during close (e.g., already closed connection).

### `getChannel()` — lines 56-69

```ts
56:   private async getChannel(): Promise<amqp.Channel | null> {
57:     if (this.channel) {
58:       return this.channel;
59:     }
```
Fast path: if a channel already exists, return it immediately.

```ts
61:     if (!this.connecting) {
62:       this.connecting = this.connect();
63:     }
```
If no connection attempt is in progress, start one and store the promise in `this.connecting`. If another call arrives before the connection completes, it awaits the same promise instead of opening a second connection. This is a simple connection-lock pattern.

```ts
65:     await this.connecting;
66:     this.connecting = null;
```
Wait for the connection to finish, then clear the lock so future calls can detect a broken channel and reconnect.

```ts
68:     return this.channel;
```
Returns the channel (or `null` if `RABBITMQ_URL` was not set).

### `connect()` — lines 71-100

```ts
71:   private async connect(): Promise<void> {
72:     const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
```
Reads `RABBITMQ_URL` from config (usually from environment variables or `.env` file).

```ts
74:     if (!rabbitUrl) {
75:       this.logger.warn(
76:         'RABBITMQ_URL is not set. Position events will not be published.',
77:       );
78:       return;
79:     }
```
If the URL is missing, log a warning and return without connecting. `this.channel` stays `null`, and all publish calls become no-ops.

```ts
81:     const connection = await amqp.connect(rabbitUrl);
82:     const channel = await connection.createChannel();
```
Opens a TCP connection to RabbitMQ, then creates a channel over that connection. Uses `await` so connection errors propagate to the caller.

```ts
84:     await channel.assertExchange(POSITION_EVENTS_EXCHANGE, 'topic', {
85:       durable: true,
86:     });
```
Ensures the `organization.events` topic exchange exists (creates it if missing). `durable: true` means the exchange survives broker restarts.

```ts
88:     connection.on('error', (error) => {
89:       this.logger.error('RabbitMQ connection error', error.stack);
90:     });
```
Logs connection-level errors (e.g., heartbeat timeout, network failure). Does not attempt reconnect — the next publish call will find `this.channel === null` and re-trigger `connect()`.

```ts
92:     connection.on('close', () => {
93:       this.logger.warn('RabbitMQ connection closed');
94:       this.connection = null;
95:       this.channel = null;
96:     });
```
When the connection is closed (by the server or due to an error), null out both fields so the next publish will attempt a fresh connection.

```ts
98:     this.connection = connection;
99:     this.channel = channel;
```
Store the established connection and channel for use by `getChannel()` and `publish()`.

---

## notification-events.module.ts

```ts
1:  import { Module } from '@nestjs/common';
2:  import { ConfigModule } from '@nestjs/config';
3:  import { PositionEventsPublisherService } from './position-events.publisher';
```
Standard NestJS module imports.

```ts
5:  @Module({
6:    imports: [ConfigModule],
7:    providers: [PositionEventsPublisherService],
8:    exports: [PositionEventsPublisherService],
9:  })
10: export class NotificationEventsModule {}
```
- **`imports: [ConfigModule]`** — makes `ConfigService` available for injection into the publisher.
- **`providers`** — registers `PositionEventsPublisherService` so it can be injected.
- **`exports`** — makes the publisher available to other modules (specifically `PositionsModule`), which is how `PositionsService` gets access to it.

---

## Summary

| File | Role |
|---|---|
| `position-events.types.ts` | Defines the event shape (`PositionChangeEvent`) and the exchange name. |
| `position-events.publisher.ts` | Lazily connects to RabbitMQ and publishes typed events as JSON to the `organization.events` topic exchange. |
| `notification-events.module.ts` | NestJS module that wires the publisher into the DI container and exports it. |

**Flow:** `PositionsService` calls `publisher.publish(event)` → the publisher serializes the event to JSON → publishes it to RabbitMQ exchange `organization.events` with a routing key like `position.created` → consumers on the other system receive and process the message.
