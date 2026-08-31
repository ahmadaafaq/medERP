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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { LogbookService } from './logbook.service';
import {
  CreateLogbookCategoryDto,
  CreateLogbookTopicDto,
  UpdateLogbookTopicDto,
  CreateLogbookSubmissionDto,
  EvaluateLogbookSubmissionDto,
  CreateMiniProjectDto,
  UpdateMiniProjectDto,
  CreateWeeklyLogDto,
  UpdateWeeklyLogDto,
  CreateSeminarDto,
  UpdateSeminarDto,
  CreateTutorialDto,
  UpdateTutorialDto,
  CreateTechnicalActivityDto,
  UpdateTechnicalActivityDto,
  CreateProjectReviewDto,
  CreateFacultyRemarkDto,
  FacultyReviewActionDto,
  CreateLogbookEntryDto,
  VerifyLogbookEntryDto,
  EvaluateWeeklyLogDto,
  FinalizeProjectLockDto,
} from './dto/logbook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Digital Logbook')
@ApiBearerAuth()
@Controller('logbook')
@UseGuards(JwtAuthGuard)
export class LogbookController {
  constructor(private readonly logbookService: LogbookService) {}

  // ==========================================
  // 1. DASHBOARD & PROFILE STATS
  // ==========================================
  @Public()
  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get student digital logbook dashboard stats & completion matrix' })
  async getDashboardStats(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getStudentDashboardStats(tenantSlug, studentId);
  }

  // ==========================================
  // 2. MINI PROJECT (Faculty assign, Student track)
  // ==========================================
  @Public()
  @Get('mini-project')
  @ApiOperation({ summary: 'Get assigned mini project topic, prompt and tech stack' })
  async getMiniProject(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getMiniProject(tenantSlug, studentId);
  }

  @Public()
  @Post('mini-project')
  @ApiOperation({ summary: 'Faculty publish & assign mini project topic with tech stack' })
  async createMiniProject(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMiniProjectDto,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.createOrAssignMiniProject(tenantSlug, facultyId, dto);
  }

  @Public()
  @Patch('mini-project/:id')
  @ApiOperation({ summary: 'Update mini project details, repository link, live demo URL' })
  async updateMiniProject(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateMiniProjectDto,
  ) {
    return this.logbookService.updateMiniProject(tenantSlug, id, dto);
  }

  @Public()
  @Post('mini-project/:id/upload-doc')
  @ApiOperation({ summary: 'Upload physical project documentation file (PDF, DOCX, ZIP up to 25MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProjectDocument(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentIdentifier = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.uploadProjectDocument(tenantSlug, id, file, studentIdentifier);
  }

  @Public()
  @Get('mini-project/:id/document')
  @ApiOperation({ summary: 'Stream and view/download physical project documentation report' })
  async downloadProjectDocument(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Query('studentId') queryStudentId: string,
    @Res() res: Response,
  ) {
    return this.logbookService.streamProjectDocument(tenantSlug, id, queryStudentId, res);
  }

  @Delete('mini-project/:id/document')
  @ApiOperation({ summary: 'Delete attached project documentation file from disk and database' })
  async deleteProjectDocument(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentIdentifier = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.deleteProjectDocument(tenantSlug, id, studentIdentifier);
  }

  @Public()
  @Get('mini-projects/all')
  @ApiOperation({ summary: 'Faculty view all assigned mini projects' })
  async getAllFacultyMiniProjects(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id;
    return this.logbookService.getAllFacultyMiniProjects(tenantSlug, facultyId);
  }

  @Public()
  @Get('mini-projects/applicants')
  @ApiOperation({ summary: 'Faculty view enrolled mini project applicants and their weekly tracking' })
  async getMiniProjectApplicants(
    @Tenant() tenantSlug: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.logbookService.getMiniProjectApplicants(tenantSlug, projectId);
  }

  @Public()
  @Post('mini-projects/finalize-lock')
  @ApiOperation({ summary: 'Faculty grade, lock and close mini project for candidate' })
  async finalizeAndLockStudentProject(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: FinalizeProjectLockDto,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.finalizeAndLockStudentProject(tenantSlug, facultyId, dto);
  }

  @Public()
  @Patch('weekly-logs/:id/evaluate')
  @ApiOperation({ summary: 'Faculty evaluate weekly log with marks and remarks' })
  async evaluateWeeklyLog(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: EvaluateWeeklyLogDto,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.evaluateWeeklyLog(tenantSlug, id, facultyId, dto);
  }

  @Public()
  @Get('weekly-logs/all')
  @ApiOperation({ summary: 'Faculty view all students weekly project progress logs' })
  async getAllWeeklyLogs(
    @Tenant() tenantSlug: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    return this.logbookService.getAllWeeklyLogs(tenantSlug, { projectId, status });
  }

  // ==========================================
  // 3. WEEKLY LOGS (Add / View / Edit / Delete)
  // ==========================================
  @Public()
  @Get('weekly-logs')
  @ApiOperation({ summary: 'Get student weekly log entries' })
  async getWeeklyLogs(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getWeeklyLogs(tenantSlug, studentId);
  }

  @Public()
  @Post('weekly-logs')
  @ApiOperation({ summary: 'Submit weekly work log entry' })
  async createWeeklyLog(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateWeeklyLogDto,
  ) {
    const studentId = dto.studentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.createWeeklyLog(tenantSlug, studentId, dto);
  }

  @Public()
  @Patch('weekly-logs/:id')
  @ApiOperation({ summary: 'Update existing weekly log entry' })
  async updateWeeklyLog(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateWeeklyLogDto,
  ) {
    return this.logbookService.updateWeeklyLog(tenantSlug, id, dto);
  }

  @Public()
  @Delete('weekly-logs/:id')
  @ApiOperation({ summary: 'Delete weekly log entry' })
  async deleteWeeklyLog(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.deleteWeeklyLog(tenantSlug, id);
  }

  // ==========================================
  // 4. SEMINARS (Add / View / Edit / Delete)
  // ==========================================
  @Public()
  @Get('seminars')
  @ApiOperation({ summary: 'Get student seminar presentations' })
  async getSeminars(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getSeminars(tenantSlug, studentId);
  }

  @Public()
  @Post('seminars')
  @ApiOperation({ summary: 'Record seminar presentation' })
  async createSeminar(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSeminarDto,
  ) {
    const studentId = dto.studentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.createSeminar(tenantSlug, studentId, dto);
  }

  @Public()
  @Patch('seminars/:id')
  @ApiOperation({ summary: 'Update seminar presentation' })
  async updateSeminar(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateSeminarDto,
  ) {
    return this.logbookService.updateSeminar(tenantSlug, id, dto);
  }

  @Public()
  @Delete('seminars/:id')
  @ApiOperation({ summary: 'Delete seminar entry' })
  async deleteSeminar(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.deleteSeminar(tenantSlug, id);
  }

  // ==========================================
  // 5. TUTORIALS (Add / View / Edit / Delete)
  // ==========================================
  @Public()
  @Get('tutorials')
  @ApiOperation({ summary: 'Get student tutorial submissions' })
  async getTutorials(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getTutorials(tenantSlug, studentId);
  }

  @Public()
  @Post('tutorials')
  @ApiOperation({ summary: 'Submit tutorial problem solution' })
  async createTutorial(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTutorialDto,
  ) {
    const studentId = dto.studentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.createTutorial(tenantSlug, studentId, dto);
  }

  @Public()
  @Patch('tutorials/:id')
  @ApiOperation({ summary: 'Update tutorial problem solution' })
  async updateTutorial(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateTutorialDto,
  ) {
    return this.logbookService.updateTutorial(tenantSlug, id, dto);
  }

  @Public()
  @Delete('tutorials/:id')
  @ApiOperation({ summary: 'Delete tutorial entry' })
  async deleteTutorial(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.deleteTutorial(tenantSlug, id);
  }

  // ==========================================
  // 6. TECHNICAL ACTIVITIES (Add / View / Edit / Delete)
  // ==========================================
  @Public()
  @Get('technical-activities')
  @ApiOperation({ summary: 'Get student co-curricular technical activities' })
  async getTechnicalActivities(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getTechnicalActivities(tenantSlug, studentId);
  }

  @Public()
  @Post('technical-activities')
  @ApiOperation({ summary: 'Add technical workshop / certification / hackathon entry' })
  async createTechnicalActivity(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTechnicalActivityDto,
  ) {
    const studentId = dto.studentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.createTechnicalActivity(tenantSlug, studentId, dto);
  }

  @Public()
  @Patch('technical-activities/:id')
  @ApiOperation({ summary: 'Update technical activity entry' })
  async updateTechnicalActivity(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateTechnicalActivityDto,
  ) {
    return this.logbookService.updateTechnicalActivity(tenantSlug, id, dto);
  }

  @Public()
  @Delete('technical-activities/:id')
  @ApiOperation({ summary: 'Delete technical activity entry' })
  async deleteTechnicalActivity(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.deleteTechnicalActivity(tenantSlug, id);
  }

  // ==========================================
  // 7. PROGRESS REVIEWS (Review 0 to 3)
  // ==========================================
  @Public()
  @Get('reviews')
  @ApiOperation({ summary: 'Get student project review milestones 0 to 3' })
  async getProjectReviews(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getProjectReviews(tenantSlug, studentId);
  }

  @Public()
  @Post('reviews')
  @ApiOperation({ summary: 'Faculty grade and review milestone stage' })
  async createProjectReview(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateProjectReviewDto,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.createOrUpdateProjectReview(tenantSlug, facultyId, dto);
  }

  // ==========================================
  // 8. FACULTY REMARKS & MENTORING
  // ==========================================
  @Public()
  @Get('faculty-remarks')
  @ApiOperation({ summary: 'Get faculty mentoring remarks timeline' })
  async getFacultyRemarks(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getFacultyRemarks(tenantSlug, studentId);
  }

  @Public()
  @Post('faculty-remarks')
  @ApiOperation({ summary: 'Faculty post mentoring remarks with signature stamp' })
  async createFacultyRemark(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateFacultyRemarkDto,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.createFacultyRemark(tenantSlug, facultyId, dto);
  }

  // ==========================================
  // 9. FINAL EVALUATION
  // ==========================================
  @Public()
  @Get('final-evaluation')
  @ApiOperation({ summary: 'Get consolidated final rubric evaluation and grade sheet' })
  async getFinalEvaluation(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getFinalEvaluation(tenantSlug, studentId);
  }

  // ==========================================
  // 10. UNIVERSAL FACULTY REVIEW & SIGN-OFF
  // ==========================================
  @Public()
  @Post('faculty/review-action')
  @ApiOperation({ summary: 'Faculty approve/grade/sign-off any logbook deliverable' })
  async facultyReviewAction(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: FacultyReviewActionDto,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.facultyReviewAction(tenantSlug, facultyId, dto);
  }

  // ==========================================
  // LEGACY TOPICS & SUBMISSIONS
  // ==========================================
  @Public()
  @Get('categories')
  async getCategories(@Tenant() tenantSlug: string, @Query('courseId') courseId?: string, @Query('departmentId') departmentId?: string) {
    return this.logbookService.getCategories(tenantSlug, { courseId, departmentId });
  }

  @Public()
  @Get('academic-structure')
  @ApiOperation({ summary: 'Get academic hierarchy options for course, branch, batch, and semester' })
  async getAcademicStructure(
    @Tenant() tenantSlug: string,
    @Query('courseId') courseId?: string,
    @Query('courseCd') courseCd?: string,
  ) {
    return this.logbookService.getAcademicStructure(tenantSlug, courseCd || courseId);
  }

  @Public()
  @Post('seminar-tutorial-topic')
  @ApiOperation({ summary: 'Faculty publish a seminar or tutorial assignment topic' })
  async createSeminarOrTutorialTopic(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.createSeminarOrTutorialTopic(tenantSlug, facultyId, dto);
  }

  @Public()
  @Post('categories')
  async createCategory(@Tenant() tenantSlug: string, @Body() dto: CreateLogbookCategoryDto) {
    return this.logbookService.createCategory(tenantSlug, dto);
  }

  @Public()
  @Post('topics')
  async createTopic(@Tenant() tenantSlug: string, @CurrentUser() user: any, @Body() dto: CreateLogbookTopicDto) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.createTopic(tenantSlug, facultyId, dto);
  }

  @Public()
  @Get('topics')
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
    @Query('studentId') queryStudentId?: string,
    @Query('studentUserId') queryStudentUserId?: string,
  ) {
    const studentUserId = queryStudentUserId || user?.sub || user?.id || user?.userId;
    const studentId = queryStudentId || user?.profile?.id;

    return this.logbookService.getTopics(tenantSlug, {
      facultyId,
      courseId,
      branchId,
      batchId,
      semesterId,
      categoryId,
      search,
      studentId,
      studentUserId: studentView === 'true' || user?.role === 'STUDENT' ? studentUserId : undefined,
    });
  }

  @Public()
  @Get('topics/:id')
  async getTopicById(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.getTopicById(tenantSlug, id);
  }

  @Public()
  @Patch('topics/:id')
  async updateTopic(@Tenant() tenantSlug: string, @Param('id') id: string, @Body() dto: UpdateLogbookTopicDto) {
    return this.logbookService.updateTopic(tenantSlug, id, dto);
  }

  @Public()
  @Delete('topics/:id')
  async deleteTopic(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.deleteTopic(tenantSlug, id);
  }

  @Public()
  @Post('submissions')
  async createSubmission(@Tenant() tenantSlug: string, @CurrentUser() user: any, @Body() dto: CreateLogbookSubmissionDto) {
    const studentId = dto.studentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.createSubmission(tenantSlug, studentId, dto);
  }

  @Public()
  @Get('submissions/me')
  async getMySubmissions(@Tenant() tenantSlug: string, @CurrentUser() user: any, @Query('studentId') queryStudentId?: string) {
    const studentId = queryStudentId || user?.profile?.id || user?.sub || user?.id || user?.userId;
    return this.logbookService.getMySubmissions(tenantSlug, studentId);
  }

  @Public()
  @Get('submissions')
  async getSubmissions(@Tenant() tenantSlug: string, @Query('topicId') topicId?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.logbookService.getSubmissions(tenantSlug, { topicId, status, search });
  }

  @Public()
  @Get('submissions/:id')
  async getSubmissionById(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.getSubmissionById(tenantSlug, id);
  }

  @Public()
  @Post('submissions/:id/evaluate')
  async evaluateSubmission(@Tenant() tenantSlug: string, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: EvaluateLogbookSubmissionDto) {
    const facultyId = user?.profile?.id || user?.userId || user?.id || user?.sub || '00000000-0000-0000-0000-000000000001';
    return this.logbookService.evaluateSubmission(tenantSlug, id, facultyId, dto);
  }

  @Public()
  @Public()
  @Get('admin/all-entries')
  @ApiOperation({ summary: 'Admin view all logbook submissions, seminars, tutorials, and deliverables with faculty evaluations' })
  async getAllAdminLogbookEntries(
    @Tenant() tenantSlug: string,
    @Query('courseId') courseId?: string,
    @Query('branchId') branchId?: string,
    @Query('batchId') batchId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.logbookService.getAllAdminLogbookEntries(tenantSlug, {
      courseId,
      branchId,
      batchId,
      semesterId,
      category,
      status,
      search,
    });
  }

  @Public()
  @Get('leaderboard')
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

  @Public()
  @Get('notifications/me')
  async getNotifications(@Tenant() tenantSlug: string, @CurrentUser() user: any) {
    const userId = user?.profile?.id || user?.userId || user?.id;
    return this.logbookService.getNotifications(tenantSlug, userId);
  }

  @Public()
  @Patch('notifications/:id/read')
  async markNotificationRead(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.logbookService.markNotificationRead(tenantSlug, id);
  }

  // Legacy backwards-compatible
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
    return this.logbookService.verifyEntry(tenantSlug, entryId, user?.userId || '00000000-0000-0000-0000-000000000001', user?.role || 'FACULTY', dto);
  }
}
