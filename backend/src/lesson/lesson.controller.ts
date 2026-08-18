import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res,
  UploadedFile, UseInterceptors, ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Lessons')
@ApiBearerAuth()
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Upload a new lesson material (max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createLesson(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const mockUser = { role: 'FACULTY', colgCd: dto.colgCd || '1', emp_id: 'FAC001', name: 'Faculty Member' };
    const data = await this.lessonService.createLesson(tenantSlug, mockUser, dto, file);
    return { success: true, message: 'Lesson uploaded successfully', data };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List role-scoped lessons' })
  @ApiQuery({ name: 'colgCd', required: false })
  @ApiQuery({ name: 'courseCd', required: false })
  @ApiQuery({ name: 'branchCd', required: false })
  @ApiQuery({ name: 'batchCd', required: false })
  @ApiQuery({ name: 'semCd', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'empid', required: false })
  async listLessons(
    @TenantSlug() tenantSlug: string,
    @Query('colgCd') colgCd?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semCd') semCd?: string,
    @Query('subjectId') subjectId?: string,
    @Query('empid') empid?: string,
  ) {
    const mockUser = { role: 'FACULTY', colgCd: colgCd || '1' };
    const data = await this.lessonService.listLessons(tenantSlug, mockUser, {
      colgCd, courseCd, branchCd, batchCd, semCd, subjectId, empid,
    });
    return { success: true, data };
  }

  @Public()
  @Get('recent')
  @ApiOperation({ summary: 'Get recent lessons for dashboard widget' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentLessons(
    @TenantSlug() tenantSlug: string,
    @Query('limit') limit?: string,
  ) {
    const mockUser = { role: 'FACULTY', colgCd: '1' };
    const limitNum = limit ? parseInt(limit, 10) : 6;
    const data = await this.lessonService.getRecentLessons(tenantSlug, mockUser, limitNum);
    return { success: true, data };
  }

  @Public()
  @Get(':id/download')
  @ApiOperation({ summary: 'Stream and download lesson file binary' })
  async downloadLessonFile(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const lesson = await this.lessonService.getLessonFileDetails(tenantSlug, id);

    if (!fs.existsSync(lesson.file_path)) {
      throw new BadRequestException('Physical file not found on server disk');
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(lesson.file_name)}"`);

    const stream = fs.createReadStream(lesson.file_path);
    stream.pipe(res);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scheduled lesson' })
  async deleteLesson(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const mockUser = { role: 'FACULTY', emp_id: 'FAC001' };
    return this.lessonService.deleteLesson(tenantSlug, mockUser, id);
  }
}
