import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import {
  POSITION_EVENTS_EXCHANGE,
  PositionChangeEvent,
} from './position-events.types';

@Injectable()
export class PositionEventsPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(PositionEventsPublisherService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private connecting: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async publish(event: PositionChangeEvent): Promise<void> {
    try {
      const channel = await this.getChannel();

      if (!channel) {
        return;
      }

      channel.publish(
        POSITION_EVENTS_EXCHANGE,
        event.eventType,
        Buffer.from(JSON.stringify(event)),
        {
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: 2,
          messageId: event.eventId,
          timestamp: Date.now(),
          headers: {
            'x-event-type': event.eventType,
            'x-entity-type': event.entityType,
            'x-position-id': event.positionId,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish ${event.eventType} for position ${event.positionId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async getChannel(): Promise<amqp.Channel | null> {
    if (this.channel) {
      return this.channel;
    }

    if (!this.connecting) {
      this.connecting = this.connect();
    }

    await this.connecting;
    this.connecting = null;

    return this.channel;
  }

  private async connect(): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!rabbitUrl) {
      this.logger.warn(
        'RABBITMQ_URL is not set. Position events will not be published.',
      );
      return;
    }

    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();

    await channel.assertExchange(POSITION_EVENTS_EXCHANGE, 'topic', {
      durable: true,
    });

    connection.on('error', (error) => {
      this.logger.error('RabbitMQ connection error', error.stack);
    });

    connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.connection = null;
      this.channel = null;
    });

    this.connection = connection;
    this.channel = channel;
  }
}