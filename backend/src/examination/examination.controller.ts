import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExaminationService } from './examination.service';
import { CreateExamPaperDto, SubmitResultDto, CreateQuestionDto, PublishPaperDto } from './dto/examination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExaminationController {
  constructor(private readonly examinationService: ExaminationService) {}

  @Public()
  @Post('papers')
  async createPaper(@Tenant() tenantSlug: string, @Body() dto: CreateExamPaperDto) {
    return this.examinationService.createPaper(tenantSlug, dto);
  }

  @Public()
  @Get('papers')
  async getPapers(@Tenant() tenantSlug: string) {
    return this.examinationService.getPapers(tenantSlug);
  }

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
  @Post('question-bank')
  async createQuestion(@Tenant() tenantSlug: string, @Body() dto: CreateQuestionDto) {
    return this.examinationService.createQuestion(tenantSlug, dto);
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
  ) {
    return this.examinationService.getQuestions(tenantSlug, { departmentId, subjectId, mode, professionalPhase, topicId, topic, competencyId, competencyCode });
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
