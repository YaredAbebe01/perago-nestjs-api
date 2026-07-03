import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionEntity } from '../entities/position.entity';
import { NotificationEventsModule } from '../notifications/notification-events.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

@Module({
  imports: [TypeOrmModule.forFeature([PositionEntity]), NotificationEventsModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}
