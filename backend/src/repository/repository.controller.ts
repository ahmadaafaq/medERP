import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Headers, 
  UseGuards, 
  Request, 
  ParseIntPipe 
} from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { CreateRepositoryDto, ReviewRepositoryDto, QueryRepositoryDto } from './dto/repository.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('repository')
@UseGuards(JwtAuthGuard)
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Public()
  @Post('submit')
  async submitRepository(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Body() dto: CreateRepositoryDto,
    @Request() req: any,
  ) {
    return this.repositoryService.submitRepository(tenantSlug, dto, req.user);
  }

  @Public()
  @Get('list')
  async listRepositories(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Query() query: QueryRepositoryDto,
    @Request() req: any,
  ) {
    return this.repositoryService.listRepositories(tenantSlug, query, req.user);
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

  @Get(':id')
  async getRepositoryById(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.repositoryService.getRepositoryById(tenantSlug, id);
  }

  @Post(':id/review')
  async reviewRepository(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewRepositoryDto,
    @Request() req: any,
  ) {
    return this.repositoryService.reviewRepository(tenantSlug, id, dto, req.user);
  }
}
