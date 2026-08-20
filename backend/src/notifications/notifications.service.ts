import { Injectable, Logger } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';

export interface CreateNotificationDto {
  recipient_id: string; // 'ADMIN', 'ALL_STUDENTS', 'ALL_FACULTY', or student registration_no / user_id
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'deadline';
  category?: 'all' | 'announcements' | 'deadlines';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  /**
   * Fetch notifications for current user context
   */
  async getNotifications(tenantSlug: string, user: any, category?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const regNo = user?.registration_no || user?.username || user?.rollno || user?.sub || '';
    const userId = user?.sub || user?.id || '';
    const role = user?.role || 'STUDENT';

    const params: any[] = [];
    const recipientConditions: string[] = ["n.recipient_id = 'ALL'"];

    if (role === 'ADMIN') {
      recipientConditions.push("n.recipient_id = 'ADMIN'");
      recipientConditions.push("n.recipient_id = 'ALL_ADMINS'");
    }

    if (role === 'STUDENT') {
      recipientConditions.push("n.recipient_id = 'ALL_STUDENTS'");
    }

    if (role === 'FACULTY') {
      recipientConditions.push("n.recipient_id = 'ALL_FACULTY'");
    }

    if (regNo) {
      params.push(regNo);
      recipientConditions.push(`n.recipient_id = $${params.length}`);
    }

    if (userId && userId !== regNo) {
      params.push(userId);
      recipientConditions.push(`n.recipient_id = $${params.length}`);
    }

    let categoryFilter = '';
    if (category && category !== 'all') {
      if (category === 'announcements') {
        categoryFilter = `AND (n.type = 'announcement' OR n.type = 'info' OR n.type = 'success')`;
      } else if (category === 'deadlines') {
        categoryFilter = `AND (n.type = 'deadline' OR n.type = 'warning' OR n.title ILIKE '%deadline%')`;
      }
    }

    const sql = `
      SELECT n.*
      FROM "${schema}".notifications n
      WHERE (${recipientConditions.join(' OR ')})
      ${categoryFilter}
      ORDER BY n.created_at DESC
      LIMIT 100
    `;

    const notifications = await this.tenantSchemaService.queryInTenant(slug, sql, params).catch(() => []);

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    return {
      notifications,
      count: notifications.length,
      unreadCount,
    };
  }

  /**
   * Mark notification(s) as read
   */
  async markAsRead(tenantSlug: string, user: any, notificationId?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const regNo = user?.registration_no || user?.username || user?.rollno || user?.sub || '';
    const role = user?.role || 'STUDENT';

    if (notificationId) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE "${schema}".notifications SET is_read = true WHERE id = $1`,
        [notificationId],
      );
    } else {
      // Mark all read for recipient
      let updateSql = `UPDATE "${schema}".notifications SET is_read = true WHERE is_read = false AND (recipient_id = 'ALL'`;
      const params: any[] = [];

      if (role === 'ADMIN') {
        updateSql += ` OR recipient_id = 'ADMIN' OR recipient_id = 'ALL_ADMINS'`;
      }
      if (role === 'STUDENT') {
        updateSql += ` OR recipient_id = 'ALL_STUDENTS'`;
      }
      if (role === 'FACULTY') {
        updateSql += ` OR recipient_id = 'ALL_FACULTY'`;
      }
      if (regNo) {
        params.push(regNo);
        updateSql += ` OR recipient_id = $${params.length}`;
      }
      updateSql += `)`;

      await this.tenantSchemaService.queryInTenant(slug, updateSql, params).catch(() => null);
    }

    return { success: true, message: 'Notifications marked as read' };
  }

  /**
   * Create & Dispatch Notification
   */
  async sendNotification(tenantSlug: string, dto: CreateNotificationDto) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const sql = `
      INSERT INTO "${schema}".notifications (
        recipient_id, title, message, type, is_read, created_at
      ) VALUES (
        $1, $2, $3, $4, false, NOW()
      )
      RETURNING *
    `;

    const res = await this.tenantSchemaService.queryInTenant(slug, sql, [
      dto.recipient_id,
      dto.title,
      dto.message,
      dto.type || 'info',
    ]);

    return {
      message: 'Notification sent successfully',
      notification: res[0],
    };
  }
}
