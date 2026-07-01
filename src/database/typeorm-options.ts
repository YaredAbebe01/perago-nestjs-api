import { DataSourceOptions } from 'typeorm';
import { PhotoEntity } from '../entities/photo.entity';
import { PositionEntity } from '../entities/position.entity';
import { UserEntity } from '../entities/user.entity';

export const createTypeOrmOptions = (
  databaseUrl?: string,
): DataSourceOptions => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for TypeORM');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [UserEntity, PhotoEntity, PositionEntity],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    ssl: { rejectUnauthorized: false },
  };
};
