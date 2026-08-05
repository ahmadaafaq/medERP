import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TimetableService],
  controllers: [TimetableController],
  exports: [TimetableService],
})
export class TimetableModule {}
