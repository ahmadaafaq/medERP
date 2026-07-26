import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ExaminationService } from './examination.service';
import { CreateExamPaperDto, SubmitResultDto } from './dto/examination.dto';
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
}
