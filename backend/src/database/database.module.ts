import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantSchemaService } from './tenant-schema.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.pass'),
        database: config.get<string>('database.name'),
        // We manage schemas manually — auto-load entities for registered modules
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('app.env') === 'development' ? ['error', 'warn'] : ['error'],
        // Connection pool
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          statement_timeout: 30000,
        },
        // Search path defaults to public; per-request schema is set via SET search_path
        schema: 'public',
      }),
    }),
  ],
  providers: [TenantSchemaService],
  exports: [TenantSchemaService],
})
export class DatabaseModule {}
