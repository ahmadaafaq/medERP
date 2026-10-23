import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminMasterService } from './admin-master.service';
import {
  CreateProfessionalLinkerDto, UpdateProfessionalLinkerDto,
  CreateDepartmentMasterDto, UpdateDepartmentMasterDto,
  CreateSubjectMasterDto, UpdateSubjectMasterDto,
  CreateTopicMasterDto, UpdateTopicMasterDto,
  CreateCompetencyMasterDto, UpdateCompetencyMasterDto,
  CreateDeliveryTypeDto, UpdateDeliveryTypeDto,
  CreateSubjectOfferingDto, UpdateSubjectOfferingDto,
  LinkFacultySubjectDto,
  CreateUnitMasterDto, UpdateUnitMasterDto,
  CreateProgramOutcomeDto, UpdateProgramOutcomeDto,
  CreateProgramEducationalObjectiveDto, UpdateProgramEducationalObjectiveDto,
  SaveCoPoMatrixDto, SavePoPeoMatrixDto,
} from './dto/admin-master.dto';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Admin Master')
@ApiBearerAuth()
@Public()
@Controller('admin-master')
export class AdminMasterController {
  constructor(private readonly adminMasterService: AdminMasterService) {}

  // ─── 1. PROFESSIONAL LINKERS ──────────────────────────────────────────────
  @Get('professional-linkers')
  @ApiOperation({ summary: 'List Professional Linkers — tenant read' })
  async listProfessionalLinkers(@TenantSlug() tenant: string) {
    const data = await this.adminMasterService.listProfessionalLinkers(tenant);
    return { success: true, data };
  }

  @Post('professional-linkers')
  @ApiOperation({ summary: 'Create Professional Linker' })
  async createProfessionalLinker(@Body() dto: CreateProfessionalLinkerDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createProfessionalLinker(dto, tenant);
    return { success: true, data, message: 'Professional Linker created successfully' };
  }

  @Put('professional-linkers/:id')
  @ApiOperation({ summary: 'Update Professional Linker' })
  async updateProfessionalLinker(@Param('id') id: string, @Body() dto: UpdateProfessionalLinkerDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateProfessionalLinker(id, dto, tenant);
    return { success: true, data, message: 'Professional Linker updated successfully' };
  }

  @Delete('professional-linkers/:id')
  @ApiOperation({ summary: 'Delete Professional Linker' })
  async deleteProfessionalLinker(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteProfessionalLinker(id, tenant);
  }

  // ─── 2. DEPARTMENTS ────────────────────────────────────────────────────────
  @Get('departments')
  @ApiOperation({ summary: 'List Departments — tenant read' })
  async listDepartments(@TenantSlug() tenant: string) {
    const data = await this.adminMasterService.listDepartments(tenant);
    return { success: true, data };
  }

  @Post('departments/sync-from-branches')
  @ApiOperation({ summary: 'Sync Departments from Branch data' })
  async syncDepartmentsFromBranches(@TenantSlug() tenant: string) {
    return this.adminMasterService.syncDepartmentsFromBranches(tenant);
  }

  @Get('departments/sync-from-branches')
  @ApiOperation({ summary: 'Sync Departments from Branch data (GET trigger)' })
  async syncDepartmentsFromBranchesGet(@TenantSlug() tenant: string) {
    return this.adminMasterService.syncDepartmentsFromBranches(tenant);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create Department' })
  async createDepartment(@Body() dto: CreateDepartmentMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createDepartment(dto, tenant);
    return { success: true, data, message: 'Department created successfully' };
  }

  @Put('departments/:id')
  @ApiOperation({ summary: 'Update Department' })
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateDepartment(id, dto, tenant);
    return { success: true, data, message: 'Department updated successfully' };
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete Department' })
  async deleteDepartment(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteDepartment(id, tenant);
  }

  // ─── 3. SUBJECTS ───────────────────────────────────────────────────────────
  @Post('subjects/sync-external')
  @ApiOperation({ summary: 'Sync Subjects & Offerings from external SRMS Portal API (POST)' })
  async syncExternalSubjectsPost(
    @TenantSlug() tenant: string,
    @Query('coursecd') coursecd?: string,
    @Query('branchcd') branchcd?: string,
    @Query('batchcd') batchcd?: string,
    @Query('semcd') semcd?: string,
  ) {
    const data = await this.adminMasterService.syncExternalSubjects(tenant, coursecd, branchcd, batchcd, semcd);
    return { success: true, message: 'Subjects & Offerings synced successfully (Attendance preserved)', data };
  }

  @Get('subjects/sync-external')
  @ApiOperation({ summary: 'Sync Subjects & Offerings from external SRMS Portal API (GET)' })
  async syncExternalSubjectsGet(
    @TenantSlug() tenant: string,
    @Query('coursecd') coursecd?: string,
    @Query('branchcd') branchcd?: string,
    @Query('batchcd') batchcd?: string,
    @Query('semcd') semcd?: string,
  ) {
    const data = await this.adminMasterService.syncExternalSubjects(tenant, coursecd, branchcd, batchcd, semcd);
    return { success: true, message: 'Subjects & Offerings synced successfully (Attendance preserved)', data };
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List Subjects — tenant read' })
  async listSubjects(
    @TenantSlug() tenant: string,
    @Query('facultyId') facultyId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const data = await this.adminMasterService.listSubjects(tenant, facultyId, departmentId);
    return { success: true, data };
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create Subject' })
  async createSubject(@Body() dto: CreateSubjectMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createSubject(dto, tenant);
    return { success: true, data, message: 'Subject created successfully' };
  }

  @Put('subjects/:id')
  @ApiOperation({ summary: 'Update Subject' })
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateSubject(id, dto, tenant);
    return { success: true, data, message: 'Subject updated successfully' };
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Delete Subject' })
  async deleteSubject(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteSubject(id, tenant);
  }

  // ─── 4. TOPICS ─────────────────────────────────────────────────────────────
  @Get('topics')
  @ApiOperation({ summary: 'List Topics — tenant read' })
  async listTopics(
    @TenantSlug() tenant: string,
    @Query('subjectId') subjectId?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('unitId') unitId?: string,
    @Query('unitCode') unitCode?: string,
  ) {
    const data = await this.adminMasterService.listTopics(tenant, subjectId, subjectCode, unitId, unitCode);
    return { success: true, data };
  }

  @Post('topics')
  @ApiOperation({ summary: 'Create Topic' })
  async createTopic(@Body() dto: CreateTopicMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createTopic(dto, tenant);
    return { success: true, data, message: 'Topic created successfully' };
  }

  @Put('topics/:id')
  @ApiOperation({ summary: 'Update Topic' })
  async updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateTopic(id, dto, tenant);
    return { success: true, data, message: 'Topic updated successfully' };
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete Topic' })
  async deleteTopic(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteTopic(id, tenant);
  }

  // ─── 5. COMPETENCIES ───────────────────────────────────────────────────────
  @Get('competencies')
  @ApiOperation({ summary: 'List Competencies — tenant read' })
  async listCompetencies(
    @TenantSlug() tenant: string,
    @Query('topicId') topicId?: string,
    @Query('topicCode') topicCode?: string,
    @Query('unitId') unitId?: string,
    @Query('unitCode') unitCode?: string,
    @Query('subjectId') subjectId?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    const data = await this.adminMasterService.listCompetencies(
      tenant,
      topicId,
      topicCode,
      unitId,
      unitCode,
      subjectId,
      subjectCode,
    );
    return { success: true, data };
  }

  @Get('subtopics')
  @ApiOperation({ summary: 'List Subtopics alias — tenant read' })
  async listSubtopics(
    @TenantSlug() tenant: string,
    @Query('topicId') topicId?: string,
    @Query('topicCode') topicCode?: string,
    @Query('unitId') unitId?: string,
    @Query('unitCode') unitCode?: string,
    @Query('subjectId') subjectId?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    const data = await this.adminMasterService.listCompetencies(
      tenant,
      topicId,
      topicCode,
      unitId,
      unitCode,
      subjectId,
      subjectCode,
    );
    return { success: true, data };
  }

  @Post('competencies')
  @ApiOperation({ summary: 'Create Competency' })
  async createCompetency(@Body() dto: CreateCompetencyMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createCompetency(dto, tenant);
    return { success: true, data, message: 'Competency created successfully' };
  }

  @Put('competencies/:id')
  @ApiOperation({ summary: 'Update Competency' })
  async updateCompetency(@Param('id') id: string, @Body() dto: UpdateCompetencyMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateCompetency(id, dto, tenant);
    return { success: true, data, message: 'Competency updated successfully' };
  }

  @Delete('competencies/:id')
  @ApiOperation({ summary: 'Delete Competency' })
  async deleteCompetency(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteCompetency(id, tenant);
  }

  // ─── 6. DELIVERY TYPES ─────────────────────────────────────────────────────
  @Get('delivery-types')
  @ApiOperation({ summary: 'List Delivery Types — tenant read' })
  async listDeliveryTypes(@TenantSlug() tenant: string) {
    const data = await this.adminMasterService.listDeliveryTypes(tenant);
    return { success: true, data };
  }

  @Post('delivery-types')
  @ApiOperation({ summary: 'Create Delivery Type' })
  async createDeliveryType(@Body() dto: CreateDeliveryTypeDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createDeliveryType(dto, tenant);
    return { success: true, data, message: 'Delivery type created successfully' };
  }

  @Put('delivery-types/:id')
  @ApiOperation({ summary: 'Update Delivery Type' })
  async updateDeliveryType(@Param('id') id: string, @Body() dto: UpdateDeliveryTypeDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateDeliveryType(id, dto, tenant);
    return { success: true, data, message: 'Delivery type updated successfully' };
  }

  @Delete('delivery-types/:id')
  @ApiOperation({ summary: 'Delete Delivery Type' })
  async deleteDeliveryType(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteDeliveryType(id, tenant);
  }

  // ─── 7. SUBJECT OFFERINGS ──────────────────────────────────────────────────
  @Post('subject-offerings/sync-external')
  @ApiOperation({ summary: 'Sync Subject Offerings and link attendance from SRMS Portal API (POST)' })
  async syncExternalOfferingsPost(
    @TenantSlug() tenant: string,
    @Query('coursecd') coursecd?: string,
    @Query('branchcd') branchcd?: string,
    @Query('batchcd') batchcd?: string,
    @Query('semcd') semcd?: string,
  ) {
    const data = await this.adminMasterService.syncExternalSubjects(tenant, coursecd, branchcd, batchcd, semcd);
    return { success: true, message: 'Subject Offerings synced and attendance linked successfully', data };
  }

  @Get('subject-offerings/sync-external')
  @ApiOperation({ summary: 'Sync Subject Offerings and link attendance from SRMS Portal API (GET)' })
  async syncExternalOfferingsGet(
    @TenantSlug() tenant: string,
    @Query('coursecd') coursecd?: string,
    @Query('branchcd') branchcd?: string,
    @Query('batchcd') batchcd?: string,
    @Query('semcd') semcd?: string,
  ) {
    const data = await this.adminMasterService.syncExternalSubjects(tenant, coursecd, branchcd, batchcd, semcd);
    return { success: true, message: 'Subject Offerings synced and attendance linked successfully', data };
  }

  @Get('subject-offerings')
  @ApiOperation({ summary: 'List Subject Offerings — tenant read' })
  async listSubjectOfferings(@TenantSlug() tenant: string) {
    const data = await this.adminMasterService.listSubjectOfferings(tenant);
    return { success: true, data };
  }

  @Post('subject-offerings')
  @ApiOperation({ summary: 'Create Subject Offering' })
  async createSubjectOffering(@Body() dto: CreateSubjectOfferingDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createSubjectOffering(dto, tenant);
    return { success: true, data, message: 'Subject offering created successfully' };
  }

  @Put('subject-offerings/:id')
  @ApiOperation({ summary: 'Update Subject Offering' })
  async updateSubjectOffering(@Param('id') id: string, @Body() dto: UpdateSubjectOfferingDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateSubjectOffering(id, dto, tenant);
    return { success: true, data, message: 'Subject offering updated successfully' };
  }

  @Delete('subject-offerings/:id')
  @ApiOperation({ summary: 'Delete Subject Offering' })
  async deleteSubjectOffering(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteSubjectOffering(id, tenant);
  }

  // ─── 8. FACULTY SUBJECT LINKER ─────────────────────────────────────────────
  @Get('faculty-subjects')
  @ApiOperation({ summary: 'List Faculty-Subject Links — tenant read' })
  async listFacultySubjects(
    @TenantSlug() tenant: string,
    @Query('facultyId') facultyId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    const data = await this.adminMasterService.listFacultySubjects({ facultyId, subjectId, departmentId, courseCd, branchCd }, tenant);
    return { success: true, data };
  }

  @Post('faculty-subjects')
  @ApiOperation({ summary: 'Link Faculty to Subject' })
  async linkFacultySubject(@Body() dto: LinkFacultySubjectDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.linkFacultySubject(dto, tenant);
    return { success: true, data, message: 'Faculty linked to subject successfully' };
  }

  @Put('faculty-subjects/:id')
  @ApiOperation({ summary: 'Update Faculty Subject Link' })
  async updateFacultySubject(@Param('id') id: string, @Body() dto: LinkFacultySubjectDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateFacultySubject(id, dto, tenant);
    return { success: true, data, message: 'Faculty subject link updated successfully' };
  }

  @Delete('faculty-subjects/:id')
  @ApiOperation({ summary: 'Unlink Faculty from Subject' })
  async deleteFacultySubject(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.unlinkFacultySubject(id, tenant);
  }

  // ─── 9. UNIT MASTER ─────────────────────────────────────────────────────────
  @Get('units')
  @ApiOperation({ summary: 'List Units — tenant read' })
  async listUnits(
    @TenantSlug() tenant: string,
    @Query('subjectId') subjectId?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('courseCd') courseCd?: string,
  ) {
    const data = await this.adminMasterService.listUnits(tenant, subjectId, subjectCode, courseCd);
    return { success: true, data };
  }

  @Post('units')
  @ApiOperation({ summary: 'Create Unit' })
  async createUnit(@Body() dto: CreateUnitMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createUnit(dto, tenant);
    return { success: true, data, message: 'Unit created successfully' };
  }

  @Put('units/:id')
  @ApiOperation({ summary: 'Update Unit' })
  async updateUnit(@Param('id') id: string, @Body() dto: UpdateUnitMasterDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateUnit(id, dto, tenant);
    return { success: true, data, message: 'Unit updated successfully' };
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Delete Unit' })
  async deleteUnit(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteUnit(id, tenant);
  }

  // ─── 10. PROGRAM OUTCOMES (POs / PSOs) ───────────────────────────────────────
  @Get('pos')
  @ApiOperation({ summary: 'List Program Outcomes (POs/PSOs) — tenant read' })
  async listProgramOutcomes(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    const data = await this.adminMasterService.listProgramOutcomes(tenant, courseCd, branchCd);
    return { success: true, data };
  }

  @Post('pos')
  @ApiOperation({ summary: 'Create Program Outcome (PO/PSO)' })
  async createProgramOutcome(@Body() dto: CreateProgramOutcomeDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createProgramOutcome(dto, tenant);
    return { success: true, data, message: 'Program Outcome created successfully' };
  }

  @Post('pos/seed')
  @ApiOperation({ summary: 'Seed standard NBA Program Outcomes (PO1-PO12, PSO1-PSO2) (POST)' })
  async seedProgramOutcomesPost(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.adminMasterService.seedProgramOutcomes(tenant, courseCd, branchCd);
  }

  @Get('pos/seed')
  @ApiOperation({ summary: 'Seed standard NBA Program Outcomes (PO1-PO12, PSO1-PSO2) (GET trigger)' })
  async seedProgramOutcomesGet(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.adminMasterService.seedProgramOutcomes(tenant, courseCd, branchCd);
  }

  @Put('pos/:id')
  @ApiOperation({ summary: 'Update Program Outcome' })
  async updateProgramOutcome(@Param('id') id: string, @Body() dto: UpdateProgramOutcomeDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateProgramOutcome(id, dto, tenant);
    return { success: true, data, message: 'Program Outcome updated successfully' };
  }

  @Delete('pos/:id')
  @ApiOperation({ summary: 'Delete Program Outcome' })
  async deleteProgramOutcome(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteProgramOutcome(id, tenant);
  }

  // ─── 11. PROGRAM EDUCATIONAL OBJECTIVES (PEOs) ──────────────────────────────
  @Get('peos')
  @ApiOperation({ summary: 'List Program Educational Objectives (PEOs) — tenant read' })
  async listProgramEducationalObjectives(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    const data = await this.adminMasterService.listProgramEducationalObjectives(tenant, courseCd, branchCd);
    return { success: true, data };
  }

  @Post('peos')
  @ApiOperation({ summary: 'Create Program Educational Objective (PEO)' })
  async createProgramEducationalObjective(@Body() dto: CreateProgramEducationalObjectiveDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.createProgramEducationalObjective(dto, tenant);
    return { success: true, data, message: 'Program Educational Objective created successfully' };
  }

  @Post('peos/seed')
  @ApiOperation({ summary: 'Seed standard Program Educational Objectives (PEO1-PEO5) (POST)' })
  async seedProgramEducationalObjectivesPost(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.adminMasterService.seedProgramEducationalObjectives(tenant, courseCd, branchCd);
  }

  @Get('peos/seed')
  @ApiOperation({ summary: 'Seed standard Program Educational Objectives (PEO1-PEO5) (GET trigger)' })
  async seedProgramEducationalObjectivesGet(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.adminMasterService.seedProgramEducationalObjectives(tenant, courseCd, branchCd);
  }

  @Put('peos/:id')
  @ApiOperation({ summary: 'Update Program Educational Objective' })
  async updateProgramEducationalObjective(@Param('id') id: string, @Body() dto: UpdateProgramEducationalObjectiveDto, @TenantSlug() tenant: string) {
    const data = await this.adminMasterService.updateProgramEducationalObjective(id, dto, tenant);
    return { success: true, data, message: 'Program Educational Objective updated successfully' };
  }

  @Delete('peos/:id')
  @ApiOperation({ summary: 'Delete Program Educational Objective' })
  async deleteProgramEducationalObjective(@Param('id') id: string, @TenantSlug() tenant: string) {
    return this.adminMasterService.deleteProgramEducationalObjective(id, tenant);
  }

  // ─── 12. CO - PO MATRIX ─────────────────────────────────────────────────────
  @Get('co-po-matrix')
  @ApiOperation({ summary: 'Get CO - PO Matrix for Subject' })
  async getCoPoMatrix(
    @TenantSlug() tenant: string,
    @Query('subjectId') subjectId?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchYear') batchYear?: string,
    @Query('semCd') semCd?: string,
    @Query('section') section?: string,
  ) {
    return this.adminMasterService.getCoPoMatrix(tenant, {
      subjectId,
      subjectCode,
      courseCd,
      branchCd,
      batchYear: batchYear ? parseInt(batchYear, 10) : undefined,
      semCd,
      section,
    });
  }

  @Post('co-po-matrix')
  @ApiOperation({ summary: 'Save CO - PO Matrix for Subject' })
  async saveCoPoMatrix(@Body() dto: SaveCoPoMatrixDto, @TenantSlug() tenant: string) {
    return this.adminMasterService.saveCoPoMatrix(dto, tenant);
  }

  // ─── 13. PO - PEO MATRIX ────────────────────────────────────────────────────
  @Get('po-peo-matrix')
  @ApiOperation({ summary: 'Get PO - PEO Matrix for Program' })
  async getPoPeoMatrix(
    @TenantSlug() tenant: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchYear') batchYear?: string,
    @Query('semCd') semCd?: string,
    @Query('section') section?: string,
  ) {
    return this.adminMasterService.getPoPeoMatrix(tenant, {
      courseCd,
      branchCd,
      batchYear: batchYear ? parseInt(batchYear, 10) : undefined,
      semCd,
      section,
    });
  }

  @Post('po-peo-matrix')
  @ApiOperation({ summary: 'Save PO - PEO Matrix for Program' })
  async savePoPeoMatrix(@Body() dto: SavePoPeoMatrixDto, @TenantSlug() tenant: string) {
    return this.adminMasterService.savePoPeoMatrix(dto, tenant);
  }
}

