import { Module } from '@nestjs/common';
import { IncubationCellController } from './incubation-cell.controller';
import { IncubationCellService } from './incubation-cell.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IncubationCellController],
  providers: [IncubationCellService],
  exports: [IncubationCellService],
})
export class IncubationCellModule {}
