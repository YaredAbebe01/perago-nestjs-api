import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PositionEventsPublisherService } from './position-events.publisher';

@Module({
  imports: [ConfigModule],
  providers: [PositionEventsPublisherService],
  exports: [PositionEventsPublisherService],
})
export class NotificationEventsModule {}