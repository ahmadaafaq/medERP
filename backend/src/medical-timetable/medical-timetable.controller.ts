import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MedicalTimetableService } from './medical-timetable.service';
import { CreateMedicalScheduleDto, UpdateMedicalScheduleDto } from './dto/medical-timetable.dto';

@Controller('v1/medical-timetable')
@UseGuards(JwtAuthGuard)
export class MedicalTimetableController {
  constructor(private readonly service: MedicalTimetableService) {}

  private extractSlug(req: any, queryTenant?: string): string {
    const slug = queryTenant || req.user?.tenant_slug || req.user?.tenantId || req.headers['x-tenant-slug'] || 'srms-ims';
    if (!slug) {
      throw new BadRequestException('Tenant slug is required for Medical Timetable operations.');
    }
    return String(slug).trim();
  }

  @Get('courses')
  async getCourses(@Request() req: any, @Query('tenant') queryTenant?: string) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getCourses(slug);
  }

  @Get('departments')
  async getDepartments(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('courseId') courseId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getDepartments(slug, courseId);
  }

  @Get('professional-years')
  async getProfessionalYears(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('courseCode') courseCode?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getProfessionalYears(slug, courseCode || 'MBBS', departmentId);
  }

  @Get('subjects')
  async getSubjects(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getSubjects(slug, departmentId);
  }

  @Get('units')
  async getUnits(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getUnits(slug, subjectId);
  }

  @Get('topics')
  async getTopics(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('unitId') unitId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getTopics(slug, unitId, subjectId);
  }

  @Get('competencies')
  async getCompetencies(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('topicId') topicId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getCompetencies(slug, topicId, subjectId);
  }

  @Get('faculty')
  async getFaculty(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getFaculty(slug, departmentId, search);
  }

  @Get('schedule')
  async getSchedule(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('departmentId') departmentId?: string,
    @Query('professionalYearId') professionalYearId?: string,
    @Query('date') date?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getSchedule(slug, departmentId, professionalYearId, date);
  }

  @Get('all-departments-schedule')
  async getAllDepartmentsSchedule(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getAllDepartmentsSchedule(slug);
  }

  @Get('schedule/my')
  async getMySchedule(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getMySchedule(slug, req.user);
  }

  @Get('schedule/student')
  async getStudentSchedule(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getStudentSchedule(slug, req.user);
  }

  @Post('schedule')
  async createSchedule(
    @Request() req: any,
    @Body() dto: CreateMedicalScheduleDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.createSchedule(slug, dto, req.user);
  }

  @Put('schedule/:id')
  async updateSchedule(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalScheduleDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.updateSchedule(slug, id, dto, req.user);
  }

  @Delete('schedule/:id')
  async deleteSchedule(
    @Request() req: any,
    @Param('id') id: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.deleteSchedule(slug, id);
  }
}
