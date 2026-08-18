import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB Max
      },
    }),
  ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}
