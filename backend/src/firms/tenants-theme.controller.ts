import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FirmsService } from './firms.service';
import { UpdateTenantThemeDto } from './dto/tenant-theme.dto';
import { Public } from '../common/decorators/public.decorator';
import * as crypto from 'crypto';

@Controller('tenants')
export class TenantsThemeController {
  constructor(private readonly firmsService: FirmsService) {}

  /**
   * Fetch active theme for a specific tenant by ID or slug
   * GET /api/v1/tenants/:tenantId/theme
   */
  @Get(':tenantId/theme')
  @Public()
  async getTenantTheme(@Param('tenantId') tenantId: string) {
    return await this.firmsService.getTenantTheme(tenantId);
  }

  /**
   * Query-based theme lookup (pre-auth login resolver)
   * GET /api/v1/tenants/theme?tenant=srms-cet-bareilly
   */
  @Get('theme/resolve')
  @Public()
  async resolveTheme(@Query('tenant') tenantSlug?: string) {
    return await this.firmsService.getTenantTheme(tenantSlug || 'srms-cet-bareilly');
  }

  /**
   * Update/Upsert tenant theme (Owner Only)
   * PUT /api/v1/tenants/:tenantId/theme
   */
  @Put(':tenantId/theme')
  @Public()
  async updateTenantTheme(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantThemeDto,
  ) {
    return await this.firmsService.updateTenantTheme(tenantId, dto, dto.updated_by || 'OWNER');
  }

  /**
   * Direct Upload Endpoint for Tenant Logo
   * POST /api/v1/tenants/:tenantId/theme/logo
   */
  @Post(':tenantId/theme/logo')
  @Public()
  async uploadTenantLogo(
    @Param('tenantId') tenantId: string,
    @Body() body: { file_name?: string; file_type?: string; base64_data?: string; image_url?: string },
  ) {
    let logoUrl = body.image_url;
    if (body.base64_data) {
      logoUrl = body.base64_data;
    }
    if (!logoUrl) {
      throw new BadRequestException('Image data or URL is required');
    }

    return await this.firmsService.updateTenantTheme(tenantId, { logo_url: logoUrl }, 'OWNER');
  }

  /**
   * Direct Upload Endpoint for Tenant Favicon
   * POST /api/v1/tenants/:tenantId/theme/favicon
   */
  @Post(':tenantId/theme/favicon')
  @Public()
  async uploadTenantFavicon(
    @Param('tenantId') tenantId: string,
    @Body() body: { file_name?: string; file_type?: string; base64_data?: string; favicon_url?: string },
  ) {
    let faviconUrl = body.favicon_url;
    if (body.base64_data) {
      faviconUrl = body.base64_data;
    }
    if (!faviconUrl) {
      throw new BadRequestException('Favicon data or URL is required');
    }

    return await this.firmsService.updateTenantTheme(tenantId, { favicon_url: faviconUrl }, 'OWNER');
  }
}
