import {
  Controller, Get, Post, Put, Patch, Delete, Body,
  Param, Query, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateStudentDto, CreateFacultyDto, BulkCreateStudentsDto,
  UpdateStudentDto, UpdateFacultyDto, GetStudentsQueryDto, GetFacultyQueryDto,
} from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Students ────────────────────────────────────────────────
  @Get('students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'List students with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  getStudents(
    @TenantSlug() tenantSlug: string,
    @Query() query: GetStudentsQueryDto,
  ) {
    return this.usersService.getStudents(tenantSlug, query, {
      search: query.search,
      batchId: query.batchId,
      departmentId: query.departmentId,
    });
  }

  @Get('students/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a student by ID' })
  getStudentById(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.getStudentById(tenantSlug, id);
  }

  @Post('students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new student account' })
  createStudent(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.createStudent(tenantSlug, dto, user.sub);
  }

  @Post('students/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk-create student accounts from array' })
  bulkCreateStudents(
    @TenantSlug() tenantSlug: string,
    @Body() dto: BulkCreateStudentsDto,
  ) {
    return this.usersService.bulkCreateStudents(tenantSlug, dto);
  }

  @Put('students/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'Update student profile' })
  updateStudent(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.usersService.updateStudent(tenantSlug, id, dto);
  }

  @Patch('students/:id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend or reactivate a student account' })
  toggleStudentActive(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.toggleStudentActive(tenantSlug, id);
  }

  // ─── Faculty / HOD / Clerk ────────────────────────────────────
  @Get('faculty')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'List all faculty/staff members' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'staffType', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  getFaculty(
    @TenantSlug() tenantSlug: string,
    @Query() query: GetFacultyQueryDto,
  ) {
    return this.usersService.getFaculty(tenantSlug, query, {
      search: query.search,
      departmentId: query.departmentId,
      role: query.role as UserRole,
      staffType: query.staffType,
      isActive: query.isActive,
    });
  }

  @Get('faculty/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Get faculty member by ID' })
  getFacultyById(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.getFacultyById(tenantSlug, id);
  }

  @Post('faculty')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create faculty, HOD, or clerk account' })
  createFaculty(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateFacultyDto,
  ) {
    return this.usersService.createFaculty(tenantSlug, dto);
  }

  @Put('faculty/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'Update faculty profile' })
  updateFaculty(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFacultyDto,
  ) {
    return this.usersService.updateFaculty(tenantSlug, id, dto);
  }

  @Delete('faculty/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete faculty profile' })
  deleteFaculty(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.deleteFaculty(tenantSlug, id);
  }

  // ─── Departments ───────────────────────────────────────────────
  @Get('departments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK, UserRole.STUDENT)
  @ApiOperation({ summary: 'List all departments' })
  getDepartments(@TenantSlug() tenantSlug: string) {
    return this.usersService.getDepartments(tenantSlug);
  }

  @Post('departments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  createDepartment(
    @TenantSlug() tenantSlug: string,
    @Body() data: { code: string; name: string; type: string },
  ) {
    return this.usersService.createDepartment(tenantSlug, data);
  }

  // ─── Batches ───────────────────────────────────────────────────
  @Get('batches')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK, UserRole.STUDENT)
  @ApiOperation({ summary: 'List all batches' })
  getBatches(
    @TenantSlug() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.usersService.getBatches(tenantSlug, departmentId);
  }

  @Post('batches')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new batch/year' })
  createBatch(
    @TenantSlug() tenantSlug: string,
    @Body() data: {
      code: string; year: number; courseCd: string;
      departmentId?: string; startDate?: string; endDate?: string;
    },
  ) {
    return this.usersService.createBatch(tenantSlug, data);
  }
}
