import { Module } from '@nestjs/common';
import { MedicalLogbookController } from './medical-logbook.controller';
import { MedicalLogbookService } from './medical-logbook.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MedicalLogbookController],
  providers: [MedicalLogbookService],
  exports: [MedicalLogbookService],
})
export class MedicalLogbookModule {}
