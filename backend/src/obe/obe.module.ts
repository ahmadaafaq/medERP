import { Module } from '@nestjs/common';
import { ObeController } from './obe.controller';
import { ObeService } from './obe.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ObeController],
  providers: [ObeService],
  exports: [ObeService],
})
export class ObeModule {}
