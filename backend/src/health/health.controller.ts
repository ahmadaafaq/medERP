import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database ping
      () => this.db.pingCheck('postgres', { timeout: 3000 }),
      // RAM — alert if heap > 500 MB
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      // Disk — alert if < 10% free
      () =>
        this.disk.checkStorage('disk_storage', {
          thresholdPercent: 0.9,
          path: process.platform === 'win32' ? (process.cwd().split('\\')[0] + '\\') : '/',
        }),
    ]);
  }

  @Public()
  @Get('ping')
  ping() {
    return {
      success: true,
      message: 'UniCampus ERP API is running 🚀',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };
  }
}
