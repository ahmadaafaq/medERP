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

  // ─── 2. COURSES ───────────────────────────────────────────────────────────
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

