import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  UseInterceptors,
  UploadedFile,
  Request, 
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlacementDriveService } from './placement-drive.service';
import { 
  CreatePlacementDriveDto, 
  ApplyPlacementDriveDto, 
  UpdateApplicantStatusDto, 
  PlacementReportQueryDto,
  ConfirmImportDriveDto,
  RespondOfferDto
} from './dto/placement-drive.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { TenantSlug } from '../common/decorators/tenant.decorator';

@Controller('placement-drive')
@UseGuards(JwtAuthGuard)
export class PlacementDriveController {
  constructor(private readonly placementDriveService: PlacementDriveService) {}

  private extractUser(req: any, dto?: any): any {
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
      dto?.student_reg_no ||
      req.headers?.['x-user-reg-no'] ||
      req.headers?.['x-user-id'] ||
      tokenUser?.registration_no ||
      tokenUser?.username ||
      tokenUser?.rollno ||
      '2025107990';
    const role = (dto?.role || req.headers?.['x-user-role'] || tokenUser?.role || 'STUDENT').toUpperCase();
    const name = dto?.student_name || req.headers?.['x-user-name'] || tokenUser?.name || 'AAFREEN KHAN';

    return {
      id: tokenUser?.id || tokenUser?.sub || regNo,
      registration_no: regNo,
      username: regNo,
      rollno: regNo,
      role,
      name,
    };
  }

  @Public()
  @Post('import-preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewExcelImport(
    @TenantSlug() tenantSlug: string,
    @UploadedFile() file: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please provide a valid Excel file (.xlsx or .xls).');
    }
    return this.placementDriveService.previewExcelImport(tenantSlug, file.buffer, file.originalname);
  }

  @Public()
  @Post('import-confirm')
  async confirmExcelImport(
    @TenantSlug() tenantSlug: string,
    @Body() dto: ConfirmImportDriveDto,
    @Request() req: any,
  ) {
    const user = this.extractUser(req, dto);
    return this.placementDriveService.confirmExcelImport(tenantSlug, dto, user);
  }

  @Public()
  @Get('student/offers')
  async getStudentOffers(
    @TenantSlug() tenantSlug: string,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.placementDriveService.getStudentOffers(tenantSlug, user);
  }

  @Public()
  @Patch('offers/:appId/respond')
  async respondToOffer(
    @TenantSlug() tenantSlug: string,
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: RespondOfferDto,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.placementDriveService.respondToOffer(tenantSlug, appId, dto, user);
  }

  @Public()
  @Get('export')
  async exportPlacementData(
    @TenantSlug() tenantSlug: string,
    @Query('drive_id') driveId?: string,
    @Query('status') status?: string,
    @Query('company_name') companyName?: string,
  ) {
    return this.placementDriveService.exportPlacementData(tenantSlug, {
      drive_id: driveId ? parseInt(driveId, 10) : undefined,
      status,
      company_name: companyName,
    });
  }

  @Public()
  @Post('create')
  async createPlacementDrive(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreatePlacementDriveDto,
    @Request() req: any,
  ) {
    const user = this.extractUser(req, dto);
    return this.placementDriveService.createPlacementDrive(tenantSlug, dto, user);
  }

  @Public()
  @Get('list')
  async listPlacementDrives(
    @TenantSlug() tenantSlug: string,
    @Query('status') status: string,
    @Query('tenant') queryTenant: string,
    @Request() req: any,
  ) {
    const slug = queryTenant || tenantSlug;
    const user = this.extractUser(req);
    return this.placementDriveService.listPlacementDrives(slug, user, status);
  }

  @Public()
  @Get('dashboard/summary')
  async getDashboardSummary(
    @TenantSlug() tenantSlug: string,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.placementDriveService.getDashboardSummary(tenantSlug, user);
  }

  @Public()
  @Get('reports/student-placement-status')
  async getPlacementStatusReports(
    @TenantSlug() tenantSlug: string,
    @Query() query: PlacementReportQueryDto,
  ) {
    const slug = query?.tenant || tenantSlug;
    return this.placementDriveService.getPlacementStatusReports(slug, query);
  }

  @Public()
  @Get(':id')
  async getPlacementDriveById(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.placementDriveService.getPlacementDriveById(tenantSlug, id);
  }

  @Public()
  @Get(':id/nominated-projects')
  async getNominatedProjectsForDrive(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.placementDriveService.getNominatedProjectsForDrive(tenantSlug, id);
  }

  @Public()
  @Post('apply')
  async applyToPlacementDrive(
    @TenantSlug() tenantSlug: string,
    @Body() dto: ApplyPlacementDriveDto,
    @Request() req: any,
  ) {
    const user = this.extractUser(req, dto);
    return this.placementDriveService.applyToPlacementDrive(tenantSlug, dto, user);
  }

  @Public()
  @Patch('shortlist')
  async updateApplicantStatus(
    @TenantSlug() tenantSlug: string,
    @Body() dto: UpdateApplicantStatusDto,
  ) {
    return this.placementDriveService.updateApplicantStatus(tenantSlug, dto);
  }
}
