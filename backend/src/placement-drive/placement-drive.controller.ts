import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  Headers, 
  UseGuards, 
  Request, 
  ParseIntPipe 
} from '@nestjs/common';
import { PlacementDriveService } from './placement-drive.service';
import { 
  CreatePlacementDriveDto, 
  ApplyPlacementDriveDto, 
  UpdateApplicantStatusDto, 
  PlacementReportQueryDto 
} from './dto/placement-drive.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('placement-drive')
@UseGuards(JwtAuthGuard)
export class PlacementDriveController {
  constructor(private readonly placementDriveService: PlacementDriveService) {}

  @Post('create')
  async createPlacementDrive(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Body() dto: CreatePlacementDriveDto,
    @Request() req: any,
  ) {
    return this.placementDriveService.createPlacementDrive(tenantSlug, dto, req.user);
  }

  @Get('list')
  async listPlacementDrives(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    return this.placementDriveService.listPlacementDrives(tenantSlug, req.user, status);
  }

  @Get('dashboard/summary')
  async getDashboardSummary(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Request() req: any,
  ) {
    return this.placementDriveService.getDashboardSummary(tenantSlug, req.user);
  }

  @Get('reports/student-placement-status')
  async getPlacementStatusReports(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Query() query: PlacementReportQueryDto,
  ) {
    return this.placementDriveService.getPlacementStatusReports(tenantSlug, query);
  }

  @Get(':id')
  async getPlacementDriveById(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.placementDriveService.getPlacementDriveById(tenantSlug, id);
  }

  @Get(':id/nominated-projects')
  async getNominatedProjectsForDrive(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.placementDriveService.getNominatedProjectsForDrive(tenantSlug, id);
  }

  @Post('apply')
  async applyToPlacementDrive(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Body() dto: ApplyPlacementDriveDto,
    @Request() req: any,
  ) {
    return this.placementDriveService.applyToPlacementDrive(tenantSlug, dto, req.user);
  }

  @Patch('shortlist')
  async updateApplicantStatus(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Body() dto: UpdateApplicantStatusDto,
  ) {
    return this.placementDriveService.updateApplicantStatus(tenantSlug, dto);
  }
}
