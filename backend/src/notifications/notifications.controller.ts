import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('list')
  async getNotifications(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Query('category') category: string,
    @Request() req: any,
  ) {
    return this.notificationsService.getNotifications(tenantSlug, req.user, category);
  }

  @Patch('mark-read')
  async markAsRead(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Body('notification_id') notificationId: string,
    @Request() req: any,
  ) {
    return this.notificationsService.markAsRead(tenantSlug, req.user, notificationId);
  }

  @Post('send')
  async sendNotification(
    @Headers('x-tenant-slug') tenantSlug: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.sendNotification(tenantSlug, dto);
  }
}
