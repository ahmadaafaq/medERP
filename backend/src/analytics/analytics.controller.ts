import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/college')
  async getCollegeKpis(
    @Query('tenant') queryTenant?: string,
    @Tenant() tenantSlug?: string,
  ) {
    const slug = queryTenant || tenantSlug || 'srms-cet-bareilly';
    return this.analyticsService.getCollegeKpis(slug);
  }

  @Post('punch')
  async recordPunch(
    @Body() body: { punchType: 'IN' | 'OUT'; facultyId?: string; time?: string },
    @Query('tenant') queryTenant?: string,
    @Tenant() tenantSlug?: string,
  ) {
    const slug = queryTenant || tenantSlug || 'srms-cet-bareilly';
    return this.analyticsService.recordPunch(body, slug);
  }
}
