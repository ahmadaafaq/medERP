import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums/role.enum';
import { Tenant } from '../common/decorators/tenant.decorator';
import { NoticesService } from './notices.service';
import {
  CreateNoticeDto,
  UpdateNoticeDto,
  PreviewRecipientsDto,
  CreateNoticeGroupDto,
  UpdateNoticeGroupDto,
  NoticeFilterDto,
} from './dto/notice.dto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'notices');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'];

@ApiTags('Notices & Circulars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // FILE UPLOAD (Attachments)
  // ──────────────────────────────────────────────────────────────────────────
  @Post('notices/upload')
  @ApiOperation({ summary: 'Upload notice attachments (PDF, Excel, Doc, Image - Max 10MB each)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
          const uniqueName = `${Date.now()}_${cleanName}${ext}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Unsupported file format (${ext}). Allowed: PDF, Excel, Word, Images (PNG/JPG/WEBP)`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 25 * 1024 * 1024) {
      throw new BadRequestException('Total attachment size exceeds maximum allowed limit of 25MB');
    }

    const uploaded = files.map((file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      let fileType = 'other';
      if (ext === '.pdf') fileType = 'pdf';
      else if (ext === '.xlsx' || ext === '.xls') fileType = 'xlsx';
      else if (ext === '.docx' || ext === '.doc') fileType = 'docx';
      else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) fileType = 'image';

      return {
        file_name: file.originalname,
        file_type: fileType,
        file_url: `/uploads/notices/${file.filename}`,
        file_size_kb: Math.round(file.size / 1024),
      };
    });

    return {
      success: true,
      data: uploaded,
      message: `${files.length} attachment(s) uploaded successfully`,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN NOTICE ENDPOINTS
  // ──────────────────────────────────────────────────────────────────────────
  @Post('admin/notices')
  @ApiOperation({ summary: 'Compose and send a new targeted notice' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN, UserRole.CLERK)
  async createNotice(
    @Body() dto: CreateNoticeDto,
    @Req() req: any,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const userId = req.user?.sub || req.user?.id;
    const data = await this.noticesService.createNotice(dto, userId, slug);
    return { success: true, data, message: 'Notice sent successfully' };
  }

  @Public()
  @Get('admin/notices')
  @ApiOperation({ summary: 'List notices composed by admin with reach and read analytics' })
  async listAdminNotices(
    @Query() filter: NoticeFilterDto,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const data = await this.noticesService.listAdminNotices(filter, slug);
    return { success: true, data };
  }

  @Public()
  @Post('admin/notices/preview-recipients')
  @ApiOperation({ summary: 'Preview live recipient count for audience targeting rules' })
  async previewRecipients(
    @Body() dto: PreviewRecipientsDto,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const data = await this.noticesService.previewRecipients(dto.targets, slug);
    return { success: true, data };
  }

  @Public()
  @Get('admin/notices/:id/read-report')
  @ApiOperation({ summary: 'Get detailed per-recipient read receipt report for a notice' })
  async getReadReport(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Tenant() tenantSlug?: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const data = await this.noticesService.getAdminNoticeReadReport(id, search, role, slug);
    return { success: true, data };
  }

  @Public()
  @Get('admin/notices/:id')
  @ApiOperation({ summary: 'Get admin notice detail' })
  async getAdminNotice(
    @Param('id') id: string,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const data = await this.noticesService.getNoticeById(id, undefined, slug);
    return { success: true, data };
  }

  @Public()
  @Delete('admin/notices/:id')
  @ApiOperation({ summary: 'Delete a notice' })
  async deleteNotice(
    @Param('id') id: string,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    return this.noticesService.deleteNotice(id, slug);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NOTICE GROUPS (TEMPLATES) CRUD
  // ──────────────────────────────────────────────────────────────────────────
  @Get('admin/notice-groups')
  @ApiOperation({ summary: 'List saved target group templates' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN, UserRole.CLERK)
  async listNoticeGroups(
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const data = await this.noticesService.listNoticeGroups(slug);
    return { success: true, data };
  }

  @Post('admin/notice-groups')
  @ApiOperation({ summary: 'Save a reusable target audience template' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN, UserRole.CLERK)
  async createNoticeGroup(
    @Body() dto: CreateNoticeGroupDto,
    @Req() req: any,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const userId = req.user?.sub || req.user?.id;
    const data = await this.noticesService.createNoticeGroup(dto, userId, slug);
    return { success: true, data, message: 'Notice group template saved successfully' };
  }

  @Put('admin/notice-groups/:id')
  @ApiOperation({ summary: 'Update a saved target audience template' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN, UserRole.CLERK)
  async updateNoticeGroup(
    @Param('id') id: string,
    @Body() dto: UpdateNoticeGroupDto,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const data = await this.noticesService.updateNoticeGroup(id, dto, slug);
    return { success: true, data, message: 'Notice group template updated successfully' };
  }

  @Delete('admin/notice-groups/:id')
  @ApiOperation({ summary: 'Delete a saved target audience template' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN, UserRole.CLERK)
  async deleteNoticeGroup(
    @Param('id') id: string,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    return this.noticesService.deleteNoticeGroup(id, slug);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RECIPIENT NOTICES (Role-Scoped for Current Logged-In User)
  // ──────────────────────────────────────────────────────────────────────────
  private extractRecipientUser(req: any): { userId?: string; userRole: string } {
    if (req.user && req.user.role) {
      return {
        userId: req.user.sub || req.user.id || req.user.userId,
        userRole: (req.user.role || '').toUpperCase(),
      };
    }

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

    const userId =
      req.headers?.['x-user-id'] ||
      req.headers?.['x-user-reg-no'] ||
      tokenUser?.id ||
      tokenUser?.sub ||
      tokenUser?.registration_no;

    const userRole = (
      req.headers?.['x-user-role'] ||
      req.query?.role ||
      tokenUser?.role ||
      'STUDENT'
    ).toUpperCase();

    return { userId, userRole };
  }

  @Public()
  @Get('notices')
  @ApiOperation({ summary: 'Get notices targeted to the logged-in user' })
  async getMyNotices(
    @Req() req: any,
    @Query() filter: NoticeFilterDto,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const { userId, userRole } = this.extractRecipientUser(req);
    const data = await this.noticesService.getRoleScopedNotices(userId, userRole, filter, slug);
    return { success: true, data };
  }

  @Public()
  @Get('notices/unread-count')
  @ApiOperation({ summary: 'Get unread notice badge counts for logged-in user' })
  async getUnreadCount(
    @Req() req: any,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const { userId, userRole } = this.extractRecipientUser(req);
    const data = await this.noticesService.getUnreadCount(userId, userRole, slug);
    return { success: true, data };
  }

  @Public()
  @Get('notices/:id')
  @ApiOperation({ summary: 'Get full notice detail and mark as read' })
  async getNoticeDetail(
    @Param('id') id: string,
    @Req() req: any,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const { userId } = this.extractRecipientUser(req);
    const data = await this.noticesService.getNoticeById(id, userId, slug);
    return { success: true, data };
  }

  @Public()
  @Patch('notices/:id/read')
  @ApiOperation({ summary: 'Mark notice as read for current user' })
  async markRead(
    @Param('id') id: string,
    @Req() req: any,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const { userId } = this.extractRecipientUser(req);
    return this.noticesService.markAsRead(id, userId || '', slug);
  }

  @Public()
  @Patch('notices/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge circular receipt' })
  async acknowledge(
    @Param('id') id: string,
    @Req() req: any,
    @Tenant() tenantSlug: string,
    @Query('tenant') queryTenant?: string,
  ) {
    const slug = queryTenant || tenantSlug;
    const { userId } = this.extractRecipientUser(req);
    return this.noticesService.acknowledgeNotice(id, userId || '', slug);
  }
}
