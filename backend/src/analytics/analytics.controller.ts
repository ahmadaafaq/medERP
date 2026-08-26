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
