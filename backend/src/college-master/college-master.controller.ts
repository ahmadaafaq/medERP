import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollegeMasterService, SRMS_FIRM_LOCATIONS } from './college-master.service';
import {
  CreateCollegeDto, UpdateCollegeDto,
  CreateCourseDto, UpdateCourseDto,
  CreateBatchDto, UpdateBatchDto,
  CreateBranchDto, UpdateBranchDto,
  CreateSessionDto, UpdateSessionDto,
  CreateProfessionalDto, UpdateProfessionalDto,
  CreateGroupDto, UpdateGroupDto,
  CreateResidencyDto, UpdateResidencyDto,
} from './dto/college-master.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('College Master')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('college-master')
export class CollegeMasterController {
  constructor(private readonly collegeMasterService: CollegeMasterService) {}

  // ─── 1. COLLEGES ──────────────────────────────────────────────────────────
  @Public()
  @Get('colleges')
  @ApiOperation({ summary: 'List Colleges (Tenants) — public or user-scoped' })
  async listColleges(@CurrentUser() user?: JwtPayload) {
    const data = await this.collegeMasterService.listColleges(user);
    return { success: true, data };
  }

  @Post('colleges/sync-external')
  @ApiOperation({ summary: 'Sync Colleges from SRMS ERP portal API' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async syncExternalCollegesPost() {
    const data = await this.collegeMasterService.syncExternalColleges();
    return { success: true, message: 'Colleges synced successfully from SRMS portal API', data };
  }

  @Public()
  @Get('colleges/sync-external')
  @ApiOperation({ summary: 'Sync Colleges from SRMS ERP portal API (GET trigger)' })
  async syncExternalCollegesGet() {
    const data = await this.collegeMasterService.syncExternalColleges();
    return { success: true, message: 'Colleges synced successfully from SRMS portal API', data };
  }

  @Public()
  @Post('colleges')
  @ApiOperation({ summary: 'Create new College' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createCollege(@Body() dto: CreateCollegeDto) {
    return this.collegeMasterService.createCollege(dto);
  }

  @Public()
  @Put('colleges/:id')
  @ApiOperation({ summary: 'Update College' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateCollege(@Param('id') id: string, @Body() dto: UpdateCollegeDto) {
    return this.collegeMasterService.updateCollege(id, dto);
  }

  @Public()
  @Delete('colleges/:id')
  @ApiOperation({ summary: 'Delete College (Soft Delete)' })
  @Roles(UserRole.SUPER_ADMIN)
  async deleteCollege(@Param('id') id: string) {
    return this.collegeMasterService.deleteCollege(id);
  }

  // Live Portal Proxy Endpoints
  @Public()
  @Post('proxy/colleges')
  @ApiOperation({ summary: 'Fetch live colleges from SRMS ERP API' })
  async proxyGetCollege() {
    const data = await this.collegeMasterService.fetchLiveColleges();
    return { success: true, data };
  }

  @Public()
  @Post('proxy/courses')
  @ApiOperation({ summary: 'Fetch live courses from SRMS ERP API' })
  async proxyGetCourse(@Body('colgcd') colgcd: string) {
    const data = await this.collegeMasterService.fetchLiveCourses(colgcd);
    return { success: true, data };
  }

  @Public()
  @Post('proxy/branches')
  @ApiOperation({ summary: 'Fetch live branches from SRMS ERP API' })
  async proxyGetBranch(
    @Body('colgcd') colgcd: string,
    @Body('coursecd') coursecd: string,
  ) {
    const data = await this.collegeMasterService.fetchLiveBranches(colgcd, coursecd);
    return { success: true, data };
  }

  @Public()
  @Post('proxy/batches')
  @ApiOperation({ summary: 'Fetch live batches from SRMS OnlineAttend GetBatch API' })
  async proxyGetBatch(
    @Body('colgcd') colgcd: string,
    @Body('coursecd') coursecd: string,
  ) {
    const data = await this.collegeMasterService.fetchLiveBatches(colgcd, coursecd);
    return { success: true, data };
  }

  @Public()
  @Post('proxy/all-subjects')
  @ApiOperation({ summary: 'Fetch live subjects from SRMS AdminAttendance GetAllSubjectDetail API' })
  async proxyGetAllSubjects(
    @Body('colgcd') colgcd: string,
    @Body('coursecd') coursecd: string,
    @Body('branchcd') branchcd: string,
    @Body('batchcd') batchcd: string,
    @Body('semcd') semcd: string,
  ) {
    const data = await this.collegeMasterService.fetchLiveSubjects(colgcd, coursecd, branchcd, batchcd, semcd);
    return { success: true, data };
  }

  @Public()
  @Post('proxy/subjects')
  @ApiOperation({ summary: 'Fetch live subjects alias' })
  async proxyGetSubjectsAlias(
    @Body('colgcd') colgcd: string,
    @Body('coursecd') coursecd: string,
    @Body('branchcd') branchcd: string,
    @Body('batchcd') batchcd: string,
    @Body('semcd') semcd: string,
  ) {
    const data = await this.collegeMasterService.fetchLiveSubjects(colgcd, coursecd, branchcd, batchcd, semcd);
    return { success: true, data };
  }

  @Public()
  @Get('firm-locations')
  @ApiOperation({ summary: 'Get list of configured SRMS Firm Locations and mapping' })
  async getFirmLocations() {
    return { success: true, data: SRMS_FIRM_LOCATIONS };
  }

  @Public()
  @Post('proxy/employees')
  @ApiOperation({ summary: 'Fetch live employee profiles from SRMS HR GETEMPPROFILEDTL API' })
  async proxyGetEmployees(@Body('locid') locid: string) {
    const data = await this.collegeMasterService.fetchLiveEmployees(locid || '7');
    return { success: true, count: data.length, data };
  }

  @Public()
  @Get('proxy/employees')
  @ApiOperation({ summary: 'Fetch live employee profiles from SRMS HR GETEMPPROFILEDTL API (GET)' })
  async proxyGetEmployeesGet(@Query('locid') locid: string) {
    const data = await this.collegeMasterService.fetchLiveEmployees(locid || '7');
    return { success: true, count: data.length, data };
  }

  @Public()
  @Post('employees/sync-external')
  @ApiOperation({ summary: 'Sync Employees / Faculty from SRMS HR API into database' })
  async syncExternalEmployeesPost(
    @Body('locid') bodyLocid?: string,
    @Body('tenant') bodyTenant?: string,
    @Query('locid') queryLocid?: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const target = bodyLocid || queryLocid || bodyTenant || queryTenant || '7';
    const data = await this.collegeMasterService.syncExternalEmployees(target);
    return {
      success: true,
      message: `Synced ${data.length} staff members successfully from SRMS HR API into PostgreSQL (Default password: '12345678')`,
      count: data.length,
      data,
    };
  }

  @Public()
  @Get('employees/sync-external')
  @ApiOperation({ summary: 'Sync Employees / Faculty from SRMS HR API into database (GET)' })
  async syncExternalEmployeesGet(
    @Query('locid') locid?: string,
    @Query('tenant') tenant?: string,
  ) {
    const target = locid || tenant || '7';
    const data = await this.collegeMasterService.syncExternalEmployees(target);
    return {
      success: true,
      message: `Synced ${data.length} staff members successfully from SRMS HR API into PostgreSQL (Default password: '12345678')`,
      count: data.length,
      data,
    };
  }

  // ─── 2. COURSES ───────────────────────────────────────────────────────────
  @Public()
  @Post('courses/sync-external')
  @ApiOperation({ summary: 'Sync Courses sequentially from external SRMS Portal API' })
  async syncExternalCoursesPost(
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.syncExternalCourses(effectiveTenant);
    return { success: true, message: 'Courses synced successfully from SRMS portal API', data };
  }

  @Public()
  @Get('courses/sync-external')
  @ApiOperation({ summary: 'Sync Courses sequentially from external SRMS Portal API (GET)' })
  async syncExternalCoursesGet(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.syncExternalCourses(tenant);
    return { success: true, message: 'Courses synced successfully from SRMS portal API', data };
  }

  @Public()
  @Get('courses')
  @ApiOperation({ summary: 'List Courses — tenant-scoped' })
  async listCourses(
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listCourses(effectiveTenant, user);
    return { success: true, data };
  }

  @Public()
  @Post('courses')
  @ApiOperation({ summary: 'Create Course' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createCourse(
    @Body() dto: CreateCourseDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createCourse(dto, effectiveTenant);
  }

  @Public()
  @Put('courses/:id')
  @ApiOperation({ summary: 'Update Course' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateCourse(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('courses/:id')
  @ApiOperation({ summary: 'Delete Course' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteCourse(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteCourse(id, effectiveTenant);
  }

  // ─── 3. BATCHES ───────────────────────────────────────────────────────────
  @Public()
  @Post('batches/sync-external')
  @ApiOperation({ summary: 'Sync Batches from external SRMS OnlineAttend GetBatch API' })
  async syncExternalBatchesPost(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.syncExternalBatches(effectiveTenant, coursecd);
    return { success: true, message: 'Batches synced successfully from SRMS GetBatch API to PostgreSQL', data };
  }

  @Public()
  @Get('batches/sync-external')
  @ApiOperation({ summary: 'Sync Batches from external SRMS OnlineAttend GetBatch API (GET trigger)' })
  async syncExternalBatchesGet(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
  ) {
    const data = await this.collegeMasterService.syncExternalBatches(tenant, coursecd);
    return { success: true, message: 'Batches synced successfully from SRMS GetBatch API to PostgreSQL', data };
  }

  @Public()
  @Get('batches')
  @ApiOperation({ summary: 'List Batches — tenant-scoped' })
  async listBatches(
    @Query('tenant') tenant?: string,
    @Query('course_cd') courseCd?: string,
    @Query('courseId') courseId?: string,
    @Query('coursecd') coursecd?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const targetCourse = courseCd || courseId || coursecd;
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listBatches(effectiveTenant, targetCourse, user);
    return { success: true, data };
  }

  @Public()
  @Post('batches')
  @ApiOperation({ summary: 'Create Batch' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createBatch(
    @Body() dto: CreateBatchDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createBatch(dto, effectiveTenant);
  }

  @Public()
  @Put('batches/:id')
  @ApiOperation({ summary: 'Update Batch' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateBatch(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateBatch(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('batches/:id')
  @ApiOperation({ summary: 'Delete Batch' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteBatch(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteBatch(id, effectiveTenant);
  }

  // ─── 4. BRANCHES ──────────────────────────────────────────────────────────
  @Public()
  @Post('branches/sync-external')
  @ApiOperation({ summary: 'Sync Branches/Departments from external SRMS GetBranch API' })
  async syncExternalBranchesPost(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.syncExternalBranches(effectiveTenant, coursecd);
    return { success: true, message: 'Departments & Branches synced successfully from SRMS GetBranch API to PostgreSQL', data };
  }

  @Public()
  @Get('branches/sync-external')
  @ApiOperation({ summary: 'Sync Branches/Departments from external SRMS GetBranch API (GET trigger)' })
  async syncExternalBranchesGet(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
  ) {
    const data = await this.collegeMasterService.syncExternalBranches(tenant, coursecd);
    return { success: true, message: 'Departments & Branches synced successfully from SRMS GetBranch API to PostgreSQL', data };
  }

  @Public()
  @Get('branches')
  @ApiOperation({ summary: 'List Branches/Departments — tenant-scoped' })
  async listBranches(
    @Query('tenant') tenant?: string,
    @Query('course_cd') courseCd?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listBranches(effectiveTenant, courseCd, user);
    return { success: true, data };
  }

  @Public()
  @Post('branches')
  @ApiOperation({ summary: 'Create Branch/Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createBranch(
    @Body() dto: CreateBranchDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createBranch(dto, effectiveTenant);
  }

  @Public()
  @Put('branches/:id')
  @ApiOperation({ summary: 'Update Branch/Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateBranch(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('branches/:id')
  @ApiOperation({ summary: 'Delete Branch/Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteBranch(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteBranch(id, effectiveTenant);
  }

  // ─── 5. ACADEMIC SESSIONS ──────────────────────────────────────────────────
  @Public()
  @Post('sessions/sync-external')
  @ApiOperation({ summary: 'Sync Academic Sessions from external SRMS GetSession API' })
  async syncExternalSessionsPost(
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.syncExternalSessions(effectiveTenant);
    return { success: true, message: 'Academic Sessions synced successfully from SRMS GetSession API to PostgreSQL', data };
  }

  @Public()
  @Get('sessions/sync-external')
  @ApiOperation({ summary: 'Sync Academic Sessions from external SRMS GetSession API (GET trigger)' })
  async syncExternalSessionsGet(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.syncExternalSessions(tenant);
    return { success: true, message: 'Academic Sessions synced successfully from SRMS GetSession API to PostgreSQL', data };
  }

  @Public()
  @Get('sessions')
  @ApiOperation({ summary: 'List Academic Sessions — tenant-scoped' })
  async listSessions(
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listSessions(effectiveTenant, user);
    return { success: true, data };
  }

  @Public()
  @Post('sessions')
  @ApiOperation({ summary: 'Create Academic Session' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createSession(
    @Body() dto: CreateSessionDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createSession(dto, effectiveTenant);
  }

  @Public()
  @Put('sessions/:id')
  @ApiOperation({ summary: 'Update Academic Session' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateSession(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete Academic Session' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteSession(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteSession(id, effectiveTenant);
  }

  // ─── 6. PROFESSIONAL PHASES ───────────────────────────────────────────────
  @Public()
  @Get('professionals')
  @ApiOperation({ summary: 'List Professional Phases — tenant-scoped' })
  async listProfessionals(
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listProfessionals(effectiveTenant, user);
    return { success: true, data };
  }

  @Public()
  @Post('professionals')
  @ApiOperation({ summary: 'Create Professional Phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createProfessional(
    @Body() dto: CreateProfessionalDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createProfessional(dto, effectiveTenant);
  }

  @Public()
  @Put('professionals/:id')
  @ApiOperation({ summary: 'Update Professional Phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateProfessional(
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateProfessional(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('professionals/:id')
  @ApiOperation({ summary: 'Delete Professional Phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteProfessional(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteProfessional(id, effectiveTenant);
  }

  // ─── 8. GROUPS MASTER ─────────────────────────────────────────────────────
  @Public()
  @Get('groups')
  @ApiOperation({ summary: 'List Student Batch Sub-Groups — tenant-scoped' })
  async listGroups(
    @Query('tenant') tenant?: string,
    @Query('batchId') batchId?: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listGroups(effectiveTenant, batchId, departmentId, user);
    return { success: true, data };
  }

  @Public()
  @Post('groups')
  @ApiOperation({ summary: 'Create Student Batch Sub-Group' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createGroup(
    @Body() dto: CreateGroupDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createGroup(dto, effectiveTenant);
  }

  @Public()
  @Put('groups/:id')
  @ApiOperation({ summary: 'Update Student Batch Sub-Group' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateGroup(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete Student Batch Sub-Group' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteGroup(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteGroup(id, effectiveTenant);
  }

  // ─── 9. RESIDENCIES MASTER ────────────────────────────────────────────────
  @Public()
  @Get('residencies')
  @ApiOperation({ summary: 'List Residency Categories — tenant-scoped' })
  async listResidencies(
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    const data = await this.collegeMasterService.listResidencies(effectiveTenant, user);
    return { success: true, data };
  }

  @Public()
  @Post('residencies')
  @ApiOperation({ summary: 'Create Residency Category' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createResidency(
    @Body() dto: CreateResidencyDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.createResidency(dto, effectiveTenant);
  }

  @Public()
  @Put('residencies/:id')
  @ApiOperation({ summary: 'Update Residency Category' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateResidency(
    @Param('id') id: string,
    @Body() dto: UpdateResidencyDto,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.updateResidency(id, dto, effectiveTenant);
  }

  @Public()
  @Delete('residencies/:id')
  @ApiOperation({ summary: 'Delete Residency Category' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteResidency(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenant;
    return this.collegeMasterService.deleteResidency(id, effectiveTenant);
  }
}
