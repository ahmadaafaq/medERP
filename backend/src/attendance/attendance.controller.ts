import {
  Controller, Get, Post, Put, Patch, Body,
  Param, Query, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateSessionDto, UpdateRecordDto, AttendanceQueryDto } from './dto/attendance.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Mark Attendance (CLERK / FACULTY / HOD) ──────────────────────────────
  @Post('sessions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({
    summary: 'Create attendance session and mark student records in one call',
    description: 'CLERK role: can mark attendance for any subject/batch. FACULTY: can mark for assigned subjects.',
  })
  createSession(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.createSession(tenantSlug, dto, user.sub, user.role);
  }

  // ─── List Sessions ─────────────────────────────────────────────────────────
  @Get('sessions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'List attendance sessions with filters' })
  getSessions(
    @TenantSlug() tenantSlug: string,
    @Query() pagination: PaginationDto,
    @Query() filters: AttendanceQueryDto,
  ) {
    return this.attendanceService.getSessions(tenantSlug, pagination, filters);
  }

  // ─── Session Detail ────────────────────────────────────────────────────────
  @Get('sessions/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Get session details with all student records' })
  getSessionDetail(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attendanceService.getSessionDetail(tenantSlug, id);
  }

  // ─── Update Individual Record ──────────────────────────────────────────────
  @Patch('records/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Update an individual attendance record (correct a mistake)' })
  updateRecord(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.updateRecord(tenantSlug, id, dto, user.sub, user.role);
  }

  // ─── Cancel Session ────────────────────────────────────────────────────────
  @Patch('sessions/:id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'Cancel a session (records are preserved but flagged)' })
  cancelSession(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.cancelSession(tenantSlug, id, user.sub);
  }

  // ─── Student Summary ───────────────────────────────────────────────────────
  @Get('students/:studentId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attendance summary for a student (per subject + overall %)' })
  getStudentSummary(
    @TenantSlug() tenantSlug: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('subjectId') subjectId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(
      tenantSlug, studentId, { subjectId, fromDate, toDate },
    );
  }

  // ─── Batch Report ──────────────────────────────────────────────────────────
  @Get('batches/:batchId/report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Batch-wise attendance report with per-student % breakdown' })
  getBatchReport(
    @TenantSlug() tenantSlug: string,
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.attendanceService.getBatchAttendanceReport(tenantSlug, batchId, subjectId);
  }
}
