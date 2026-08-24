import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ChatService } from './chat.service';
import { SendMessageDto, ChatGroupFilterDto } from './dto/chat.dto';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Chat & Communication')
@ApiBearerAuth()
@Public()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private extractUser(req: any, dto?: any): any {
    if (req.user && req.user.name && req.user.role) {
      return req.user;
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

    const headerId = dto?.sender_id || req.headers?.['x-user-id'] || tokenUser?.sub || tokenUser?.id || '2025107990';
    const headerName = dto?.sender_name || req.headers?.['x-user-name'] || tokenUser?.name || tokenUser?.username || 'AAFREEN KHAN';
    const headerRole = (dto?.sender_role || req.headers?.['x-user-role'] || tokenUser?.role || 'STUDENT').toUpperCase();
    const headerAvatar = dto?.sender_avatar || req.headers?.['x-user-avatar'] || tokenUser?.photo_url || null;

    return {
      id: String(headerId),
      name: String(headerName),
      role: String(headerRole),
      photo_url: headerAvatar,
    };
  }

  @Get('groups')
  @ApiOperation({ summary: 'List chat groups scoped by role and user membership' })
  async getGroups(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Query() filters: ChatGroupFilterDto,
  ) {
    const user = this.extractUser(req);
    const data = await this.chatService.getGroups(tenantSlug, user, filters);
    return { success: true, data };
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get single chat group details' })
  async getGroupById(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const user = this.extractUser(req);
    const data = await this.chatService.getGroupById(tenantSlug, user, id);
    return { success: true, data };
  }

  @Get('groups/:id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a group' })
  async getMessages(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const user = this.extractUser(req);
    const data = await this.chatService.getMessages(tenantSlug, user, id, {
      limit: limit ? parseInt(limit, 10) : 50,
      before,
    });
    return { success: true, data };
  }

  @Post('groups/:id/messages')
  @ApiOperation({ summary: 'Send a message (text and/or attachments) to a group' })
  async sendMessage(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const user = this.extractUser(req, dto);
    const data = await this.chatService.sendMessage(tenantSlug, user, id, dto);
    return { success: true, data };
  }

  @Patch('groups/:id/read')
  @ApiOperation({ summary: 'Mark group as read' })
  async markAsRead(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Param('id') id: string,
    @Body('lastMessageId') lastMessageId?: string,
  ) {
    const user = this.extractUser(req);
    const data = await this.chatService.markAsRead(tenantSlug, user, id, lastMessageId);
    return { success: true, data };
  }

  @Get('groups/:id/members')
  @ApiOperation({ summary: 'Get group members roster' })
  async getGroupMembers(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const user = this.extractUser(req);
    const data = await this.chatService.getGroupMembers(tenantSlug, user, id);
    return { success: true, data };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread messages count for logged-in user' })
  async getUnreadCount(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
  ) {
    const user = this.extractUser(req);
    const data = await this.chatService.getUnreadCount(tenantSlug, user);
    return { success: true, data };
  }

  @Post('attachments/upload')
  @ApiOperation({ summary: 'Upload attachment file (max 15MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @TenantSlug() tenantSlug: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const data = await this.chatService.saveAttachmentFile(tenantSlug, file);
    return { success: true, data };
  }

  @Public()
  @Get('attachments/file/:slug/:filename')
  @ApiOperation({ summary: 'Stream/download uploaded chat file' })
  async serveAttachmentFile(
    @Param('slug') slug: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const cleanFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'uploads', 'chat', slug, cleanFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = path.extname(cleanFilename).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.doc') mimeType = 'application/msword';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.ppt') mimeType = 'application/vnd.ms-powerpoint';
    else if (ext === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    res.setHeader('Content-Type', mimeType);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Get('selection-options')
  @ApiOperation({ summary: 'Get available courses, departments, and batches for selection' })
  async getSelectionOptions(
    @TenantSlug() tenantSlug: string,
  ) {
    const data = await this.chatService.getAvailableSelectionOptions(tenantSlug);
    return { success: true, data };
  }

  @Post('join-batch')
  @ApiOperation({ summary: 'Add/pin a Course + Department + Batch group to my discussions list' })
  async joinBatch(
    @TenantSlug() tenantSlug: string,
    @Req() req: any,
    @Body() dto: any,
  ) {
    const user = req.user || { role: 'FACULTY', id: 'FAC001', name: 'Faculty User' };
    const data = await this.chatService.joinBatchGroup(tenantSlug, user, dto);
    return { success: true, data };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync/auto-provision batch chat groups from department & batch masters' })
  async syncGroups(
    @TenantSlug() tenantSlug: string,
  ) {
    const data = await this.chatService.syncGroupsAndMembers(tenantSlug);
    return { success: true, message: 'Chat groups synchronized successfully', data };
  }
}
