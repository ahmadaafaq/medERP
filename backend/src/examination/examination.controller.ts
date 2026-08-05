import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExaminationService } from './examination.service';
import { CreateExamPaperDto, SubmitResultDto, CreateQuestionDto, PublishPaperDto } from './dto/examination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExaminationController {
  constructor(private readonly examinationService: ExaminationService) {}

  @Post('papers')
  async createPaper(@Tenant() tenantSlug: string, @Body() dto: CreateExamPaperDto) {
    return this.examinationService.createPaper(tenantSlug, dto);
  }

  @Get('papers')
  async getPapers(@Tenant() tenantSlug: string) {
    return this.examinationService.getPapers(tenantSlug);
  }

  @Post('results')
  async submitResult(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitResultDto,
  ) {
    return this.examinationService.submitResult(tenantSlug, user.userId, dto);
  }

  @Get('marks/:rollno')
  async getStudentMarks(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.examinationService.getStudentMarks(tenantSlug, rollno);
  }

  @Post('question-bank')
  async createQuestion(@Tenant() tenantSlug: string, @Body() dto: CreateQuestionDto) {
    return this.examinationService.createQuestion(tenantSlug, dto);
  }

  @Get('question-bank')
  async getQuestions(
    @Tenant() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('mode') mode?: string,
    @Query('professionalPhase') professionalPhase?: string,
    @Query('topic') topic?: string,
    @Query('competencyCode') competencyCode?: string,
  ) {
    return this.examinationService.getQuestions(tenantSlug, { departmentId, subjectId, mode, professionalPhase, topic, competencyCode });
  }

  @Delete('question-bank/:id')
  async deleteQuestion(@Tenant() tenantSlug: string, @Param('id') id: string) {
    return this.examinationService.deleteQuestion(tenantSlug, id);
  }

  @Post('publish')
  async publishPaper(@Tenant() tenantSlug: string, @Body() dto: PublishPaperDto) {
    return this.examinationService.publishPaper(tenantSlug, dto);
  }
}
