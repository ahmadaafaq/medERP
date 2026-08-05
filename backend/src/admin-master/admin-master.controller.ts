import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
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
} from './dto/admin-master.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Admin Master')
@ApiBearerAuth()
@Controller('admin-master')
export class AdminMasterController {
  constructor(private readonly adminMasterService: AdminMasterService) {}

  // ─── 1. PROFESSIONAL LINKERS ──────────────────────────────────────────────
  @Get('professional-linkers')
  @ApiOperation({ summary: 'List Professional Linkers — tenant read' })
  async listProfessionalLinkers(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listProfessionalLinkers(tenant);
    return { success: true, data };
  }

  @Post('professional-linkers')
  @ApiOperation({ summary: 'Create Professional Linker' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createProfessionalLinker(@Body() dto: CreateProfessionalLinkerDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createProfessionalLinker(dto, tenant);
    return { success: true, data, message: 'Professional Linker created successfully' };
  }

  @Put('professional-linkers/:id')
  @ApiOperation({ summary: 'Update Professional Linker' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateProfessionalLinker(@Param('id') id: string, @Body() dto: UpdateProfessionalLinkerDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateProfessionalLinker(id, dto, tenant);
    return { success: true, data, message: 'Professional Linker updated successfully' };
  }

  @Delete('professional-linkers/:id')
  @ApiOperation({ summary: 'Delete Professional Linker' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteProfessionalLinker(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteProfessionalLinker(id, tenant);
  }

  // ─── 2. DEPARTMENTS ────────────────────────────────────────────────────────
  @Get('departments')
  @ApiOperation({ summary: 'List Departments — tenant read' })
  async listDepartments(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listDepartments(tenant);
    return { success: true, data };
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createDepartment(@Body() dto: CreateDepartmentMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createDepartment(dto, tenant);
    return { success: true, data, message: 'Department created successfully' };
  }

  @Put('departments/:id')
  @ApiOperation({ summary: 'Update Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateDepartment(id, dto, tenant);
    return { success: true, data, message: 'Department updated successfully' };
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteDepartment(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteDepartment(id, tenant);
  }

  // ─── 3. SUBJECTS ───────────────────────────────────────────────────────────
  @Get('subjects')
  @ApiOperation({ summary: 'List Subjects — tenant read' })
  async listSubjects(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listSubjects(tenant);
    return { success: true, data };
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create Subject' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createSubject(@Body() dto: CreateSubjectMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createSubject(dto, tenant);
    return { success: true, data, message: 'Subject created successfully' };
  }

  @Put('subjects/:id')
  @ApiOperation({ summary: 'Update Subject' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateSubject(id, dto, tenant);
    return { success: true, data, message: 'Subject updated successfully' };
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Delete Subject' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteSubject(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteSubject(id, tenant);
  }

  // ─── 4. TOPICS ─────────────────────────────────────────────────────────────
  @Get('topics')
  @ApiOperation({ summary: 'List Topics — tenant read' })
  async listTopics(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listTopics(tenant);
    return { success: true, data };
  }

  @Post('topics')
  @ApiOperation({ summary: 'Create Topic' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createTopic(@Body() dto: CreateTopicMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createTopic(dto, tenant);
    return { success: true, data, message: 'Topic created successfully' };
  }

  @Put('topics/:id')
  @ApiOperation({ summary: 'Update Topic' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateTopic(id, dto, tenant);
    return { success: true, data, message: 'Topic updated successfully' };
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete Topic' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteTopic(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteTopic(id, tenant);
  }

  // ─── 5. COMPETENCIES ───────────────────────────────────────────────────────
  @Get('competencies')
  @ApiOperation({ summary: 'List Competencies — tenant read' })
  async listCompetencies(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listCompetencies(tenant);
    return { success: true, data };
  }

  @Post('competencies')
  @ApiOperation({ summary: 'Create Competency' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createCompetency(@Body() dto: CreateCompetencyMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createCompetency(dto, tenant);
    return { success: true, data, message: 'Competency created successfully' };
  }

  @Put('competencies/:id')
  @ApiOperation({ summary: 'Update Competency' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateCompetency(@Param('id') id: string, @Body() dto: UpdateCompetencyMasterDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateCompetency(id, dto, tenant);
    return { success: true, data, message: 'Competency updated successfully' };
  }

  @Delete('competencies/:id')
  @ApiOperation({ summary: 'Delete Competency' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteCompetency(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteCompetency(id, tenant);
  }

  // ─── 6. DELIVERY TYPES ─────────────────────────────────────────────────────
  @Get('delivery-types')
  @ApiOperation({ summary: 'List Delivery Types — tenant read' })
  async listDeliveryTypes(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listDeliveryTypes(tenant);
    return { success: true, data };
  }

  @Post('delivery-types')
  @ApiOperation({ summary: 'Create Delivery Type' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createDeliveryType(@Body() dto: CreateDeliveryTypeDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createDeliveryType(dto, tenant);
    return { success: true, data, message: 'Delivery type created successfully' };
  }

  @Put('delivery-types/:id')
  @ApiOperation({ summary: 'Update Delivery Type' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateDeliveryType(@Param('id') id: string, @Body() dto: UpdateDeliveryTypeDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateDeliveryType(id, dto, tenant);
    return { success: true, data, message: 'Delivery type updated successfully' };
  }

  @Delete('delivery-types/:id')
  @ApiOperation({ summary: 'Delete Delivery Type' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteDeliveryType(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteDeliveryType(id, tenant);
  }

  // ─── 7. SUBJECT OFFERINGS ──────────────────────────────────────────────────
  @Get('subject-offerings')
  @ApiOperation({ summary: 'List Subject Offerings — tenant read' })
  async listSubjectOfferings(@Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.listSubjectOfferings(tenant);
    return { success: true, data };
  }

  @Post('subject-offerings')
  @ApiOperation({ summary: 'Create Subject Offering' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createSubjectOffering(@Body() dto: CreateSubjectOfferingDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.createSubjectOffering(dto, tenant);
    return { success: true, data, message: 'Subject offering created successfully' };
  }

  @Put('subject-offerings/:id')
  @ApiOperation({ summary: 'Update Subject Offering' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateSubjectOffering(@Param('id') id: string, @Body() dto: UpdateSubjectOfferingDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateSubjectOffering(id, dto, tenant);
    return { success: true, data, message: 'Subject offering updated successfully' };
  }

  @Delete('subject-offerings/:id')
  @ApiOperation({ summary: 'Delete Subject Offering' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteSubjectOffering(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.deleteSubjectOffering(id, tenant);
  }

  // ─── 8. FACULTY SUBJECT LINKER ─────────────────────────────────────────────
  @Get('faculty-subjects')
  @ApiOperation({ summary: 'List Faculty-Subject Links — tenant read' })
  async listFacultySubjects(
    @Query('facultyId') facultyId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('tenant') tenant?: string,
  ) {
    const data = await this.adminMasterService.listFacultySubjects({ facultyId, subjectId, departmentId }, tenant);
    return { success: true, data };
  }

  @Post('faculty-subjects')
  @ApiOperation({ summary: 'Link Faculty to Subject' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async linkFacultySubject(@Body() dto: LinkFacultySubjectDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.linkFacultySubject(dto, tenant);
    return { success: true, data, message: 'Faculty linked to subject successfully' };
  }

  @Put('faculty-subjects/:id')
  @ApiOperation({ summary: 'Update Faculty Subject Link' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateFacultySubject(@Param('id') id: string, @Body() dto: LinkFacultySubjectDto, @Query('tenant') tenant?: string) {
    const data = await this.adminMasterService.updateFacultySubject(id, dto, tenant);
    return { success: true, data, message: 'Faculty subject link updated successfully' };
  }

  @Delete('faculty-subjects/:id')
  @ApiOperation({ summary: 'Unlink Faculty from Subject' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async unlinkFacultySubject(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.adminMasterService.unlinkFacultySubject(id, tenant);
  }
}
