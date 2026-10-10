import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExaminationService } from './examination.service';
import {
  CreateExamPaperDto, SubmitResultDto, CreateQuestionDto, PublishPaperDto,
  HodApproveQPDto, HodApproveTimetableDto, CreateTimetableDraftDto,
} from './dto/examination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExaminationController {
  constructor(private readonly examinationService: ExaminationService) {}

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
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('colgCd') colgCd?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semester') semester?: string,
    @Query('section') section?: string,
  ) {
    return this.examinationService.getPapers(tenantSlug, {
      status, departmentId, colgCd, courseCd, branchCd, batchCd, semester, section,
    });
  }

  // ─── HOD Approval — Question Papers ─────────────────────────────────────

  /** Clerk: Submit question paper for HOD approval */
  @Public()
  @Post('papers/submit-for-approval')
  async submitQPForApproval(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() body: { paperId: string; notes?: string },
  ) {
    return this.examinationService.submitQPForApproval(tenantSlug, user, body.paperId, body.notes);
  }

  /** HOD: Get pending question papers awaiting approval */
  @Public()
  @Get('papers/pending-hod-approval')
  async getPendingQPForHod(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') statusFilter?: string,
  ) {
    return this.examinationService.getPendingQPForHod(tenantSlug, departmentId, statusFilter);
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
  ) {
    return this.examinationService.getApprovedPapers(tenantSlug, departmentId);
  }

  @Public()
  @Get('papers/:id')
  async getPaperById(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.examinationService.getPaperById(tenantSlug, id);
  }

  @Public()
  @Delete('papers/:id')
  async deletePaper(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.examinationService.deletePaper(tenantSlug, id);
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
  ) {
    return this.examinationService.getPendingTimetableForHod(tenantSlug, departmentId);
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
  ) {
    return this.examinationService.getDraftsByWeekForFaculty(tenantSlug, facultyId || '', facultyEmpId);
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
    @Query('colgCd') colgCd?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchCd') batchCd?: string,
    @Query('semester') semester?: string,
    @Query('section') section?: string,
  ) {
    return this.examinationService.getQuestions(tenantSlug, {
      departmentId, subjectId, mode, professionalPhase, topicId, topic, competencyId, competencyCode,
      colgCd, courseCd, branchCd, batchCd, semester, section,
    });
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
