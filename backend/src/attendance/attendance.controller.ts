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
import { Public } from '../common/decorators/public.decorator';
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
    return this.attendanceService.createSession(
      tenantSlug,
      dto,
      user?.sub ?? null,
      user?.role ?? UserRole.ADMIN,
    );
  }

  // ─── Get User Scope (Department & Role Access) ────────────────────────────
  @Get('user-scope')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Get current user role and department access scope' })
  getUserScope(
    @TenantSlug() tenantSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.getUserScope(tenantSlug, user.sub, user.role);
  }

  // ─── Get Timetable Slots for Attendance Marking ────────────────────────────
  @Get('timetable-slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Get scheduled timetable slots for a date & batch with attendance status' })
  async getTimetableSlots(
    @TenantSlug() tenantSlug: string,
    @Query('batchId') batchId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('sessionDate') sessionDate?: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const res = await this.attendanceService.getTimetableSlotsForDate(
      tenantSlug,
      batchId,
      sessionDate,
      departmentId,
      user?.sub,
      user?.role,
      subjectId,
    );
    return { success: true, data: res.slots || [], date: res.date, dayOfWeek: res.dayOfWeek };
  }

  // ─── Find Active Session Records ───────────────────────────────────────────
  @Get('active-session')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Find existing attendance session and marked records for a subject, batch, date and type' })
  findActiveSession(
    @TenantSlug() tenantSlug: string,
    @Query('subjectId') subjectId: string,
    @Query('batchId') batchId: string,
    @Query('sessionDate') sessionDate: string,
    @Query('sessionType') sessionType?: string,
    @Query('timetableSlotId') timetableSlotId?: string,
  ) {
    return this.attendanceService.findExistingSessionWithRecords(
      tenantSlug, subjectId, batchId, sessionDate, sessionType || 'THEORY', timetableSlotId,
    );
  }

  // ─── Weekly Sessions & Conducted Lecture Counters ─────────────────────────
  @Get('weekly-sessions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Get weekly attendance sessions and lecture/practical conducted counts' })
  getWeeklySessions(
    @TenantSlug() tenantSlug: string,
    @Query('batchId') batchId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.attendanceService.getWeeklySessions(
      tenantSlug, batchId, fromDate, toDate, subjectId,
    );
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

  // ─── Student Day-to-Day Logs ───────────────────────────────────────────────
  @Get('students/:studentId/logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get detailed day-to-day attendance log ledger for a student' })
  getStudentLogs(
    @TenantSlug() tenantSlug: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('subjectId') subjectId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.attendanceService.getStudentAttendanceLogs(
      tenantSlug, studentId, { subjectId, fromDate, toDate, status },
    );
  }

  // ─── Batch Report ──────────────────────────────────────────────────────────
  @Get('batches/:batchId/report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Batch-wise attendance report with per-student % breakdown' })
  getBatchReport(
    @TenantSlug() tenantSlug: string,
    @Param('batchId') batchId: string,
    @Query('subjectId') subjectId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getBatchAttendanceReport(tenantSlug, batchId, subjectId, fromDate, toDate);
  }

  // ─── Batch Multi-Subject Matrix Report ─────────────────────────────────────
  @Get('batches/:batchId/matrix-report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.CLERK)
  @ApiOperation({ summary: 'Batch-wise multi-subject matrix attendance report (subject columns + cumulative %)' })
  getBatchMatrixReport(
    @TenantSlug() tenantSlug: string,
    @Param('batchId') batchId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getBatchMatrixReport(tenantSlug, batchId, fromDate, toDate);
  }

  // ─── SRMS Portal Proxy Routes ──────────────────────────────────────────────
  @Public()
  @Get('portal/semesters')
  @ApiOperation({ summary: 'Get Portal Semesters for Course, Branch, and Batch' })
  getPortalSemesters(
    @TenantSlug() tenantSlug: string,
    @Query('colgcd') colgcd?: string,
    @Query('coursecd') coursecd?: string,
    @Query('ddl_branch') ddl_branch?: string,
    @Query('ddl_batch') ddl_batch?: string,
  ) {
    return this.attendanceService.getPortalSemesters(tenantSlug, { colgcd, coursecd, ddl_branch, ddl_batch });
  }

  @Public()
  @Get('portal/subject-summary')
  @ApiOperation({ summary: 'Get Subject-wise attendance summary for a student' })
  getPortalSubjectSummary(
    @TenantSlug() tenantSlug: string,
    @Query() query: any,
  ) {
    return this.attendanceService.getPortalSubjectSummary(tenantSlug, query);
  }

  @Public()
  @Get('portal/lecture-details')
  @ApiOperation({ summary: 'Get Lecture-by-lecture attendance details for a student and subject' })
  getPortalLectureDetails(
    @TenantSlug() tenantSlug: string,
    @Query() query: any,
  ) {
    return this.attendanceService.getPortalLectureDetails(tenantSlug, query);
  }

  @Public()
  @Get('portal/section-matrix')
  @ApiOperation({ summary: 'Get Section-wise multi-subject attendance matrix for full student batch roster' })
  getSectionAttendanceMatrix(
    @TenantSlug() tenantSlug: string,
    @Query() query: any,
  ) {
    return this.attendanceService.getSectionAttendanceMatrix(tenantSlug, query);
  }
}
