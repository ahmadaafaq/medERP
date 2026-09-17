import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res, Req,
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

  private extractUser(req: any, dto?: any): any {
    if (req.user && req.user.role) {
      return req.user;
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let tokenUser: any = null;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          tokenUser = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        }
      } catch {}
    }

    const headerId =
      dto?.empid ||
      dto?.sender_id ||
      req.headers?.['x-user-id'] ||
      req.headers?.['x-user-reg-no'] ||
      tokenUser?.sub ||
      tokenUser?.id ||
      tokenUser?.emp_id ||
      tokenUser?.registration_no ||
      '';
    const headerName =
      dto?.facultyName ||
      dto?.sender_name ||
      req.headers?.['x-user-name'] ||
      tokenUser?.name ||
      tokenUser?.faculty_name ||
      tokenUser?.student_name ||
      tokenUser?.username ||
      '';
    const headerRole = (
      dto?.sender_role ||
      req.headers?.['x-user-role'] ||
      tokenUser?.role ||
      'FACULTY'
    ).toUpperCase();
    const headerColg = req.headers?.['x-colg-cd'] || tokenUser?.colgCd || tokenUser?.colg_cd || '1';

    return {
      id: String(headerId),
      name: headerName ? String(headerName) : '',
      role: String(headerRole),
      colgCd: String(headerColg),
      registration_no: tokenUser?.registration_no || req.headers?.['x-user-reg-no'] || String(headerId),
      emp_id: dto?.empid || tokenUser?.emp_id || String(headerId),
    };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Upload a new lesson material (max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createLesson(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Body() dto: CreateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = this.extractUser(req, dto);
    const mockUser = {
      role: user.role || 'FACULTY',
      colgCd: dto.colgCd || user.colgCd || '1',
      emp_id: dto.empid || user.emp_id || 'FAC001',
      name: dto.facultyName || user.name || 'Faculty Member',
    };
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
    @Req() req: any,
    @Query('colgCd') colgCd?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semCd') semCd?: string,
    @Query('section') section?: string,
    @Query('subjectId') subjectId?: string,
    @Query('empid') empid?: string,
  ) {
    const user = this.extractUser(req);
    const data = await this.lessonService.listLessons(tenantSlug, user, {
      colgCd: colgCd || user.colgCd,
      courseCd,
      branchCd,
      batchCd,
      semCd,
      section,
      subjectId,
      empid,
    });
    return { success: true, data };
  }

  @Public()
  @Get('recent')
  @ApiOperation({ summary: 'Get recent lessons for dashboard widget' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'courseCd', required: false })
  @ApiQuery({ name: 'branchCd', required: false })
  @ApiQuery({ name: 'batchCd', required: false })
  @ApiQuery({ name: 'semCd', required: false })
  @ApiQuery({ name: 'colgCd', required: false })
  async getRecentLessons(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semCd') semCd?: string,
    @Query('colgCd') colgCd?: string,
  ) {
    const user = this.extractUser(req);
    const limitNum = limit ? parseInt(limit, 10) : 6;
    const data = await this.lessonService.getRecentLessons(tenantSlug, user, {
      limit: limitNum,
      courseCd,
      branchCd,
      batchCd,
      semCd,
      colgCd: colgCd || user.colgCd,
    });
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
