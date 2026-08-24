import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentMasterService } from './student-master.service';
import { CreateStudentDto, UpdateStudentDto, BulkLinkProfessionalDto, BulkLinkGroupDto } from './dto/student-master.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Student Master')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('student-master')
export class StudentMasterController {
  constructor(private readonly studentMasterService: StudentMasterService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all students with filters' })
  async listStudents(
    @CurrentUser() user: JwtPayload,
    @Query('tenant') tenant?: string,
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
    const effectiveTenant = (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) ? user.tenantSlug : (tenant || 'srms-cet-bareilly');
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
  @Get('next-registration-no')
  @ApiOperation({ summary: 'Generate next sequential registration number' })
  async getNextRegistrationNo(
    @Query('tenant') tenant: string,
    @Query('sessionYear') sessionYear: string,
  ) {
    const registrationNo = await this.studentMasterService.generateNextRegistrationNo(tenant || 'srms', sessionYear);
    return { registrationNo };
  }

  @Post('bulk-link-phase')
  @ApiOperation({ summary: 'Bulk link and promote selected students to a professional phase' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async bulkLinkPhase(
    @Body() dto: BulkLinkProfessionalDto,
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.bulkLinkProfessional(tenant || 'srms', dto);
  }

  @Post('bulk-link-group')
  @ApiOperation({ summary: 'Bulk link and assign selected students to an academic group (Group A, B, C)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async bulkLinkGroup(
    @Body() dto: BulkLinkGroupDto,
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.bulkLinkGroup(tenant || 'srms', dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get student details by ID' })
  async getStudent(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.getStudent(tenant || 'srms', id);
  }

  @Post()
  @ApiOperation({ summary: 'Register/Create a new student' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createStudent(
    @Body() dto: CreateStudentDto,
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.createStudent(tenant || 'srms', dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a student profile' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateStudent(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.updateStudent(tenant || 'srms', id, dto);
  }

  @Public()
  @Post('sync-live')
  @ApiOperation({ summary: 'Sync live students from SRMS into tenant schema' })
  async syncLive(
    @Body('students') students: any[],
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.syncLiveStudents(tenant || 'srms-cet-bareilly', students || []);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student profile' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteStudent(
    @Param('id') id: string,
    @Query('tenant') tenant?: string,
  ) {
    return this.studentMasterService.deleteStudent(tenant || 'srms', id);
  }
}
