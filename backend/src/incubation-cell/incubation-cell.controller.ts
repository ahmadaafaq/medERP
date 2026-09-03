import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { IncubationCellService } from './incubation-cell.service';
import { QueryIncubationProjectsDto, UpdateIncubationStatusDto } from './dto/incubation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { TenantSlug } from '../common/decorators/tenant.decorator';

@Controller('incubation-cell')
@UseGuards(JwtAuthGuard)
export class IncubationCellController {
  constructor(private readonly incubationService: IncubationCellService) {}

  private extractUser(req: any): any {
    if (req.user && req.user.role) return req.user;
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let tokenUser: any = null;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          tokenUser = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        }
      } catch {}
    }

    const regNo =
      req.headers?.['x-user-reg-no'] ||
      req.headers?.['x-user-id'] ||
      tokenUser?.registration_no ||
      tokenUser?.username ||
      'ADMIN001';
    const role = (req.headers?.['x-user-role'] || tokenUser?.role || 'ADMIN').toUpperCase();
    const name = req.headers?.['x-user-name'] || tokenUser?.name || 'Administrator';

    return {
      id: tokenUser?.id || tokenUser?.sub,
      registration_no: regNo,
      role,
      name,
    };
  }

  @Public()
  @Get('meta')
  async getHierarchyMeta(
    @TenantSlug() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    return this.incubationService.getHierarchyMeta(slug);
  }

  @Public()
  @Get('projects')
  async getIncubationProjects(
    @TenantSlug() tenantSlug: string,
    @Query() query: QueryIncubationProjectsDto,
  ) {
    const slug = query.tenant || tenantSlug;
    return this.incubationService.getIncubationProjects(slug, query);
  }

  @Public()
  @Patch('projects/:id/status')
  async updateIncubationStatus(
    @TenantSlug() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncubationStatusDto,
    @Request() req: any,
  ) {
    const slug = dto.tenant || tenantSlug;
    const user = this.extractUser(req);
    return this.incubationService.updateIncubationStatus(slug, id, dto, user);
  }
}
