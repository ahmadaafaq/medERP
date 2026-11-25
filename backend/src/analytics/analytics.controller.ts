import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Tenant } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('dashboard/college')
  async getCollegeKpis(
    @Tenant() tenantSlug?: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = tenantSlug || queryTenant || '';
    return this.analyticsService.getCollegeKpis(slug);
  }

  @Public()
  @Get('compliance-report')
  async getComplianceReport(
    @Tenant() tenantSlug?: string,
    @Query('tenant') queryTenant?: string,
    @Query('departmentId') departmentId?: string,
    @Query('courseCd') courseCd?: string,
    @Query('branchCd') branchCd?: string,
    @Query('batchId') batchId?: string,
    @Query('semester') semester?: string,
    @Query('section') section?: string,
    @Query('hodUserId') hodUserId?: string,
  ) {
    const slug = tenantSlug || queryTenant || '';
    return this.analyticsService.getAcademicComplianceReport(slug, {
      departmentId: departmentId || branchCd,
      courseCd,
      batchId,
      semester,
      section,
      hodUserId,
    });
  }

  @Public()
  @Post('punch')
  async recordPunch(
    @Body() body: { punchType: 'IN' | 'OUT'; facultyId?: string; time?: string },
    @Tenant() tenantSlug?: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = tenantSlug || queryTenant || '';
    return this.analyticsService.recordPunch(body, slug);
  }
}
