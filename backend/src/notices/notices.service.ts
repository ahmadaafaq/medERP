import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  CreateNoticeDto,
  UpdateNoticeDto,
  NoticeTargetRuleDto,
  TargetType,
  CreateNoticeGroupDto,
  UpdateNoticeGroupDto,
  NoticeFilterDto,
} from './dto/notice.dto';

@Injectable()
export class NoticesService {
  private readonly logger = new Logger(NoticesService.name);

  constructor(
    private readonly tenantSchemaService: TenantSchemaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CREATE NOTICE & RECIPIENT FAN-OUT
  // ──────────────────────────────────────────────────────────────────────────
  async createNotice(dto: CreateNoticeDto, creatorUserId: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    if (!dto.targets || dto.targets.length === 0) {
      throw new BadRequestException('At least one target audience rule is required');
    }

    // 1. Fetch creator info
    const creatorRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT u.id, u.email, u.role,
              s.name AS student_name,
              f.name AS faculty_name, f.designation
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN faculty f ON f.user_id = u.id
       WHERE u.id = $1`,
      [creatorUserId],
    );

    const creator = creatorRows[0];
    let creatorName = 'Administration Office';
    let creatorRole = 'Admin';
    if (creator) {
      creatorName = creator.faculty_name || creator.student_name || creator.email?.split('@')[0] || 'Admin';
      creatorRole = creator.designation || creator.role || 'Admin';
    }

    // 2. Insert Notice record
    const noticeRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO notices (
        college_id, title, body, priority, category,
        created_by, creator_name, creator_role, status,
        scheduled_at, expires_at, requires_acknowledgement
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        dto.college_id || null,
        dto.title.trim(),
        dto.body,
        dto.priority || 'normal',
        dto.category || 'announcement',
        creatorUserId,
        creatorName,
        creatorRole,
        dto.scheduled_at ? 'scheduled' : 'sent',
        dto.scheduled_at ? new Date(dto.scheduled_at) : null,
        dto.expires_at ? new Date(dto.expires_at) : null,
        dto.requires_acknowledgement || false,
      ],
    );

    const notice = noticeRows[0];
    const noticeId = notice.id;

    // 3. Insert Attachments
    if (dto.attachments && dto.attachments.length > 0) {
      for (const att of dto.attachments) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notice_attachments (notice_id, file_name, file_type, file_url, file_size_kb)
           VALUES ($1, $2, $3, $4, $5)`,
          [noticeId, att.file_name, att.file_type, att.file_url, att.file_size_kb || 0],
        );
      }
    }

    // 4. Insert Targets
    for (const tgt of dto.targets) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notice_targets (notice_id, target_type, target_value, target_label)
         VALUES ($1, $2, $3, $4)`,
        [noticeId, tgt.target_type, tgt.target_value, tgt.target_label || tgt.target_value],
      );
    }

    // 5. Resolve Recipient User IDs & Fan-Out
    const recipientUserIds = await this.resolveTargetRecipients(dto.targets, slug);

    if (recipientUserIds.length > 0) {
      // Batch insert recipients
      const valuesSql = recipientUserIds
        .map((_, idx) => `($1, $${idx + 2}, false)`)
        .join(', ');

      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notice_recipients (notice_id, user_id, is_read)
         VALUES ${valuesSql}
         ON CONFLICT (notice_id, user_id) DO NOTHING`,
        [noticeId, ...recipientUserIds],
      );
    }

    // 6. Broadcast live real-time notification
    try {
      this.notificationsGateway.broadcastNotification({
        type: 'notice:new',
        noticeId: notice.id,
        title: notice.title,
        priority: notice.priority,
        category: notice.category,
        creator_name: notice.creator_name,
        created_at: notice.created_at,
        recipientCount: recipientUserIds.length,
      });

      for (const uid of recipientUserIds) {
        this.notificationsGateway.sendNotificationToUser(uid, {
          type: 'notice:new',
          noticeId: notice.id,
          title: notice.title,
          priority: notice.priority,
          category: notice.category,
        });
      }
    } catch (wsErr) {
      this.logger.warn(`Failed to broadcast notice WebSocket event: ${wsErr}`);
    }

    return {
      ...notice,
      totalRecipients: recipientUserIds.length,
      attachmentsCount: dto.attachments?.length || 0,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. RESOLVE TARGET RECIPIENTS (Dynamic query matching)
  // ──────────────────────────────────────────────────────────────────────────
  async resolveTargetRecipients(targets: NoticeTargetRuleDto[], slug: string): Promise<string[]> {
    const userIdsSet = new Set<string>();

    for (const rule of targets) {
      switch (rule.target_type) {
        case TargetType.ALL: {
          const allUsers = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id FROM users WHERE is_active = true`,
          );
          allUsers.forEach((u) => userIdsSet.add(u.id));
          break;
        }

        case TargetType.ROLE: {
          const roleValue = rule.target_value.toUpperCase();
          const roleUsers = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id FROM users WHERE role = $1 AND is_active = true`,
            [roleValue],
          );
          roleUsers.forEach((u) => userIdsSet.add(u.id));
          break;
        }

        case TargetType.BATCH_YEAR: {
          const batchVal = rule.target_value;
          const studentBatchUsers = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT s.user_id AS id
             FROM students s
             JOIN users u ON u.id = s.user_id
             LEFT JOIN batches b ON b.id = s.batch_id
             WHERE (s.batch_cd = $1 OR b.code = $1 OR CAST(s.admission_year AS TEXT) = $1 OR CAST(b.year AS TEXT) = $1)
               AND u.is_active = true`,
            [batchVal],
          );
          studentBatchUsers.forEach((u) => {
            if (u.id) userIdsSet.add(u.id);
          });
          break;
        }

        case TargetType.COURSE: {
          const courseVal = rule.target_value.toUpperCase();
          // Match students in this course
          const courseStudents = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT s.user_id AS id
             FROM students s
             JOIN users u ON u.id = s.user_id
             WHERE s.course_cd = $1 AND u.is_active = true`,
            [courseVal],
          );
          courseStudents.forEach((u) => {
            if (u.id) userIdsSet.add(u.id);
          });

          // Also match faculty assigned to this course/departments
          const courseFaculty = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT f.user_id AS id
             FROM faculty f
             JOIN users u ON u.id = f.user_id
             WHERE u.is_active = true`,
          );
          courseFaculty.forEach((u) => {
            if (u.id) userIdsSet.add(u.id);
          });
          break;
        }

        case TargetType.BRANCH: {
          const branchVal = rule.target_value;
          const deptUsers = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT s.user_id AS id
             FROM students s
             JOIN users u ON u.id = s.user_id
             LEFT JOIN departments d ON d.id = s.department_id
             WHERE (d.code = $1 OR d.name = $1 OR CAST(s.department_id AS TEXT) = $1)
               AND u.is_active = true
             UNION
             SELECT f.user_id AS id
             FROM faculty f
             JOIN users u ON u.id = f.user_id
             LEFT JOIN departments d ON d.id = f.department_id
             WHERE (d.code = $1 OR d.name = $1 OR CAST(f.department_id AS TEXT) = $1)
               AND u.is_active = true`,
            [branchVal],
          );
          deptUsers.forEach((u) => {
            if (u.id) userIdsSet.add(u.id);
          });
          break;
        }

        case TargetType.USER: {
          const userVal = rule.target_value;
          const specificUser = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT u.id
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN faculty f ON f.user_id = u.id
             WHERE (u.id::TEXT = $1 OR u.email = $1 OR s.registration_no = $1 OR s.rollno = $1 OR f.emp_id = $1)
               AND u.is_active = true`,
            [userVal],
          );
          specificUser.forEach((u) => {
            if (u.id) userIdsSet.add(u.id);
          });
          break;
        }

        default:
          break;
      }
    }

    return Array.from(userIdsSet);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PREVIEW RECIPIENT COUNT LIVE
  // ──────────────────────────────────────────────────────────────────────────
  async previewRecipients(targets: NoticeTargetRuleDto[], tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const userIds = await this.resolveTargetRecipients(targets, slug);

    if (userIds.length === 0) {
      return {
        totalCount: 0,
        breakdown: { students: 0, faculty: 0, clerks: 0, wardens: 0, admins: 0 },
        sampleRecipients: [],
      };
    }

    const inList = userIds.map((id) => `'${id}'`).join(',');
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT u.id, u.role, u.email,
              COALESCE(s.name, f.name, u.email) AS name,
              COALESCE(s.registration_no, s.rollno, f.emp_id, 'Active') AS identifier
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN faculty f ON f.user_id = u.id
       WHERE u.id IN (${inList})
       ORDER BY u.created_at ASC`,
    );

    const breakdown = {
      students: rows.filter((r) => r.role === 'STUDENT').length,
      faculty: rows.filter((r) => r.role === 'FACULTY').length,
      clerks: rows.filter((r) => r.role === 'CLERK').length,
      wardens: rows.filter((r) => r.role === 'WARDEN').length,
      admins: rows.filter((r) => r.role === 'COLLEGE_ADMIN' || r.role === 'SUPER_ADMIN').length,
    };

    return {
      totalCount: rows.length,
      breakdown,
      sampleRecipients: rows.slice(0, 5),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. LIST ADMIN NOTICES (With Computed Read Statistics)
  // ──────────────────────────────────────────────────────────────────────────
  async listAdminNotices(filter?: NoticeFilterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filter?.category && filter.category !== 'all') {
      params.push(filter.category);
      whereClause += ` AND n.category = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      whereClause += ` AND (LOWER(n.title) LIKE $${params.length} OR LOWER(n.body) LIKE $${params.length})`;
    }

    const sql = `
      SELECT 
        n.id,
        n.title,
        n.body,
        n.priority,
        n.category,
        n.status,
        n.creator_name,
        n.creator_role,
        n.scheduled_at,
        n.expires_at,
        n.requires_acknowledgement,
        n.created_at,
        n.updated_at,
        COUNT(DISTINCT nr.id) AS total_recipients,
        COUNT(DISTINCT nr.id) FILTER (WHERE nr.is_read = true) AS read_count,
        COUNT(DISTINCT nr.id) FILTER (WHERE nr.is_read = false) AS unread_count,
        COUNT(DISTINCT na.id) AS attachments_count,
        COALESCE(
          JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('target_type', nt.target_type, 'target_label', nt.target_label, 'target_value', nt.target_value)) 
          FILTER (WHERE nt.id IS NOT NULL), '[]'
        ) AS targets
      FROM notices n
      LEFT JOIN notice_recipients nr ON nr.notice_id = n.id
      LEFT JOIN notice_attachments na ON na.notice_id = n.id
      LEFT JOIN notice_targets nt ON nt.notice_id = n.id
      ${whereClause}
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `;

    const rows = await this.tenantSchemaService.queryInTenant(slug, sql, params);

    return rows.map((r) => {
      const total = parseInt(r.total_recipients || '0', 10);
      const read = parseInt(r.read_count || '0', 10);
      const unread = parseInt(r.unread_count || '0', 10);
      const readPercentage = total > 0 ? Math.round((read * 100) / total) : 0;

      return {
        ...r,
        total_recipients: total,
        read_count: read,
        unread_count: unread,
        read_percentage: readPercentage,
        attachments_count: parseInt(r.attachments_count || '0', 10),
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. GET ADMIN NOTICE READ REPORT
  // ──────────────────────────────────────────────────────────────────────────
  async getAdminNoticeReadReport(noticeId: string, search?: string, roleFilter?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);

    // 1. Fetch Notice Details
    const noticeRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT n.*, 
              COUNT(DISTINCT nr.id) AS total_recipients,
              COUNT(DISTINCT nr.id) FILTER (WHERE nr.is_read = true) AS read_count,
              COUNT(DISTINCT nr.id) FILTER (WHERE nr.is_read = false) AS unread_count
       FROM notices n
       LEFT JOIN notice_recipients nr ON nr.notice_id = n.id
       WHERE n.id = $1
       GROUP BY n.id`,
      [noticeId],
    );

    if (!noticeRows[0]) {
      throw new NotFoundException('Notice not found');
    }

    const notice = noticeRows[0];

    // 2. Fetch Recipients List with Student / Faculty metadata
    let recWhere = 'WHERE nr.notice_id = $1';
    const params: any[] = [noticeId];

    if (roleFilter && roleFilter !== 'all') {
      params.push(roleFilter.toUpperCase());
      recWhere += ` AND u.role = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      recWhere += ` AND (
        LOWER(COALESCE(s.name, f.name, u.email)) LIKE $${params.length}
        OR LOWER(COALESCE(s.registration_no, s.rollno, f.emp_id, '')) LIKE $${params.length}
        OR LOWER(u.email) LIKE $${params.length}
      )`;
    }

    const recSql = `
      SELECT 
        nr.id AS recipient_id,
        nr.user_id,
        nr.is_read,
        nr.read_at,
        nr.acknowledged,
        nr.acknowledged_at,
        u.email,
        u.role,
        COALESCE(s.name, f.name, u.email) AS name,
        COALESCE(s.registration_no, s.rollno, f.emp_id, '—') AS identifier,
        COALESCE(s.batch_cd, d.name, 'General') AS group_info,
        s.photo_url AS student_photo,
        f.photo_url AS faculty_photo
      FROM notice_recipients nr
      JOIN users u ON u.id = nr.user_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN faculty f ON f.user_id = u.id
      LEFT JOIN departments d ON d.id = f.department_id
      ${recWhere}
      ORDER BY nr.is_read DESC, nr.read_at DESC NULLS LAST, name ASC
    `;

    const recipients = await this.tenantSchemaService.queryInTenant(slug, recSql, params);

    const total = parseInt(notice.total_recipients || '0', 10);
    const read = parseInt(notice.read_count || '0', 10);
    const unread = parseInt(notice.unread_count || '0', 10);
    const readRate = total > 0 ? Math.round((read * 100) / total) : 0;

    return {
      notice: {
        ...notice,
        total_recipients: total,
        read_count: read,
        unread_count: unread,
        read_rate: readRate,
      },
      recipients,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. ROLE-SCOPED NOTICES FOR LOGGED-IN RECIPIENT
  // ──────────────────────────────────────────────────────────────────────────
  async getRoleScopedNotices(userId: string, filter?: NoticeFilterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    let whereClause = 'WHERE nr.user_id = $1';
    const params: any[] = [userId];

    if (filter?.filter === 'unread') {
      whereClause += ' AND nr.is_read = false';
    } else if (filter?.filter === 'important') {
      whereClause += " AND n.priority IN ('important', 'urgent')";
    } else if (filter?.filter === 'urgent') {
      whereClause += " AND n.priority = 'urgent'";
    } else if (filter?.filter === 'announcements') {
      whereClause += " AND n.category = 'announcement'";
    } else if (filter?.filter === 'deadlines') {
      whereClause += " AND n.category = 'deadline'";
    }

    if (filter?.category && filter.category !== 'all') {
      params.push(filter.category);
      whereClause += ` AND n.category = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      whereClause += ` AND (LOWER(n.title) LIKE $${params.length} OR LOWER(n.body) LIKE $${params.length} OR LOWER(n.creator_name) LIKE $${params.length})`;
    }

    const sql = `
      SELECT 
        n.id,
        n.title,
        n.body,
        n.priority,
        n.category,
        n.creator_name,
        n.creator_role,
        n.status,
        n.scheduled_at,
        n.expires_at,
        n.requires_acknowledgement,
        n.created_at,
        nr.is_read,
        nr.read_at,
        nr.acknowledged,
        nr.acknowledged_at,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', na.id,
              'file_name', na.file_name,
              'file_type', na.file_type,
              'file_url', na.file_url,
              'file_size_kb', na.file_size_kb
            )
          ) FILTER (WHERE na.id IS NOT NULL), '[]'
        ) AS attachments
      FROM notice_recipients nr
      JOIN notices n ON n.id = nr.notice_id
      LEFT JOIN notice_attachments na ON na.notice_id = n.id
      ${whereClause}
      GROUP BY n.id, nr.is_read, nr.read_at, nr.acknowledged, nr.acknowledged_at
      ORDER BY 
        CASE 
          WHEN nr.is_read = false AND n.priority = 'urgent' THEN 1
          WHEN nr.is_read = false AND n.priority = 'important' THEN 2
          WHEN nr.is_read = false THEN 3
          ELSE 4
        END,
        n.created_at DESC
    `;

    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. UNREAD COUNT FOR BADGES & BELL ICON
  // ──────────────────────────────────────────────────────────────────────────
  async getUnreadCount(userId: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT 
         COUNT(*) AS total_unread,
         COUNT(*) FILTER (WHERE n.priority = 'urgent') AS urgent_unread,
         COUNT(*) FILTER (WHERE n.priority = 'important') AS important_unread,
         COUNT(*) FILTER (WHERE n.priority = 'normal') AS normal_unread
       FROM notice_recipients nr
       JOIN notices n ON n.id = nr.notice_id
       WHERE nr.user_id = $1 AND nr.is_read = false`,
      [userId],
    );

    const r = rows[0] || {};
    return {
      totalUnread: parseInt(r.total_unread || '0', 10),
      urgentUnread: parseInt(r.urgent_unread || '0', 10),
      importantUnread: parseInt(r.important_unread || '0', 10),
      normalUnread: parseInt(r.normal_unread || '0', 10),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. GET NOTICE BY ID & MARK READ
  // ──────────────────────────────────────────────────────────────────────────
  async getNoticeById(noticeId: string, userId?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const noticeRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT n.*,
              COALESCE(
                JSON_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(
                    'id', na.id,
                    'file_name', na.file_name,
                    'file_type', na.file_type,
                    'file_url', na.file_url,
                    'file_size_kb', na.file_size_kb
                  )
                ) FILTER (WHERE na.id IS NOT NULL), '[]'
              ) AS attachments,
              COALESCE(
                JSON_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(
                    'target_type', nt.target_type,
                    'target_value', nt.target_value,
                    'target_label', nt.target_label
                  )
                ) FILTER (WHERE nt.id IS NOT NULL), '[]'
              ) AS targets
       FROM notices n
       LEFT JOIN notice_attachments na ON na.notice_id = n.id
       LEFT JOIN notice_targets nt ON nt.notice_id = n.id
       WHERE n.id = $1
       GROUP BY n.id`,
      [noticeId],
    );

    if (!noticeRows[0]) {
      throw new NotFoundException('Notice not found');
    }

    const notice = noticeRows[0];

    // If userId provided, automatically mark as read
    if (userId) {
      await this.markAsRead(noticeId, userId, tenantSlug);
    }

    return notice;
  }

  async markAsRead(noticeId: string, userId: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE notice_recipients
       SET is_read = true, read_at = NOW()
       WHERE notice_id = $1 AND user_id = $2`,
      [noticeId, userId],
    );
    return { success: true, message: 'Notice marked as read' };
  }

  async acknowledgeNotice(noticeId: string, userId: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE notice_recipients
       SET is_read = true, read_at = COALESCE(read_at, NOW()), acknowledged = true, acknowledged_at = NOW()
       WHERE notice_id = $1 AND user_id = $2`,
      [noticeId, userId],
    );
    return { success: true, message: 'Notice acknowledged successfully' };
  }

  async deleteNotice(noticeId: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM notices WHERE id = $1`,
      [noticeId],
    );
    return { success: true, message: 'Notice deleted successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. NOTICE GROUP TEMPLATES (CRUD)
  // ──────────────────────────────────────────────────────────────────────────
  async listNoticeGroups(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM notice_group_templates WHERE is_active = true ORDER BY created_at DESC`,
    );
  }

  async createNoticeGroup(dto: CreateNoticeGroupDto, userId: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO notice_group_templates (name, description, target_rules, created_by)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING *`,
      [dto.name.trim(), dto.description || null, JSON.stringify(dto.target_rules), userId],
    );
    return rows[0];
  }

  async updateNoticeGroup(id: string, dto: UpdateNoticeGroupDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE notice_group_templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           target_rules = COALESCE($3::jsonb, target_rules),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        dto.name ? dto.name.trim() : null,
        dto.description || null,
        dto.target_rules ? JSON.stringify(dto.target_rules) : null,
        dto.is_active !== undefined ? dto.is_active : null,
        id,
      ],
    );
    return rows[0];
  }

  async deleteNoticeGroup(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM notice_group_templates WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Notice group template deleted' };
  }
}
