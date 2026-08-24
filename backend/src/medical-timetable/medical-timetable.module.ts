import { Module } from '@nestjs/common';
import { MedicalTimetableController } from './medical-timetable.controller';
import { MedicalTimetableService } from './medical-timetable.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MedicalTimetableController],
  providers: [MedicalTimetableService],
  exports: [MedicalTimetableService],
})
export class MedicalTimetableModule {}
