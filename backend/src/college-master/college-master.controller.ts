import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollegeMasterService } from './college-master.service';
import {
  CreateCollegeDto, UpdateCollegeDto,
  CreateCourseDto, UpdateCourseDto,
  CreateBatchDto, UpdateBatchDto,
  CreateBranchDto, UpdateBranchDto,
  CreateSessionDto, UpdateSessionDto,
  CreateProfessionalDto, UpdateProfessionalDto,
  CreateGroupDto, UpdateGroupDto,
} from './dto/college-master.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('College Master')
@ApiBearerAuth()
@Controller('college-master')
export class CollegeMasterController {
  constructor(private readonly collegeMasterService: CollegeMasterService) {}

  // ─── 1. COLLEGES ──────────────────────────────────────────────────────────
  @Get('colleges')
  @ApiOperation({ summary: 'List all Colleges (Tenants) — public' })
  async listColleges() {
    const data = await this.collegeMasterService.listColleges();
    return { success: true, data };
  }

  @Post('colleges/sync-external')
  @ApiOperation({ summary: 'Sync Colleges from SRMS ERP portal API' })
  async syncExternalCollegesPost() {
    const data = await this.collegeMasterService.syncExternalColleges();
    return { success: true, message: 'Colleges synced successfully from SRMS portal API', data };
  }

  @Get('colleges/sync-external')
  @ApiOperation({ summary: 'Sync Colleges from SRMS ERP portal API (GET trigger)' })
  async syncExternalCollegesGet() {
    const data = await this.collegeMasterService.syncExternalColleges();
    return { success: true, message: 'Colleges synced successfully from SRMS portal API', data };
  }

  @Post('colleges')
  @ApiOperation({ summary: 'Create new College' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createCollege(@Body() dto: CreateCollegeDto) {
    return this.collegeMasterService.createCollege(dto);
  }

  @Put('colleges/:id')
  @ApiOperation({ summary: 'Update College' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateCollege(@Param('id') id: string, @Body() dto: UpdateCollegeDto) {
    return this.collegeMasterService.updateCollege(id, dto);
  }

  @Delete('colleges/:id')
  @ApiOperation({ summary: 'Delete College' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteCollege(@Param('id') id: string) {
    return this.collegeMasterService.deleteCollege(id);
  }

  // ─── LIVE PORTAL PROXIES (No DB storage, 100% live API responses) ──────
  @Post('live/colleges')
  @Get('live/colleges')
  @ApiOperation({ summary: 'Fetch live colleges directly from SRMS Portal (POST {})' })
  async getLiveColleges() {
    const data = await this.collegeMasterService.fetchLiveColleges();
    return { success: true, data };
  }

  @Post('live/courses')
  @Get('live/courses')
  @ApiOperation({ summary: 'Fetch live courses directly from SRMS Portal (POST { colgcd })' })
  async getLiveCourses(@Body() body: any, @Query('colgcd') queryColgcd?: string) {
    const colgcd = body?.colgcd || body?.colg_cd || queryColgcd || '1';
    const data = await this.collegeMasterService.fetchLiveCourses(colgcd);
    return { success: true, data };
  }

  @Post('live/branches')
  @Get('live/branches')
  @ApiOperation({ summary: 'Fetch live branches directly from SRMS Portal (POST { colgcd, coursecd })' })
  async getLiveBranches(
    @Body() body: any,
    @Query('colgcd') queryColgcd?: string,
    @Query('coursecd') queryCoursecd?: string,
  ) {
    const colgcd = body?.colgcd || body?.colg_cd || queryColgcd || '1';
    const coursecd = body?.coursecd || body?.course_cd || queryCoursecd || '1';
    const data = await this.collegeMasterService.fetchLiveBranches(colgcd, coursecd);
    return { success: true, data };
  }

  @Post('live/batches')
  @Get('live/batches')
  @ApiOperation({ summary: 'Fetch live batches directly from SRMS Portal (POST { colgcd, coursecd })' })
  async getLiveBatches(
    @Body() body: any,
    @Query('colgcd') queryColgcd?: string,
    @Query('coursecd') queryCoursecd?: string,
  ) {
    const colgcd = body?.colgcd || body?.colg_cd || queryColgcd || '1';
    const coursecd = body?.coursecd || body?.course_cd || queryCoursecd || '1';
    const data = await this.collegeMasterService.fetchLiveBatches(colgcd, coursecd);
    return { success: true, data };
  }

  // ─── 2. COURSES ───────────────────────────────────────────────────────────
  @Post('courses/sync-external')
  @ApiOperation({ summary: 'Sync Courses sequentially from external SRMS Portal API' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async syncExternalCoursesPost(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.syncExternalCourses(tenant);
    return { success: true, message: 'Courses synced successfully from SRMS portal API', data };
  }

  @Get('courses/sync-external')
  @ApiOperation({ summary: 'Sync Courses sequentially from external SRMS Portal API (GET)' })
  async syncExternalCoursesGet(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.syncExternalCourses(tenant);
    return { success: true, message: 'Courses synced successfully from SRMS portal API', data };
  }

  @Get('courses')
  @ApiOperation({ summary: 'List Courses — public read' })
  async listCourses(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.listCourses(tenant);
    return { success: true, data };
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create Course' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createCourse(@Body() dto: CreateCourseDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.createCourse(dto, tenant);
  }

  @Put('courses/:id')
  @ApiOperation({ summary: 'Update Course' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.updateCourse(id, dto, tenant);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Delete Course' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteCourse(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.deleteCourse(id, tenant);
  }

  // ─── 3. BATCHES ───────────────────────────────────────────────────────────
  @Post('batches/sync-external')
  @ApiOperation({ summary: 'Sync Batches from external SRMS OnlineAttend GetBatch API' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async syncExternalBatchesPost(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
  ) {
    const data = await this.collegeMasterService.syncExternalBatches(tenant, coursecd);
    return { success: true, message: 'Batches synced successfully from SRMS GetBatch API to PostgreSQL', data };
  }

  @Get('batches/sync-external')
  @ApiOperation({ summary: 'Sync Batches from external SRMS OnlineAttend GetBatch API (GET trigger)' })
  async syncExternalBatchesGet(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
  ) {
    const data = await this.collegeMasterService.syncExternalBatches(tenant, coursecd);
    return { success: true, message: 'Batches synced successfully from SRMS GetBatch API to PostgreSQL', data };
  }

  @Get('batches')
  @ApiOperation({ summary: 'List Batches — public read' })
  async listBatches(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.listBatches(tenant);
    return { success: true, data };
  }

  @Post('batches')
  @ApiOperation({ summary: 'Create Batch' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createBatch(@Body() dto: CreateBatchDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.createBatch(dto, tenant);
  }

  @Put('batches/:id')
  @ApiOperation({ summary: 'Update Batch' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateBatch(@Param('id') id: string, @Body() dto: UpdateBatchDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.updateBatch(id, dto, tenant);
  }

  @Delete('batches/:id')
  @ApiOperation({ summary: 'Delete Batch' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteBatch(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.deleteBatch(id, tenant);
  }

  // ─── 4. BRANCHES ──────────────────────────────────────────────────────────
  @Post('branches/sync-external')
  @ApiOperation({ summary: 'Sync Branches/Departments from external SRMS GetBranch API' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async syncExternalBranchesPost(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
  ) {
    const data = await this.collegeMasterService.syncExternalBranches(tenant, coursecd);
    return { success: true, message: 'Departments & Branches synced successfully from SRMS GetBranch API to PostgreSQL', data };
  }

  @Get('branches/sync-external')
  @ApiOperation({ summary: 'Sync Branches/Departments from external SRMS GetBranch API (GET trigger)' })
  async syncExternalBranchesGet(
    @Query('tenant') tenant?: string,
    @Query('coursecd') coursecd?: string,
  ) {
    const data = await this.collegeMasterService.syncExternalBranches(tenant, coursecd);
    return { success: true, message: 'Departments & Branches synced successfully from SRMS GetBranch API to PostgreSQL', data };
  }

  @Get('branches')
  @ApiOperation({ summary: 'List Branches/Departments — public read' })
  async listBranches(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.listBranches(tenant);
    return { success: true, data };
  }

  @Post('branches')
  @ApiOperation({ summary: 'Create Branch/Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createBranch(@Body() dto: CreateBranchDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.createBranch(dto, tenant);
  }

  @Put('branches/:id')
  @ApiOperation({ summary: 'Update Branch/Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.updateBranch(id, dto, tenant);
  }

  @Delete('branches/:id')
  @ApiOperation({ summary: 'Delete Branch/Department' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteBranch(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.deleteBranch(id, tenant);
  }

  // ─── 5. ACADEMIC SESSIONS ─────────────────────────────────────────────────
  @Get('sessions')
  @ApiOperation({ summary: 'List Academic Sessions — public read' })
  async listSessions(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.listSessions(tenant);
    return { success: true, data };
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create Academic Session' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createSession(@Body() dto: CreateSessionDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.createSession(dto, tenant);
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Update Academic Session' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.updateSession(id, dto, tenant);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete Academic Session' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteSession(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.deleteSession(id, tenant);
  }

  // ─── 6. PROFESSIONAL PHASES ───────────────────────────────────────────────
  @Get('professionals')
  @ApiOperation({ summary: 'List Professional Phases — public read' })
  async listProfessionals(@Query('tenant') tenant?: string) {
    const data = await this.collegeMasterService.listProfessionals(tenant);
    return { success: true, data };
  }

  @Post('professionals')
  @ApiOperation({ summary: 'Create Professional Phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createProfessional(@Body() dto: CreateProfessionalDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.createProfessional(dto, tenant);
  }

  @Put('professionals/:id')
  @ApiOperation({ summary: 'Update Professional Phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateProfessional(@Param('id') id: string, @Body() dto: UpdateProfessionalDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.updateProfessional(id, dto, tenant);
  }

  @Delete('professionals/:id')
  @ApiOperation({ summary: 'Delete Professional Phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteProfessional(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.deleteProfessional(id, tenant);
  }

  // ─── 8. GROUPS MASTER ─────────────────────────────────────────────────────
  @Get('groups')
  @ApiOperation({ summary: 'List Student Batch Sub-Groups — public read' })
  async listGroups(
    @Query('tenant') tenant?: string,
    @Query('batchId') batchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const data = await this.collegeMasterService.listGroups(tenant, batchId, departmentId);
    return { success: true, data };
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create Student Batch Sub-Group' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createGroup(@Body() dto: CreateGroupDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.createGroup(dto, tenant);
  }

  @Put('groups/:id')
  @ApiOperation({ summary: 'Update Student Batch Sub-Group' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.updateGroup(id, dto, tenant);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete Student Batch Sub-Group' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteGroup(@Param('id') id: string, @Query('tenant') tenant?: string) {
    return this.collegeMasterService.deleteGroup(id, tenant);
  }
}

