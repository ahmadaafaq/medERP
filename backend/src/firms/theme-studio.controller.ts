import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ThemeStudioService } from './theme-studio.service';
import { FirmsService } from './firms.service';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class ThemeStudioController {
  constructor(
    private readonly themeStudioService: ThemeStudioService,
    private readonly firmsService: FirmsService,
  ) {}

  /**
   * Load draft, published theme, and version history for owner
   * GET /api/v1/owner/theme-studio/:tenantId
   */
  @Get('owner/theme-studio/:tenantId')
  @Public()
  async getThemeStudioData(@Param('tenantId') tenantId: string) {
    return await this.themeStudioService.getThemeStudioData(tenantId);
  }

  /**
   * Autosave draft
   * PUT /api/v1/owner/theme-studio/:tenantId/draft
   */
  @Put('owner/theme-studio/:tenantId/draft')
  @Public()
  async saveDraft(
    @Param('tenantId') tenantId: string,
    @Body() body: { draft_config: any; updated_by?: string },
  ) {
    return await this.themeStudioService.saveDraft(
      tenantId,
      body.draft_config || body,
      body.updated_by || 'OWNER',
    );
  }

  /**
   * Publish theme live for tenant
   * POST /api/v1/owner/theme-studio/:tenantId/publish
   */
  @Post('owner/theme-studio/:tenantId/publish')
  @Public()
  async publishTheme(
    @Param('tenantId') tenantId: string,
    @Body() body: { theme_config: any; published_by?: string; notes?: string },
  ) {
    return await this.themeStudioService.publishTheme(
      tenantId,
      body.theme_config || body,
      body.published_by || 'OWNER',
      body.notes,
    );
  }

  /**
   * Rollback to specific version
   * POST /api/v1/owner/theme-studio/:tenantId/revert/:version
   */
  @Post('owner/theme-studio/:tenantId/revert/:version')
  @Public()
  async revertToVersion(
    @Param('tenantId') tenantId: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() body: { reverted_by?: string },
  ) {
    return await this.themeStudioService.revertToVersion(
      tenantId,
      version,
      body?.reverted_by || 'OWNER',
    );
  }

  /**
   * Public-facing read endpoint used by the actual tenant app to fetch the live published theme
   * GET /api/v1/tenants/:tenantId/theme/active
   */
  @Get('tenants/:tenantId/theme/active')
  @Public()
  async getActiveTenantTheme(@Param('tenantId') tenantId: string) {
    return await this.firmsService.getTenantTheme(tenantId);
  }
}
