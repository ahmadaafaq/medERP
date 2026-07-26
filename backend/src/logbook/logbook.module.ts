import { Module } from '@nestjs/common';
import { LogbookController } from './logbook.controller';
import { LogbookService } from './logbook.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LogbookController],
  providers: [LogbookService],
  exports: [LogbookService],
})
export class LogbookModule {}
