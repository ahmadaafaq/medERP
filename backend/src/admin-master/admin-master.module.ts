import { Module } from '@nestjs/common';
import { AdminMasterController } from './admin-master.controller';
import { AdminMasterService } from './admin-master.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminMasterController],
  providers: [AdminMasterService],
  exports: [AdminMasterService],
})
export class AdminMasterModule {}
