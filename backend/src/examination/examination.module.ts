import { Module } from '@nestjs/common';
import { ExaminationController } from './examination.controller';
import { ExaminationService } from './examination.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExaminationController],
  providers: [ExaminationService],
  exports: [ExaminationService],
})
export class ExaminationModule {}
