import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Headers, Req, UseGuards } from '@nestjs/common';
import { ExaminationService } from './examination.service';
import {
  CreateExamPaperDto, SubmitResultDto, CreateQuestionDto, PublishPaperDto,
  HodApproveQPDto, HodApproveTimetableDto, CreateTimetableDraftDto,
  CalculatePaperScoreDto, AutoGenerateBlueprintDto, UpdateAssessmentSettingsDto, ValidatePaperDto,
} from './dto/examination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExaminationController {
  constructor(private readonly examinationService: ExaminationService) { }

  // ─── Question Paper CRUD ─────────────────────────────────────────────────

  @Public()
  @Post('papers')
  async createPaper(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateExamPaperDto,
  ) {
    return this.examinationService.createPaper(tenantSlug, dto, user);
  }

  @Public()
  @Get('papers')
  async getPapers(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('colgCd') colgCd?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semester') semester?: string,
    @Query('section') section?: string,
    @Query('facultyId') facultyId?: string,
    @Query('createdBy') createdBy?: string,
    @Query('role') role?: string,
    @Req() req?: any,
  ) {
    const activeUser = this.extractUserFromReq(req, user);
    return this.examinationService.getPapers(
      tenantSlug,
      { status, departmentId, colgCd, courseCd, branchCd, batchCd, semester, section, facultyId, createdBy, role },
      activeUser,
    );
  }

  // ─── Assessment Settings, Validation & Pure Scoring Endpoints ───────────

  @Public()
  @Post('papers/validate')
  async validatePaper(@Body() dto: ValidatePaperDto) {
    return this.examinationService.validatePaper(dto.paperSnapshot);
  }

  @Public()
  @Post('score/calculate')
  async calculateScore(
    @Tenant() tenantSlug: string,
    @Body() dto: CalculatePaperScoreDto,
  ) {
    return this.examinationService.calculateScore(tenantSlug, dto);
  }

  @Public()
  @Post('blueprint/generate')
  async autoGenerateBlueprint(
    @Tenant() tenantSlug: string,
    @Body() dto: AutoGenerateBlueprintDto,
  ) {
    return this.examinationService.autoGenerateBlueprint(tenantSlug, dto);
  }

  @Public()
  @Get('settings')
  async getAssessmentSettings(@Tenant() tenantSlug: string) {
    return this.examinationService.getAssessmentSettings(tenantSlug);
  }

  @Public()
  @Patch('settings')
  async updateAssessmentSettings(
    @Tenant() tenantSlug: string,
    @Body() dto: UpdateAssessmentSettingsDto,
  ) {
    return this.examinationService.updateAssessmentSettings(tenantSlug, dto);
  }

  @Public()
  @Post('papers/:id/duplicate')
  async duplicatePaper(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body?: { targetSet?: string; asTemplate?: boolean },
  ) {
    return this.examinationService.duplicatePaper(tenantSlug, id, user, body);
  }

  // ─── HOD Approval — Question Papers ─────────────────────────────────────

  /** Clerk: Submit question paper for HOD approval */
  @Public()
  @Post('papers/submit-for-approval')
  async submitQPForApproval(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() body: { paperId?: string; id?: string; notes?: string },
  ) {
    const id = String(body.paperId || body.id || '');
    return this.examinationService.submitQPForApproval(tenantSlug, user, id, body.notes);
  }

  /** Faculty: Submit question paper for DQAC Quality Audit */
  @Public()
  @Post('papers/submit-for-dqac')
  async submitQPForDqac(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() body: { paperId?: string; id?: string; notes?: string },
  ) {
    const id = String(body.paperId || body.id || '');
    return this.examinationService.submitQPForDqac(tenantSlug, user, id, body.notes);
  }

  private extractUserFromReq(req: any, fallbackUser?: any): any {
    if (fallbackUser && (fallbackUser.sub || fallbackUser.id)) return fallbackUser;
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token?.split('.')[1];
        if (payloadBase64) {
          const parsed = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          return parsed;
        }
      } catch { }
    }
    return fallbackUser || null;
  }

  /** HOD: Get pending question papers awaiting approval */
  @Public()
  @Get('papers/pending-hod-approval')
  async getPendingQPForHod(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') statusFilter?: string,
    @Query('userId') queryUserId?: string,
    @Query('empId') queryEmpId?: string,
    @Query('courseCd') queryCourseCd?: string,
    @CurrentUser() user?: any,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-emp-id') headerEmpId?: string,
    @Headers('x-department-id') headerDeptId?: string,
    @Req() req?: any,
  ) {
    const activeUser = this.extractUserFromReq(req, user);
    const effectiveDeptId = (departmentId || headerDeptId || '').trim() || undefined;
    const effectiveUserId = (queryUserId || headerUserId || activeUser?.sub || activeUser?.id || activeUser?.userId || '').trim() || undefined;
    const effectiveEmpId = (queryEmpId || headerEmpId || activeUser?.emp_id || activeUser?.empId || '').trim() || undefined;
    return this.examinationService.getPendingQPForHod(tenantSlug, effectiveDeptId, statusFilter, {
      userId: effectiveUserId,
      empId: effectiveEmpId,
      courseCd: queryCourseCd,
      user: activeUser,
    });
  }

  /** HOD: Approve or reject a question paper */
  @Public()
  @Post('papers/hod-action')
  async hodQPAction(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: HodApproveQPDto,
  ) {
    return this.examinationService.hodQPAction(tenantSlug, user, dto);
  }

  /** DQAC: Get pending question papers awaiting quality audit */
  @Public()
  @Get('papers/pending-dqac-approval')
  async getPendingQPForDqac(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') statusFilter?: string,
    @CurrentUser() user?: any,
    @Req() req?: any,
  ) {
    const activeUser = this.extractUserFromReq(req, user);
    return this.examinationService.getPendingQPForHod(tenantSlug, departmentId, statusFilter || 'PENDING_DQAC_APPROVAL', {
      user: activeUser,
    });
  }

  /** DQAC: Quality audit action on question paper */
  @Public()
  @Post('papers/dqac-action')
  async dqacQPAction(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: HodApproveQPDto,
  ) {
    return this.examinationService.hodQPAction(tenantSlug, user, dto);
  }

  /** Admin: Add review remarks or approve a question paper */
  @Public()
  @Post('papers/admin-review')
  async adminQPReview(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: HodApproveQPDto,
  ) {
    return this.examinationService.hodQPAction(tenantSlug, user, dto);
  }

  /** Admin: Get HOD-approved question papers (for printing) */
  @Public()
  @Get('papers/approved')
  async getApprovedPapers(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('userId') queryUserId?: string,
    @Query('empId') queryEmpId?: string,
    @Query('courseCd') queryCourseCd?: string,
    @CurrentUser() user?: any,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-emp-id') headerEmpId?: string,
    @Headers('x-department-id') headerDeptId?: string,
  ) {
    const effectiveDeptId = departmentId || headerDeptId;
    const effectiveUserId = queryUserId || headerUserId || user?.sub || user?.id || user?.userId;
    const effectiveEmpId = queryEmpId || headerEmpId || user?.emp_id || user?.empId;
    return this.examinationService.getApprovedPapers(tenantSlug, effectiveDeptId, {
      userId: effectiveUserId,
      empId: effectiveEmpId,
      courseCd: queryCourseCd,
      user,
    });
  }

  @Public()
  @Get('papers/:id')
  async getPaperById(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.examinationService.getPaperById(tenantSlug, id, user);
  }

  @Public()
  @Delete('papers/:id')
  async deletePaper(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.examinationService.deletePaper(tenantSlug, id, user);
  }

  // ─── Timetable Draft Workflow (Clerk → HOD → Live) ──────────────────────

  /** Clerk: Create a timetable draft */
  @Public()
  @Post('timetable-drafts')
  async createTimetableDraft(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTimetableDraftDto,
  ) {
    return this.examinationService.createTimetableDraft(tenantSlug, user, dto);
  }

  /** Clerk: Submit timetable draft for HOD approval */
  @Public()
  @Post('timetable-drafts/submit-for-approval')
  async submitTimetableDraftForApproval(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() body: { draftId: string; notes?: string },
  ) {
    return this.examinationService.submitTimetableDraftForApproval(tenantSlug, user, body.draftId, body.notes);
  }

  /** Clerk / HOD: List timetable drafts */
  @Public()
  @Get('timetable-drafts')
  async getTimetableDrafts(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.examinationService.getTimetableDrafts(tenantSlug, { departmentId, status });
  }

  /** HOD: Get pending timetable drafts for approval */
  @Public()
  @Get('timetable-drafts/pending-hod-approval')
  async getPendingTimetableForHod(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('userId') queryUserId?: string,
    @Query('empId') queryEmpId?: string,
    @Query('courseCd') queryCourseCd?: string,
    @CurrentUser() user?: any,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-emp-id') headerEmpId?: string,
    @Headers('x-department-id') headerDeptId?: string,
    @Req() req?: any,
  ) {
    const activeUser = this.extractUserFromReq(req, user);
    const effectiveDeptId = (departmentId || headerDeptId || '').trim() || undefined;
    const effectiveUserId = (queryUserId || headerUserId || activeUser?.sub || activeUser?.id || activeUser?.userId || '').trim() || undefined;
    const effectiveEmpId = (queryEmpId || headerEmpId || activeUser?.emp_id || activeUser?.empId || '').trim() || undefined;
    return this.examinationService.getPendingTimetableForHod(tenantSlug, effectiveDeptId, {
      userId: effectiveUserId,
      empId: effectiveEmpId,
      courseCd: queryCourseCd,
      user: activeUser,
    });
  }

  /** HOD: Approve or reject a timetable draft */
  @Public()
  @Post('timetable-drafts/hod-action')
  async hodTimetableAction(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: HodApproveTimetableDto,
  ) {
    return this.examinationService.hodTimetableAction(tenantSlug, user, dto);
  }

  /** Faculty / Students / Admin: Get approved/live timetable drafts */
  @Public()
  @Get('timetable-drafts/approved')
  async getApprovedTimetable(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.examinationService.getApprovedTimetable(tenantSlug, departmentId, batchId);
  }

  /** Faculty: Get submitted/approved weeks with only this faculty's slots */
  @Public()
  @Get('timetable-drafts/faculty-schedule')
  async getFacultySchedule(
    @Tenant() tenantSlug: string,
    @Query('facultyId') facultyId?: string,
    @Query('facultyEmpId') facultyEmpId?: string,
    @Query('facultyName') facultyName?: string,
  ) {
    return this.examinationService.getDraftsByWeekForFaculty(tenantSlug, facultyId || '', facultyEmpId, facultyName);
  }

  /** HOD: Get tracking compliance of all faculties across timetable drafts */
  @Public()
  @Get('timetable-drafts/faculty-compliance')
  async getFacultyCompliance(
    @Tenant() tenantSlug: string,
    @Query('draftId') draftId?: string,
  ) {
    return this.examinationService.getFacultyTimetableCompliance(tenantSlug, draftId);
  }

  /** HOD: Send urgent notification reminder to faculty for schedule planning */
  @Public()
  @Post('timetable-drafts/remind-faculty')
  async remindFaculty(
    @Tenant() tenantSlug: string,
    @Body() body: { draftId: string; facultyId?: string; facultyEmpId?: string; facultyName?: string; customMessage?: string },
  ) {
    return this.examinationService.remindFacultyForPlanning(tenantSlug, body);
  }

  /** Clerk / Admin: Get a single timetable draft by ID */
  @Public()
  @Get('timetable-drafts/:id')
  async getDraftById(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
  ) {
    return this.examinationService.getDraftById(tenantSlug, id);
  }

  /** Clerk / Admin: Delete a timetable draft */
  @Public()
  @Delete('timetable-drafts/:id')
  async deleteTimetableDraft(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
  ) {
    return this.examinationService.deleteTimetableDraft(tenantSlug, id);
  }

  /** Faculty: Link unit/topic/subtopic to a slot → mappingStatus = LINKED */
  @Public()
  @Post('timetable-drafts/link-slot')
  async linkSlot(
    @Tenant() tenantSlug: string,
    @Body() dto: { draftId: string; slotId: string; unitId?: string; unitName?: string; topic?: string; subTopics?: string; competencyCodes?: string },
  ) {
    return this.examinationService.facultyLinkSlot(tenantSlug, dto);
  }

  /** Clerk: Copy a draft to the next week (new DRAFT, all slots = PENDING) */
  @Public()
  @Post('timetable-drafts/copy-to-next-week')
  async copyDraftToNextWeek(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() body: { draftId: string },
  ) {
    return this.examinationService.copyDraftToNextWeek(tenantSlug, user, body.draftId);
  }

  // ─── Results & Marks ────────────────────────────────────────────────────

  @Public()
  @Post('results')
  async submitResult(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitResultDto,
  ) {
    const userId = user?.userId || user?.sub || user?.id || null;
    return this.examinationService.submitResult(tenantSlug, userId, dto);
  }

  @Public()
  @Get('results')
  async getResults(
    @Tenant() tenantSlug: string,
    @Query('paperId') paperId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.examinationService.getResults(tenantSlug, paperId, studentId);
  }

  @Public()
  @Get('marks/:rollno')
  async getStudentMarks(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.examinationService.getStudentMarks(tenantSlug, rollno);
  }

  @Public()
  @Get('student/:rollno')
  async getStudentMarksByStudentId(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.examinationService.getStudentMarks(tenantSlug, rollno);
  }

  @Public()
  @Get('student-results/:rollno')
  async getStudentResults(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.examinationService.getStudentMarks(tenantSlug, rollno);
  }

  // ─── Question Bank ────────────────────────────────────────────────────────

  @Public()
  @Post('question-bank')
  async createQuestion(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.examinationService.createQuestion(tenantSlug, dto, user);
  }

  @Public()
  @Get('question-bank')
  async getQuestions(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('mode') mode?: string,
    @Query('professionalPhase') professionalPhase?: string,
    @Query('topicId') topicId?: string,
    @Query('topic') topic?: string,
    @Query('competencyId') competencyId?: string,
    @Query('competencyCode') competencyCode?: string,
    @Query('unitId') unitId?: string,
    @Query('unitCode') unitCode?: string,
    @Query('colgCd') colgCd?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semester') semester?: string,
    @Query('section') section?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('status') status?: string,
  ) {
    return this.examinationService.getQuestions(tenantSlug, {
      departmentId, subjectId, mode, professionalPhase, topicId, topic, competencyId, competencyCode,
      unitId, unitCode,
      colgCd, courseCd, branchCd, batchCd, semester, section,
      includeInactive, status,
    });
  }

  @Public()
  @Put('question-bank/:id')
  async updateQuestion(
    @Tenant() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.examinationService.updateQuestion(tenantSlug, id, dto);
  }

  @Public()
  @Post('question-bank/resume-all')
  async resumeAllQuestions(@Tenant() tenantSlug: string) {
    return this.examinationService.resumeAllQuestions(tenantSlug);
  }

  @Public()
  @Post('question-bank/:id/resume')
  async resumeQuestion(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.examinationService.resumeQuestion(tenantSlug, id);
  }

  @Public()
  @Delete('question-bank/:id')
  async deleteQuestion(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.examinationService.deleteQuestion(tenantSlug, id);
  }

  @Public()
  @Post('publish')
  async publishPaper(@Tenant() tenantSlug: string, @Body() dto: PublishPaperDto) {
    return this.examinationService.publishPaper(tenantSlug, dto);
  }
}
