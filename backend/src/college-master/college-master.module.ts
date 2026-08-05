import { Module } from '@nestjs/common';
import { CollegeMasterController } from './college-master.controller';
import { CollegeMasterService } from './college-master.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CollegeMasterController],
  providers: [CollegeMasterService],
  exports: [CollegeMasterService],
})
export class CollegeMasterModule {}
