import { Module } from '@nestjs/common';
import { StudentCredentialsController } from './student-credentials.controller';
import { StudentCredentialsService } from './student-credentials.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StudentCredentialsController],
  providers: [StudentCredentialsService],
  exports: [StudentCredentialsService],
})
export class StudentCredentialsModule {}
