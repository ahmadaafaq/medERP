import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentMasterService } from './student-master.service';
import {
  CreateStudentDto, UpdateStudentDto, BulkLinkProfessionalDto, BulkLinkGroupDto, BulkCreateStudentsDto,
} from './dto/student-master.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

import { Public } from '../common/decorators/public.decorator';

@ApiTags('Student Master')
@ApiBearerAuth()
@Public()
@UseGuards(RolesGuard)
@Controller('student-master')
export class StudentMasterController {
  constructor(private readonly studentMasterService: StudentMasterService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all students with filters' })
  async listStudents(
    @CurrentUser() user: JwtPayload,
    @TenantSlug() tenantSlug: string,
    @Query('search') search?: string,
    @Query('collegeId') collegeId?: string,
    @Query('courseId') courseId?: string,
    @Query('batchId') batchId?: string,
    @Query('branchId') branchId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('residencyType') residencyType?: string,
    @Query('professionalPhase') professionalPhase?: string,
    @Query('groupId') groupId?: string,
    @Query('linkedOnly') linkedOnly?: string,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenantSlug;
    const effectiveCollegeId = (user && user.role !== UserRole.SUPER_ADMIN && user.colgCd) ? user.colgCd : collegeId;
    return this.studentMasterService.listStudents(effectiveTenant, {
      search,
      collegeId: effectiveCollegeId,
      courseId,
      batchId,
      branchId,
      sessionId,
      residencyType,
      professionalPhase,
      groupId,
      linkedOnly,
    }, user);
  }

  @Public()
  @Get('hustle-board')
  @ApiOperation({ summary: 'Get authentic college-wide topper & hustle board merit rankings' })
  async getHustleBoard(
    @CurrentUser() user: JwtPayload,
    @TenantSlug() tenantSlug: string,
    @Query('filterMode') filterMode?: string,
    @Query('departmentId') departmentId?: string,
    @Query('limit') limit?: number,
  ) {
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : tenantSlug;
    return this.studentMasterService.getHustleBoard(effectiveTenant, {
      filterMode,
      departmentId,
      limit,
    });
  }

  @Get('next-registration-no')
  @ApiOperation({ summary: 'Generate next sequential registration number' })
  async getNextRegistrationNo(
    @TenantSlug() tenantSlug: string,
    @Query('sessionYear') sessionYear: string,
  ) {
    const registrationNo = await this.studentMasterService.generateNextRegistrationNo(tenantSlug, sessionYear);
    return { registrationNo };
  }

  @Post('bulk-link-phase')
  @ApiOperation({ summary: 'Bulk link and promote selected students to a professional phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async bulkLinkPhase(
    @TenantSlug() tenantSlug: string,
    @Body() dto: BulkLinkProfessionalDto,
  ) {
    return this.studentMasterService.bulkLinkProfessional(tenantSlug, dto);
  }

  @Post('bulk-link-group')
  @ApiOperation({ summary: 'Bulk link and assign selected students to an academic group (Group A, B, C)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async bulkLinkGroup(
    @TenantSlug() tenantSlug: string,
    @Body() dto: BulkLinkGroupDto,
  ) {
    return this.studentMasterService.bulkLinkGroup(tenantSlug, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student details by ID' })
  async getStudent(
    @TenantSlug() tenantSlug: string,
    @Param('id') id: string,
  ) {
    return this.studentMasterService.getStudent(tenantSlug, id);
  }

  @Post()
  @ApiOperation({ summary: 'Register/Create a new student' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createStudent(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentMasterService.createStudent(tenantSlug, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a student profile' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateStudent(
    @TenantSlug() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentMasterService.updateStudent(tenantSlug, id, dto);
  }

  @Post('sync-live')
  @ApiOperation({ summary: 'Sync live students from SRMS into tenant schema' })
  async syncLive(
    @TenantSlug() tenantSlug: string,
    @Body('students') students: any[],
  ) {
    return this.studentMasterService.syncLiveStudents(tenantSlug, students || []);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create/import student records from Excel/CSV' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async bulkCreateStudents(
    @TenantSlug() tenantSlug: string,
    @Body() dto: BulkCreateStudentsDto,
  ) {
    return this.studentMasterService.bulkCreateStudents(tenantSlug, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student profile' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteStudent(
    @TenantSlug() tenantSlug: string,
    @Param('id') id: string,
  ) {
    return this.studentMasterService.deleteStudent(tenantSlug, id);
  }
}
