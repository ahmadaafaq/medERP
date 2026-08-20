import { Module } from '@nestjs/common';
import { PlacementDriveController } from './placement-drive.controller';
import { PlacementDriveService } from './placement-drive.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PlacementDriveController],
  providers: [PlacementDriveService],
  exports: [PlacementDriveService],
})
export class PlacementDriveModule {}
