import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LogbookService } from './logbook.service';
import {
  CreateLogbookCategoryDto,
  CreateLogbookTopicDto,
  UpdateLogbookTopicDto,
  CreateLogbookSubmissionDto,
  EvaluateLogbookSubmissionDto,
  CreateLogbookEntryDto,
  VerifyLogbookEntryDto,
} from './dto/logbook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Logbook')
@ApiBearerAuth()
@Controller('logbook')
@UseGuards(JwtAuthGuard)
export class LogbookController {
  constructor(private readonly logbookService: LogbookService) {}

  // ==========================================
  // 1. CATEGORIES
  // ==========================================
  @Get('categories')
  @ApiOperation({ summary: 'Get manageable logbook categories' })
  async getCategories(
    @Tenant() tenantSlug: string,
    @Query('courseId') courseId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.logbookService.getCategories(tenantSlug, { courseId, departmentId });
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new logbook category' })
  async createCategory(@Tenant() tenantSlug: string, @Body() dto: CreateLogbookCategoryDto) {
    return this.logbookService.createCategory(tenantSlug, dto);
  }

  // ==========================================
  // 2. TOPICS (Faculty publish, Student discover)
  // ==========================================
  @Post('topics')
  @ApiOperation({ summary: 'Faculty publish new academic logbook activity topic' })
  async createTopic(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateLogbookTopicDto,
  ) {
    const facultyId = user.profile?.id || user.userId || user.id;
    return this.logbookService.createTopic(tenantSlug, facultyId, dto);
  }

  @Get('topics')
  @ApiOperation({ summary: 'List activity topics with filters' })
  async getTopics(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('facultyId') facultyId?: string,
    @Query('courseId') courseId?: string,
    @Query('branchId') branchId?: string,
    @Query('batchId') batchId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('studentView') studentView?: string,
  ) {
    const studentId = studentView === 'true' || user?.role === 'STUDENT'
      ? (user?.profile?.id || user?.userId)
      : undefined;

    return this.logbookService.getTopics(tenantSlug, {
      facultyId,
      courseId,
      branchId,
      batchId,
      semesterId,
      categoryId,
      search,
      studentId,
    });
  }

  @Get('topics/:id')
  @ApiOperation({ summary: 'Get topic details' })
  async getTopicById(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.getTopicById(tenantSlug, id);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update an existing topic' })
  async updateTopic(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateLogbookTopicDto,
  ) {
    return this.logbookService.updateTopic(tenantSlug, id, dto);
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete a topic' })
  async deleteTopic(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.deleteTopic(tenantSlug, id);
  }

  // ==========================================
  // 3. SUBMISSIONS & EVALUATION
  // ==========================================
  @Post('submissions')
  @ApiOperation({ summary: 'Student submit work for a logbook topic' })
  async createSubmission(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateLogbookSubmissionDto,
  ) {
    const studentId = dto.studentId || user.profile?.id || user.userId;
    return this.logbookService.createSubmission(tenantSlug, studentId, dto);
  }

  @Get('submissions/me')
  @ApiOperation({ summary: 'Student view own logbook submissions and evaluation remarks' })
  async getMySubmissions(@Tenant() tenantSlug: string, @CurrentUser() user: any) {
    const studentId = user.profile?.id || user.userId;
    return this.logbookService.getMySubmissions(tenantSlug, studentId);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Faculty view student submissions by topic and status' })
  async getSubmissions(
    @Tenant() tenantSlug: string,
    @Query('topicId') topicId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.logbookService.getSubmissions(tenantSlug, { topicId, status, search });
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'View single submission details with file & evaluation' })
  async getSubmissionById(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.getSubmissionById(tenantSlug, id);
  }

  @Post('submissions/:id/evaluate')
  @ApiOperation({ summary: 'Faculty evaluate submission with marks & remarks' })
  async evaluateSubmission(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: EvaluateLogbookSubmissionDto,
  ) {
    const facultyId = user.profile?.id || user.userId;
    return this.logbookService.evaluateSubmission(tenantSlug, id, facultyId, dto);
  }

  // ==========================================
  // 4. LEADERBOARD & NOTIFICATIONS
  // ==========================================
  @Get('leaderboard')
  @ApiOperation({ summary: 'Admin & Faculty logbook top performer leaderboard' })
  async getLeaderboard(
    @Tenant() tenantSlug: string,
    @Query('categoryId') categoryId?: string,
    @Query('courseId') courseId?: string,
    @Query('branchId') branchId?: string,
    @Query('batchId') batchId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.logbookService.getLeaderboard(tenantSlug, {
      categoryId,
      courseId,
      branchId,
      batchId,
      semesterId,
      limit,
    });
  }

  @Get('notifications/me')
  @ApiOperation({ summary: 'Get current user logbook notifications' })
  async getNotifications(@Tenant() tenantSlug: string, @CurrentUser() user: any) {
    const userId = user.profile?.id || user.userId || user.id;
    return this.logbookService.getNotifications(tenantSlug, userId);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markNotificationRead(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.markNotificationRead(tenantSlug, id);
  }

  // ==========================================
  // 5. LEGACY BACKWARDS-COMPATIBILITY
  // ==========================================
  @Post('entry')
  async createEntry(@Tenant() tenantSlug: string, @Body() dto: CreateLogbookEntryDto) {
    return this.logbookService.createEntry(tenantSlug, dto);
  }

  @Get('activity-types')
  async getActivityTypes(@Tenant() tenantSlug: string) {
    return this.logbookService.getActivityTypes(tenantSlug);
  }

  @Get('student/:rollno')
  async getStudentEntries(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.logbookService.getStudentEntries(tenantSlug, rollno);
  }

  @Put('entry/:entryId/verify/faculty')
  async verifyFaculty(
    @Tenant() tenantSlug: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: any,
    @Body() dto: VerifyLogbookEntryDto,
  ) {
    return this.logbookService.verifyEntry(tenantSlug, entryId, user.userId, user.role, dto);
  }

  @Get('monthly/department')
  async getMonthlyPgAudit(@Tenant() tenantSlug: string, @Query('rollno') rollno?: string) {
    return this.logbookService.getMonthlyPgAudit(tenantSlug, rollno);
  }
}
