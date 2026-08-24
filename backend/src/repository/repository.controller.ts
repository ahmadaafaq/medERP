import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Patch, 
  Body, 
  Param, 
  Query, 
  Headers, 
  UseGuards, 
  Request, 
  ParseIntPipe 
} from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { CreateRepositoryDto, UpdateRepositoryDto, ReviewRepositoryDto, QueryRepositoryDto } from './dto/repository.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { TenantSlug } from '../common/decorators/tenant.decorator';

@Controller('repository')
@UseGuards(JwtAuthGuard)
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

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
      tokenUser?.rollno ||
      '2025107990';
    const role = (req.headers?.['x-user-role'] || tokenUser?.role || 'STUDENT').toUpperCase();
    const name = req.headers?.['x-user-name'] || tokenUser?.name || 'AAFREEN KHAN';

    return {
      id: tokenUser?.id || tokenUser?.sub,
      registration_no: regNo,
      username: regNo,
      rollno: regNo,
      role,
      name,
    };
  }

  @Public()
  @Post('submit')
  async submitRepository(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateRepositoryDto,
    @Request() req: any,
  ) {
    const slug = dto?.tenant || tenantSlug;
    const user = this.extractUser(req);
    return this.repositoryService.submitRepository(slug, dto, user);
  }

  @Public()
  @Put(':id')
  async updateRepositoryPut(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepositoryDto,
    @Request() req: any,
  ) {
    const slug = dto?.tenant || tenantSlug;
    const user = this.extractUser(req);
    return this.repositoryService.updateRepository(slug, id, dto, user);
  }

  @Public()
  @Patch(':id')
  async updateRepositoryPatch(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepositoryDto,
    @Request() req: any,
  ) {
    const slug = dto?.tenant || tenantSlug;
    const user = this.extractUser(req);
    return this.repositoryService.updateRepository(slug, id, dto, user);
  }

  @Public()
  @Get('list')
  async listRepositories(
    @TenantSlug() tenantSlug: string,
    @Query() query: QueryRepositoryDto,
    @Request() req: any,
  ) {
    const slug = query?.tenant || tenantSlug;
    const user = this.extractUser(req);
    return this.repositoryService.listRepositories(slug, query, user);
  }

  @Get('dashboard/top-rated')
  async getTopRatedProjects(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Query('limit') limit?: number,
  ) {
    return this.repositoryService.getTopRatedProjects(tenantSlug, limit ? Number(limit) : 5);
  }

  @Get('dashboard/pending-count')
  async getFacultyPendingReviewCount(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Request() req: any,
  ) {
    return this.repositoryService.getFacultyPendingReviewCount(tenantSlug, req.user);
  }

  @Public()
  @Get(':id')
  async getRepositoryById(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.repositoryService.getRepositoryById(tenantSlug, id);
  }

  @Public()
  @Post(':id/review')
  async reviewRepository(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewRepositoryDto,
    @Request() req: any,
  ) {
    const slug = dto?.tenant || req.headers?.['x-tenant-slug'] || req.headers?.['x-tenant'] || tenantSlug;
    const user = this.extractUser(req);
    return this.repositoryService.reviewRepository(slug, id, dto, user);
  }
}
