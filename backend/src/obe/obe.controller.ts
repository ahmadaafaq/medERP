import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ObeService } from './obe.service';
import { SaveObeTargetDto, CreateSurveyDto, SurveyResponseDto, ComputeAttainmentDto } from './dto/obe.dto';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('OBE — Outcome Based Education')
@ApiBearerAuth()
@Public()
@Controller('obe')
export class ObeController {
  constructor(private readonly obeService: ObeService) {}

  // ─── TARGETS ───────────────────────────────────────────────────────────────

  @Post('targets')
  @ApiOperation({ summary: 'Faculty — Save CO attainment target (pre-semester declaration)' })
  async saveTarget(@Body() dto: SaveObeTargetDto, @TenantSlug() tenant: string) {
    return this.obeService.saveTarget(dto, tenant);
  }

  @Get('targets')
  @ApiOperation({ summary: 'Get OBE targets filtered by faculty/subject/semester' })
  async getTargets(
    @TenantSlug() tenant: string,
    @Query('facultyId') facultyId?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('semester') semester?: string,
    @Query('batchYear') batchYear?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.obeService.getTargets(tenant, {
      facultyId, subjectCode, semester,
      batchYear: batchYear ? Number(batchYear) : undefined,
      courseCd, branchCd,
    });
  }

  @Patch('targets/:id/corrective-action')
  @ApiOperation({ summary: 'Update corrective action for a target not met' })
  async updateCorrectiveAction(
    @Param('id') id: string,
    @Body('corrective_action') correctiveAction: string,
    @TenantSlug() tenant: string,
  ) {
    return this.obeService.updateCorrectiveAction(id, correctiveAction, tenant);
  }

  // ─── CO ATTAINMENT ─────────────────────────────────────────────────────────

  @Get('attainment/co')
  @ApiOperation({ summary: 'Compute CO attainment for a subject using exam marks + CO-PO matrix' })
  async computeCoAttainment(
    @TenantSlug() tenant: string,
    @Query('subjectCode') subjectCode: string,
    @Query('semester') semester?: string,
    @Query('batchYear') batchYear?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('markThresholdPct') markThresholdPct?: string,
  ) {
    return this.obeService.computeCoAttainment(tenant, {
      subject_code: subjectCode,
      semester,
      batch_year: batchYear ? Number(batchYear) : undefined,
      course_cd: courseCd,
      branch_cd: branchCd,
      mark_threshold_pct: markThresholdPct ? Number(markThresholdPct) : undefined,
    });
  }

  // ─── PO ATTAINMENT ─────────────────────────────────────────────────────────

  @Get('attainment/po')
  @ApiOperation({ summary: 'Compute PO attainment by rolling up CO attainments via CO-PO matrix' })
  async computePoAttainment(
    @TenantSlug() tenant: string,
    @Query('semester') semester?: string,
    @Query('sem_cd') semCd?: string,
    @Query('batchYear') batchYear?: string,
    @Query('batch_year') batchYearSnake?: string,
    @Query('courseCd') courseCd?: string,
    @Query('course_cd') courseCdSnake?: string,
    @Query('branchCd') branchCd?: string,
    @Query('branch_cd') branchCdSnake?: string,
  ) {
    const sem = semester || semCd;
    const by = batchYear || batchYearSnake;
    const cc = courseCd || courseCdSnake;
    const bc = branchCd || branchCdSnake;
    return this.obeService.computePoAttainment(tenant, {
      semester: sem,
      batchYear: by ? Number(by) : undefined,
      courseCd: cc,
      branchCd: bc,
    });
  }

  // ─── PEO ATTAINMENT ────────────────────────────────────────────────────────

  @Get('attainment/peo')
  @ApiOperation({ summary: 'Compute PEO attainment by rolling up PO attainments via PO-PEO matrix' })
  async computePeoAttainment(
    @TenantSlug() tenant: string,
    @Query('semester') semester?: string,
    @Query('sem_cd') semCd?: string,
    @Query('batchYear') batchYear?: string,
    @Query('batch_year') batchYearSnake?: string,
    @Query('courseCd') courseCd?: string,
    @Query('course_cd') courseCdSnake?: string,
    @Query('branchCd') branchCd?: string,
    @Query('branch_cd') branchCdSnake?: string,
  ) {
    const sem = semester || semCd;
    const by = batchYear || batchYearSnake;
    const cc = courseCd || courseCdSnake;
    const bc = branchCd || branchCdSnake;
    return this.obeService.computePeoAttainment(tenant, {
      semester: sem,
      batchYear: by ? Number(by) : undefined,
      courseCd: cc,
      branchCd: bc,
    });
  }

  // ─── BATCH COMPUTE ─────────────────────────────────────────────────────────

  @Post('attainment/compute')
  @ApiOperation({ summary: 'Trigger full batch CO → PO → PEO attainment computation for a semester' })
  async batchCompute(@Body() dto: ComputeAttainmentDto, @TenantSlug() tenant: string) {
    const coResult = dto.subject_code
      ? await this.obeService.computeCoAttainment(tenant, dto as any)
      : { skipped: true, message: 'Provide subjectCode for CO compute or call /attainment/co directly' };
    const poResult = await this.obeService.computePoAttainment(tenant, {
      semester: dto.semester, batchYear: dto.batch_year, courseCd: dto.course_cd, branchCd: dto.branch_cd,
    });
    const peoResult = await this.obeService.computePeoAttainment(tenant, {
      semester: dto.semester, batchYear: dto.batch_year, courseCd: dto.course_cd, branchCd: dto.branch_cd,
    });
    return { success: true, co: coResult, po: poResult, peo: peoResult };
  }

  // ─── DASHBOARDS ────────────────────────────────────────────────────────────

  @Get('faculty-dashboard')
  @ApiOperation({ summary: 'Faculty OBE dashboard: CO targets vs achieved, gap analysis, score' })
  async getFacultyDashboard(
    @TenantSlug() tenant: string,
    @Query('facultyId') facultyId?: string,
    @Query('semester') semester?: string,
    @Query('batchYear') batchYear?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.obeService.getFacultyDashboard(tenant, {
      facultyId, semester,
      batchYear: batchYear ? Number(batchYear) : undefined,
      courseCd, branchCd,
    });
  }

  @Get('hod-dashboard')
  @ApiOperation({ summary: 'HOD OBE dashboard: CO heatmap, PO/PEO attainment, faculty scorecard' })
  async getHodDashboard(
    @TenantSlug() tenant: string,
    @Query('semester') semester?: string,
    @Query('sem_cd') semCd?: string,
    @Query('batchYear') batchYear?: string,
    @Query('batch_year') batchYearSnake?: string,
    @Query('courseCd') courseCd?: string,
    @Query('course_cd') courseCdSnake?: string,
    @Query('branchCd') branchCd?: string,
    @Query('branch_cd') branchCdSnake?: string,
  ) {
    const sem = semester || semCd;
    const by = batchYear || batchYearSnake;
    const cc = courseCd || courseCdSnake;
    const bc = branchCd || branchCdSnake;
    return this.obeService.getHodDashboard(tenant, {
      semester: sem,
      batchYear: by ? Number(by) : undefined,
      courseCd: cc,
      branchCd: bc,
    });
  }

  // ─── COURSE EXIT SURVEYS ───────────────────────────────────────────────────

  @Post('surveys')
  @ApiOperation({ summary: 'Publish a new Course Exit Survey for a subject' })
  async createSurvey(@Body() dto: CreateSurveyDto, @TenantSlug() tenant: string) {
    return this.obeService.createSurvey(dto, tenant);
  }

  @Get('surveys')
  @ApiOperation({ summary: 'List published surveys' })
  async getSurveys(
    @TenantSlug() tenant: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('semester') semester?: string,
  ) {
    return this.obeService.getSurveys(tenant, subjectCode, semester);
  }

  @Post('surveys/:id/respond')
  @ApiOperation({ summary: 'Student submits a survey response for one CO' })
  async submitResponse(
    @Param('id') surveyId: string,
    @Body() dto: SurveyResponseDto,
    @TenantSlug() tenant: string,
  ) {
    return this.obeService.submitSurveyResponse({ ...dto, survey_id: surveyId }, tenant);
  }

  @Get('surveys/:id/results')
  @ApiOperation({ summary: 'Get average ratings per CO for a survey' })
  async getSurveyResults(@Param('id') surveyId: string, @TenantSlug() tenant: string) {
    return this.obeService.getSurveyResults(surveyId, tenant);
  }

  // ─── REPORTS ───────────────────────────────────────────────────────────────

  @Get('reports/co-sheet')
  @ApiOperation({ summary: 'CO attainment sheet — NBA-ready tabular report' })
  async getCoSheet(
    @TenantSlug() tenant: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('semester') semester?: string,
    @Query('batchYear') batchYear?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.obeService.getCoAttainmentSheet(tenant, {
      subjectCode, semester,
      batchYear: batchYear ? Number(batchYear) : undefined,
      courseCd, branchCd,
    });
  }

  @Get('reports/po-sheet')
  @ApiOperation({ summary: 'PO attainment sheet — program-level NBA report' })
  async getPoSheet(
    @TenantSlug() tenant: string,
    @Query('semester') semester?: string,
    @Query('batchYear') batchYear?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
  ) {
    return this.obeService.computePoAttainment(tenant, {
      semester,
      batchYear: batchYear ? Number(batchYear) : undefined,
      courseCd, branchCd,
    });
  }
}
