import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FirmsService } from './firms.service';
import { LicensingService } from './licensing.service';
import { CreateFirmDto } from './dto/create-firm.dto';
import { UpdateFirmDto } from './dto/update-firm.dto';
import {
  GenerateLicenseKeyDto,
  ApplyLicenseKeyDto,
  RenewLicenseKeyDto,
} from './dto/license-key.dto';
import { CreateTransactionDto } from './dto/transaction.dto';
import { UpdateRolePermissionsDto } from './dto/role-permission.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { MenuRole } from '../database/entities/menu-registry.entity';
import * as crypto from 'crypto';

@Controller('firms')
export class FirmsController {
  constructor(
    private readonly firmsService: FirmsService,
    private readonly licensingService: LicensingService,
  ) {}

  /**
   * Status endpoint used by Next.js middleware
   * GET /api/firms/:slug/status
   */
  @Get(':slug/status')
  @Public()
  async getFirmStatus(@Param('slug') slug: string) {
    return await this.firmsService.getFirmStatusBySlug(slug);
  }

  @Get('status')
  @Public()
  async getFirmStatusByQuery(@Query('slug') slug: string, @Query('tenant') tenant: string) {
    const s = slug || tenant || 'srms-cet-bareilly';
    return await this.firmsService.getFirmStatusBySlug(s);
  }

  /**
   * Pre-signed / Direct upload URL for branding images (Logo, Cover, Banner)
   * POST /api/firms/upload-url
   */
  @Post('upload-url')
  @Public()
  async getUploadUrl(
    @Body()
    body: {
      file_name: string;
      file_type: string;
      upload_type: 'logo' | 'cover' | 'banner';
      file_size_bytes?: number;
    },
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(body.file_type)) {
      throw new BadRequestException(
        `Invalid file type '${body.file_type}'. Only JPEG, PNG, WEBP, and SVG images are allowed.`,
      );
    }

    const maxSizeBytes = body.upload_type === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (body.file_size_bytes && body.file_size_bytes > maxSizeBytes) {
      const limitMb = maxSizeBytes / (1024 * 1024);
      throw new BadRequestException(
        `File size exceeds limit of ${limitMb}MB for ${body.upload_type} upload.`,
      );
    }

    const ext = body.file_type.split('/')[1] === 'svg+xml' ? 'svg' : body.file_type.split('/')[1] || 'png';
    const uniqueKey = `firms/${body.upload_type}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const publicUrl = `/uploads/${uniqueKey}`;

    return {
      upload_url: `/api/files/direct-upload?key=${encodeURIComponent(uniqueKey)}`,
      public_url: publicUrl,
      file_key: uniqueKey,
      max_size_bytes: maxSizeBytes,
    };
  }

  /**
   * Create Firm (Steps 1–4)
   * POST /api/firms
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createFirm(@Body() dto: CreateFirmDto) {
    return await this.firmsService.createFirm(dto);
  }

  /**
   * List all registered firms
   * GET /api/firms
   */
  @Get()
  @Public()
  async findAll(@Query('public') isPublic?: string) {
    const shouldFilterPublic = isPublic === 'true' || isPublic === '1';
    return await this.firmsService.findAll(shouldFilterPublic);
  }

  /**
   * Fetch single firm detail
   * GET /api/firms/:id
   */
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.firmsService.findOne(id);
  }

  /**
   * Toggle firm active/suspended status
   * PATCH /api/firms/:id/toggle-active
   */
  @Patch(':id/toggle-active')
  @Public()
  async toggleActive(@Param('id') id: string) {
    return await this.firmsService.toggleActive(id);
  }

  /**
   * Update firm branding/identity/theme
   * PATCH /api/firms/:id
   */
  @Patch(':id')
  @Public()
  async updateFirm(@Param('id') id: string, @Body() dto: UpdateFirmDto) {
    return await this.firmsService.update(id, dto);
  }

  /**
   * Update firm branding/identity/theme
   * PUT /api/firms/:id
   */
  @Put(':id')
  @Public()
  async updateFirmPut(@Param('id') id: string, @Body() dto: UpdateFirmDto) {
    return await this.firmsService.update(id, dto);
  }

  /**
   * Fetch currently selected menus for this firm + role
   * GET /api/firms/:id/role-permissions?role=STUDENT
   */
  @Get(':id/role-permissions')
  @Public()
  async getFirmPermissions(
    @Param('id') id: string,
    @Query('role') role?: MenuRole,
  ) {
    return await this.firmsService.getFirmPermissions(id, role);
  }

  /**
   * Save selected menu_keys for a role
   * PUT /api/firms/:id/role-permissions
   */
  @Put(':id/role-permissions')
  @Public()
  async updateFirmPermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return await this.firmsService.updateFirmPermissions(id, dto);
  }

  /**
   * Generate License Key — returns plaintext key ONCE
   * POST /api/firms/:id/license-keys/generate
   */
  @Post(':id/license-keys/generate')
  @Public()
  async generateLicenseKey(
    @Param('id') id: string,
    @Body() dto: GenerateLicenseKeyDto,
  ) {
    return await this.licensingService.generateLicenseKey(id, dto);
  }

  /**
   * Apply License Key
   * POST /api/firms/:id/license-keys/apply
   */
  @Post(':id/license-keys/apply')
  @Public()
  async applyLicenseKey(
    @Param('id') id: string,
    @Body() dto: ApplyLicenseKeyDto,
  ) {
    return await this.licensingService.applyLicenseKey(id, dto);
  }

  /**
   * Renew License Key
   * POST /api/firms/:id/license-keys/renew
   */
  @Post(':id/license-keys/renew')
  @Public()
  async renewLicenseKey(
    @Param('id') id: string,
    @Body() dto: RenewLicenseKeyDto,
  ) {
    return await this.licensingService.renewLicenseKey(id, dto);
  }

  /**
   * License keys history (key_prefix only, never plaintext or hash)
   * GET /api/firms/:id/license-keys
   */
  @Get(':id/license-keys')
  @Public()
  async getFirmLicenseKeys(@Param('id') id: string) {
    return await this.licensingService.getFirmLicenseKeys(id);
  }

  /**
   * Get transaction and renewal receipt history
   * GET /api/firms/:id/transactions
   */
  @Get(':id/transactions')
  @Public()
  async getFirmTransactions(@Param('id') id: string) {
    return await this.licensingService.getFirmTransactions(id);
  }

  /**
   * Record transaction detail
   * POST /api/firms/:id/transactions
   */
  @Post(':id/transactions')
  @Public()
  async createTransaction(
    @Param('id') id: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return await this.licensingService.recordTransaction(id, dto);
  }

  /**
   * Update transaction details (duration days, amount, payment method, status, ref)
   * PATCH /api/firms/:id/transactions/:txId
   */
  @Patch(':id/transactions/:txId')
  @Public()
  async updateTransaction(
    @Param('id') id: string,
    @Param('txId') txId: string,
    @Body() dto: { duration_days?: number; amount?: number; payment_method?: string; status?: string; transaction_ref?: string },
  ) {
    return await this.licensingService.updateTransaction(id, txId, dto);
  }

  /**
   * Delete / Revoke License Key
   * DELETE /api/firms/:id/license-keys/:keyId
   */
  @Delete(':id/license-keys/:keyId')
  @Public()
  async deleteLicenseKey(
    @Param('id') id: string,
    @Param('keyId') keyId: string,
  ) {
    return await this.licensingService.deleteLicenseKey(id, keyId);
  }

  /**
   * Delete transaction receipt
   * DELETE /api/firms/:id/transactions/:txId
   */
  @Delete(':id/transactions/:txId')
  @Public()
  async deleteTransaction(
    @Param('id') id: string,
    @Param('txId') txId: string,
  ) {
    return await this.licensingService.deleteTransaction(id, txId);
  }

  /**
   * Provision or update Firm Admin credentials
   * POST /api/firms/:id/admins
   */
  @Post(':id/admins')
  @Public()
  async provisionAdmin(
    @Param('id') id: string,
    @Body() dto: { email: string; password: string; name?: string; phone?: string; username?: string },
  ) {
    return await this.firmsService.provisionAdmin(id, dto);
  }

  /**
   * Get all Admin accounts for firm
   * GET /api/firms/:id/admins
   */
  @Get(':id/admins')
  @Public()
  async getFirmAdmins(@Param('id') id: string) {
    return await this.firmsService.getFirmAdmins(id);
  }

  /**
   * Delete / De-register firm
   * DELETE /api/firms/:id
   */
  @Delete(':id')
  @Public()
  async deleteFirm(@Param('id') id: string) {
    return await this.firmsService.deleteFirm(id);
  }

  /**
   * Remove single permission menu right
   * DELETE /api/firms/:id/permissions/:role/:menuKey
   */
  @Delete(':id/permissions/:role/:menuKey')
  @Public()
  async deleteFirmPermission(
    @Param('id') id: string,
    @Param('role') role: MenuRole,
    @Param('menuKey') menuKey: string,
  ) {
    return await this.firmsService.deleteFirmPermission(id, role, menuKey);
  }
}
