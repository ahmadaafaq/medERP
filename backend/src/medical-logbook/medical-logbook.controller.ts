import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FirmModeGuard, RequiresFirmMode } from '../common/guards/firm-mode.guard';
import { MedicalLogbookService } from './medical-logbook.service';
import {
  CreateActivityMasterDto,
  UpdateActivityMasterDto,
  CreateSeminarMasterDto,
  UpdateSeminarMasterDto,
  SaveLogbookSessionDto,
  VerifyLogbookRecordDto,
  CreatePGLogbookRecordDto,
} from './dto/medical-logbook.dto';

@ApiTags('Medical Logbook')
@ApiBearerAuth()
@Controller('medical-logbook')
@UseGuards(JwtAuthGuard, FirmModeGuard)
@RequiresFirmMode('MED')
export class MedicalLogbookController {
  constructor(private readonly service: MedicalLogbookService) {}

  private extractSlug(req: any, queryTenant?: string): string {
    const slug =
      queryTenant ||
      req.headers['x-tenant-slug'] ||
      req.headers['x-tenant-id'] ||
      req.user?.tenantSlug ||
      req.user?.tenant_slug ||
      req.tenantSlug ||
      req.tenant?.slug ||
      'srms-ims';

    if (!slug) {
      throw new BadRequestException('Tenant slug is required for Medical Logbook operations.');
    }
    return String(slug).trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  }

  // ===========================================================================
  // 1. CASCADING LOOKUPS (9 LEVELS + MASTER CODES)
  // ===========================================================================

  @Get('lookups/professionals')
  @ApiOperation({ summary: 'Get professional phases (1st Prof, 2nd Prof, 3rd Prof Part I, Part II)' })
  async getProfessionals(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('courseCode') courseCode?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getProfessionals(slug, courseCode);
  }

  @Get('lookups/courses')
  @ApiOperation({ summary: 'Get medical courses (MBBS, BAMS, MD, MS)' })
  async getCourses(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('programLevel') programLevel?: 'UG' | 'PG',
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getCourses(slug, programLevel || 'UG');
  }

  @Get('lookups/branches')
  @ApiOperation({ summary: 'Get branches / departments' })
  async getBranches(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('courseId') courseId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getBranches(slug, courseId);
  }

  @Get('lookups/batches')
  @ApiOperation({ summary: 'Get academic batches' })
  async getBatches(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('branchId') branchId?: string,
    @Query('courseId') courseId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getBatches(slug, branchId, courseId);
  }

  @Get('lookups/cbme-years')
  @ApiOperation({ summary: 'Get CBME curriculum years' })
  async getCbmeYears(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('professionalYearId') professionalYearId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getCbmeYears(slug, professionalYearId);
  }

  @Get('lookups/subjects')
  @ApiOperation({ summary: 'Get subjects scoped to professional year / department' })
  async getSubjects(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('professionalYearId') professionalYearId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getSubjects(slug, professionalYearId, departmentId);
  }

  @Get('lookups/units')
  @ApiOperation({ summary: 'Get units scoped to subject' })
  async getUnits(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getUnits(slug, subjectId);
  }

  @Get('lookups/topics')
  @ApiOperation({ summary: 'Get topics scoped to unit or subject' })
  async getTopics(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('unitId') unitId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getTopics(slug, unitId, subjectId);
  }

  @Get('lookups/competencies')
  @ApiOperation({ summary: 'Get competencies (returns id, code, title, displayText)' })
  async getCompetencies(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('topicId') topicId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getCompetencies(slug, topicId, subjectId);
  }

  @Get('lookups/activity-types')
  @ApiOperation({ summary: 'Get activity types (Practical, Lab, Skills, etc.)' })
  async getActivityTypes(@Request() req: any, @Query('tenant') queryTenant?: string) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getActivityTypes(slug);
  }

  @Get('lookups/status-codes')
  @ApiOperation({ summary: 'Get rubric status codes (F, M, C)' })
  async getStatusRubrics(@Request() req: any, @Query('tenant') queryTenant?: string) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getStatusRubrics(slug);
  }

  @Get('lookups/group-students')
  @ApiOperation({ summary: 'Get student roster group-wise (Groups A, B, C, D)' })
  async getGroupStudents(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('groupId') groupId?: string,
    @Query('batchId') batchId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getStudentsByGroup(slug, groupId, batchId);
  }

  // ===========================================================================
  // 2. DATA DIRECTORY → ACTIVITY MASTER
  // ===========================================================================

  @Post('activity-master')
  @ApiOperation({ summary: 'Create Activity Master entry' })
  async createActivityMaster(
    @Request() req: any,
    @Body() dto: CreateActivityMasterDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.createActivityMaster(slug, dto, req.user);
  }

  @Get('activity-master')
  @ApiOperation({ summary: 'List and filter Activity Master entries' })
  async listActivityMaster(
    @Request() req: any,
    @Query() query: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.listActivityMaster(slug, query);
  }

  @Put('activity-master/:id')
  @ApiOperation({ summary: 'Update Activity Master entry' })
  async updateActivityMaster(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateActivityMasterDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.updateActivityMaster(slug, id, dto, req.user);
  }

  @Delete('activity-master/:id')
  @ApiOperation({ summary: 'Soft-delete Activity Master entry' })
  async deleteActivityMaster(
    @Request() req: any,
    @Param('id') id: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.deleteActivityMaster(slug, id);
  }

  // ===========================================================================
  // 3. DATA DIRECTORY → SEMINAR MASTER
  // ===========================================================================

  @Post('seminar-master')
  @ApiOperation({ summary: 'Create Seminar Master entry' })
  async createSeminarMaster(
    @Request() req: any,
    @Body() dto: CreateSeminarMasterDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.createSeminarMaster(slug, dto, req.user);
  }

  @Get('seminar-master')
  @ApiOperation({ summary: 'List Seminar Master entries' })
  async listSeminarMaster(
    @Request() req: any,
    @Query() query: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.listSeminarMaster(slug, query);
  }

  @Put('seminar-master/:id')
  @ApiOperation({ summary: 'Update Seminar Master entry' })
  async updateSeminarMaster(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSeminarMasterDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.updateSeminarMaster(slug, id, dto, req.user);
  }

  @Delete('seminar-master/:id')
  @ApiOperation({ summary: 'Soft-delete Seminar Master entry' })
  async deleteSeminarMaster(
    @Request() req: any,
    @Param('id') id: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.deleteSeminarMaster(slug, id);
  }

  // ===========================================================================
  // 4. UG LOGBOOK
  // ===========================================================================

  @Get('ug-logbook/activities')
  @ApiOperation({ summary: 'Query activities matching Competency + Activity Type' })
  async getUgLogbookActivities(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('competencyId') competencyId?: string,
    @Query('activityTypeId') activityTypeId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getActivitiesForLogbook(slug, competencyId, activityTypeId);
  }

  @Get('ug-logbook/students')
  @ApiOperation({ summary: 'Fetch students group-wise for session' })
  async getUgLogbookStudents(
    @Request() req: any,
    @Query('tenant') queryTenant?: string,
    @Query('groupId') groupId?: string,
    @Query('batchId') batchId?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.getStudentsByGroup(slug, groupId, batchId);
  }

  @Post('ug-logbook')
  @ApiOperation({ summary: 'Idempotent bulk save of session and student evaluations' })
  async saveUgLogbookSession(
    @Request() req: any,
    @Body() dto: SaveLogbookSessionDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.saveLogbookSession(slug, dto, req.user);
  }

  @Get('ug-logbook')
  @ApiOperation({ summary: 'List student logbook evaluations (Pending, Verified, Absent ledger)' })
  async listUgLogbookRecords(
    @Request() req: any,
    @Query() query: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.listLogbookRecords(slug, query);
  }

  @Patch('ug-logbook/:recordId/verify')
  @ApiOperation({ summary: 'Transition student evaluation record to Verified status' })
  async verifyUgStudentRecord(
    @Request() req: any,
    @Param('recordId') recordId: string,
    @Body() dto: VerifyLogbookRecordDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.verifyStudentRecord(slug, recordId, dto, req.user);
  }

  // ===========================================================================
  // 5. PG LOGBOOK (STANDALONE POST-GRADUATE ENGINE)
  // ===========================================================================

  @Post('pg-logbook')
  @ApiOperation({ summary: 'Create PG logbook case/procedure record' })
  async createPGLogRecord(
    @Request() req: any,
    @Body() dto: CreatePGLogbookRecordDto,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.createPGLogRecord(slug, dto, req.user);
  }

  @Get('pg-logbook')
  @ApiOperation({ summary: 'List PG logbook records' })
  async listPGLogRecords(
    @Request() req: any,
    @Query() query: any,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.listPGLogRecords(slug, query);
  }

  @Patch('pg-logbook/:recordId/verify')
  @ApiOperation({ summary: 'Verify PG resident record' })
  async verifyPGLogRecord(
    @Request() req: any,
    @Param('recordId') recordId: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = this.extractSlug(req, queryTenant);
    return await this.service.verifyPGLogRecord(slug, recordId, req.user);
  }
}
