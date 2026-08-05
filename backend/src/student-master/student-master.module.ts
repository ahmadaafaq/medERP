import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StudentMasterService } from './student-master.service';
import { StudentMasterController } from './student-master.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [StudentMasterController],
  providers: [StudentMasterService],
  exports: [StudentMasterService],
})
export class StudentMasterModule {}
