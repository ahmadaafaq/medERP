import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
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
export class NoticesService implements OnModuleInit {
  private readonly logger = new Logger(NoticesService.name);

  private static readonly ensuredSlugs = new Set<string>();

  constructor(
    private readonly tenantSchemaService: TenantSchemaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    const defaultSlugs = ['srms-ims', 'srms-cet-bareilly'];
    for (const slug of defaultSlugs) {
      try {
        await this.ensureTables(slug);
        await this.seedSampleNoticesIfEmpty(slug);
      } catch (e) {
        this.logger.warn(`Notices initialization notice for tenant '${slug}': ${e?.message || e}`);
      }
    }
  }

  async ensureTables(slug: string) {
    if (NoticesService.ensuredSlugs.has(slug)) return;
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `
        CREATE TABLE IF NOT EXISTS notices (
          id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id               UUID,
          title                    VARCHAR(255) NOT NULL,
          body                     TEXT NOT NULL,
          priority                 VARCHAR(20) DEFAULT 'normal',
          category                 VARCHAR(50) DEFAULT 'announcement',
          created_by               UUID,
          creator_name             VARCHAR(200),
          creator_role             VARCHAR(100),
          status                   VARCHAR(20) DEFAULT 'sent',
          scheduled_at             TIMESTAMPTZ,
          expires_at               TIMESTAMPTZ,
          requires_acknowledgement BOOLEAN DEFAULT false,
          created_at               TIMESTAMPTZ DEFAULT NOW(),
          updated_at               TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS notice_attachments (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          notice_id    UUID REFERENCES notices(id) ON DELETE CASCADE,
          file_name    VARCHAR(255) NOT NULL,
          file_type    VARCHAR(50),
          file_url     TEXT NOT NULL,
          file_size_kb INT DEFAULT 0,
          created_at   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS notice_targets (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          notice_id    UUID REFERENCES notices(id) ON DELETE CASCADE,
          target_type  VARCHAR(50) NOT NULL,
          target_value VARCHAR(255) NOT NULL,
          target_label VARCHAR(255),
          created_at   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS notice_recipients (
          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          notice_id       UUID REFERENCES notices(id) ON DELETE CASCADE,
          user_id         VARCHAR(255),
          is_read         BOOLEAN DEFAULT false,
          read_at         TIMESTAMPTZ,
          acknowledged    BOOLEAN DEFAULT false,
          acknowledged_at TIMESTAMPTZ,
          created_at      TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(notice_id, user_id)
        );

        -- Safe column type migration in case table was created with UUID user_id
        ALTER TABLE notice_recipients DROP CONSTRAINT IF EXISTS notice_recipients_user_id_fkey;
        ALTER TABLE notice_recipients ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        ALTER TABLE notice_attachments ADD COLUMN IF NOT EXISTS file_data TEXT;

        CREATE TABLE IF NOT EXISTS notice_group_templates (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name         VARCHAR(200) NOT NULL,
          description  TEXT,
          created_by   UUID,
          target_rules JSONB DEFAULT '[]'::jsonb,
          is_active    BOOLEAN DEFAULT true,
          created_at   TIMESTAMPTZ DEFAULT NOW(),
          updated_at   TIMESTAMPTZ DEFAULT NOW()
        );
        `,
      );
      NoticesService.ensuredSlugs.add(slug);
    } catch (e) {
      // Ignore if table initialization has minor errors
    }
  }

  async seedSampleNoticesIfEmpty(slug: string) {
    try {
      const countRes = await this.tenantSchemaService.queryInTenant(slug, 'SELECT COUNT(*) as count FROM notices');
      if (parseInt(countRes?.[0]?.count || '0', 10) > 0) return;

      const adminRows = await this.tenantSchemaService.queryInTenant(slug, 'SELECT id, email FROM users LIMIT 1');
      const adminId = adminRows?.[0]?.id || null;

      // 1. Notice 1: Urgent
      const r1 = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notices (title, body, priority, category, created_by, creator_name, creator_role, requires_acknowledgement)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          'URGENT: Semester Examination Registration & No-Dues Clearance',
          'All students are required to complete online examination form submission and fee clearance before the upcoming end-semester examinations. Please contact your department coordinator if you face any issues.',
          'urgent',
          'exam',
          adminId,
          'Office of the Dean / Controller of Examinations',
          'Administration',
          true,
        ],
      );
      const n1 = r1?.[0];

      // 2. Notice 2: Important
      const r2 = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notices (title, body, priority, category, created_by, creator_name, creator_role, requires_acknowledgement)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          'Upcoming Faculty Development & Research Symposium 2026',
          'We are pleased to announce the Annual Academic Symposium. Faculty members and postgraduate candidates are invited to submit abstracts and presentation proposals.',
          'important',
          'announcement',
          adminId,
          'Academic Council Secretariat',
          'Faculty Committee',
          false,
        ],
      );
      const n2 = r2?.[0];

      // 3. Notice 3: Normal
      const r3 = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notices (title, body, priority, category, created_by, creator_name, creator_role, requires_acknowledgement)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          'Campus Central Library Revised Timings & Digital Repository Access',
          'The Central Library and e-learning repository will remain accessible 24/7 during the exam preparation period. High-speed Wi-Fi and quiet study areas are fully operational.',
          'normal',
          'general',
          adminId,
          'Chief Librarian & IT Services',
          'Library Admin',
          false,
        ],
      );
      const n3 = r3?.[0];

      // Targets
      for (const nid of [n1?.id, n2?.id, n3?.id]) {
        if (nid) {
          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO notice_targets (notice_id, target_type, target_value, target_label)
             VALUES ($1, 'ALL', 'ALL', 'All Institution Members')`,
            [nid],
          );
        }
      }

      // Fan out to all users in tenant
      const allUsers = await this.tenantSchemaService.queryInTenant(slug, 'SELECT id FROM users WHERE is_active = true');
      for (const u of (allUsers || [])) {
        if (n1?.id && u?.id) {
          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO notice_recipients (notice_id, user_id, is_read) VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
            [n1.id, u.id],
          );
        }
        if (n2?.id && u?.id) {
          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO notice_recipients (notice_id, user_id, is_read) VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
            [n2.id, u.id],
          );
        }
        if (n3?.id && u?.id) {
          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO notice_recipients (notice_id, user_id, is_read) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
            [n3.id, u.id],
          );
        }
      }

      this.logger.log(`Sample notices seeded successfully for tenant: ${slug}`);
    } catch (e) {
      this.logger.warn(`Notice auto-seeding skipped: ${e.message}`);
    }
  }

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CREATE NOTICE & RECIPIENT FAN-OUT
  // ──────────────────────────────────────────────────────────────────────────
  async createNotice(dto: CreateNoticeDto, creatorUserId?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);

    if (!dto.targets || dto.targets.length === 0) {
      dto.targets = [{ target_type: TargetType.ALL, target_value: 'ALL', target_label: 'All Institution Members' }];
    }

    // 1. Fetch creator info
    let creatorName = 'Administration Office';
    let creatorRole = 'Admin';
    let validCreatorId: string | null = creatorUserId || null;

    if (creatorUserId) {
      try {
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
        if (creator) {
          validCreatorId = creator.id;
          creatorName = creator.faculty_name || creator.student_name || creator.email?.split('@')[0] || 'Admin';
          creatorRole = creator.designation || creator.role || 'Admin';
        }
      } catch (err) {
        this.logger.warn(`Could not resolve creator details: ${err.message}`);
      }
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
        validCreatorId,
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
        const fileData = (att as any).file_data || (att as any).data || null;
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notice_attachments (notice_id, file_name, file_type, file_url, file_size_kb, file_data)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [noticeId, att.file_name, att.file_type || 'pdf', att.file_url, att.file_size_kb || 0, fileData],
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

    // If creator is valid and not already in recipient set, include them so they can see sent receipts
    if (validCreatorId && !recipientUserIds.includes(validCreatorId)) {
      recipientUserIds.push(validCreatorId);
    }

    if (recipientUserIds.length > 0) {
      // Batch insert recipients
      for (const uid of recipientUserIds) {
        const isCreator = uid === validCreatorId;
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notice_recipients (notice_id, user_id, is_read, read_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (notice_id, user_id) DO NOTHING`,
          [noticeId, uid, isCreator, isCreator ? new Date() : null],
        );
      }
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
      const type = String(rule.target_type || '').toLowerCase();
      const val = String(rule.target_value || '').trim();

      if (type === 'all' || val.toLowerCase() === 'all') {
        const allUsers = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM users WHERE is_active = true`,
        );
        allUsers.forEach((u) => userIdsSet.add(u.id));
      } else if (type === 'role') {
        const roleVal = val.toUpperCase();
        const roleUsers = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM users WHERE UPPER(role) = $1 AND is_active = true`,
          [roleVal],
        );
        roleUsers.forEach((u) => userIdsSet.add(u.id));
      } else if (type === 'batch_year') {
        const studentBatchUsers = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT s.user_id AS id
           FROM students s
           JOIN users u ON u.id = s.user_id
           LEFT JOIN batches b ON b.id = s.batch_id
           WHERE (s.batch_cd = $1 OR b.code = $1 OR CAST(s.admission_year AS TEXT) = $1 OR CAST(b.year AS TEXT) = $1)
             AND u.is_active = true`,
          [val],
        );
        studentBatchUsers.forEach((u) => {
          if (u.id) userIdsSet.add(u.id);
        });
      } else if (type === 'course') {
        const courseStudents = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT s.user_id AS id
           FROM students s
           JOIN users u ON u.id = s.user_id
           WHERE UPPER(s.course_cd) = $1 AND u.is_active = true`,
          [val.toUpperCase()],
        );
        courseStudents.forEach((u) => {
          if (u.id) userIdsSet.add(u.id);
        });

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
      } else if (type === 'branch' || type === 'department') {
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
          [val],
        );
        deptUsers.forEach((u) => {
          if (u.id) userIdsSet.add(u.id);
        });
      } else if (type === 'user') {
        const specificUser = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT u.id
           FROM users u
           LEFT JOIN students s ON s.user_id = u.id
           LEFT JOIN faculty f ON f.user_id = u.id
           WHERE (u.id::TEXT = $1 OR u.email = $1 OR s.registration_no = $1 OR s.rollno = $1 OR f.emp_id = $1)
             AND u.is_active = true`,
          [val],
        );
        specificUser.forEach((u) => {
          if (u.id) userIdsSet.add(u.id);
        });
      }
    }

    // Safety fallback: ensure at least all active users are included if no match
    if (userIdsSet.size === 0) {
      const allUsers = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM users WHERE is_active = true`,
      );
      allUsers.forEach((u) => userIdsSet.add(u.id));
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
  // ──────────────────────────────────────────────────────────────────────────
  // 4. LIST ADMIN NOTICES (With Computed Read Statistics)
  // ──────────────────────────────────────────────────────────────────────────
  async listAdminNotices(filter?: NoticeFilterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filter?.category && filter.category !== 'all') {
      params.push(filter.category);
      whereClause += ` AND n.category = $${params.length}`;
    }

    if (filter?.priority && filter.priority !== 'all') {
      params.push(filter.priority);
      whereClause += ` AND n.priority = $${params.length}`;
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
        COALESCE((SELECT COUNT(*) FROM notice_recipients nr WHERE nr.notice_id::text = n.id::text), 0) AS total_recipients,
        COALESCE((SELECT COUNT(*) FROM notice_recipients nr WHERE nr.notice_id::text = n.id::text AND nr.is_read = true), 0) AS read_count,
        COALESCE((SELECT COUNT(*) FROM notice_recipients nr WHERE nr.notice_id::text = n.id::text AND nr.is_read = false), 0) AS unread_count,
        COALESCE((SELECT COUNT(*) FROM notice_attachments na WHERE na.notice_id::text = n.id::text), 0) AS attachments_count,
        COALESCE(
          (
            SELECT JSON_AGG(
              JSONB_BUILD_OBJECT(
                'target_type', nt.target_type,
                'target_label', nt.target_label,
                'target_value', nt.target_value
              )
            )
            FROM notice_targets nt
            WHERE nt.notice_id::text = n.id::text
          ),
          '[]'::json
        ) AS targets
      FROM notices n
      ${whereClause}
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
    await this.ensureTables(slug);

    // 1. Fetch Notice Details
    const noticeRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT n.*, 
              COALESCE((SELECT COUNT(*) FROM notice_recipients nr WHERE nr.notice_id::text = n.id::text), 0) AS total_recipients,
              COALESCE((SELECT COUNT(*) FROM notice_recipients nr WHERE nr.notice_id::text = n.id::text AND nr.is_read = true), 0) AS read_count,
              COALESCE((SELECT COUNT(*) FROM notice_recipients nr WHERE nr.notice_id::text = n.id::text AND nr.is_read = false), 0) AS unread_count
       FROM notices n
       WHERE n.id::text = $1::text`,
      [noticeId],
    );

    if (!noticeRows[0]) {
      throw new NotFoundException('Notice not found');
    }

    const notice = noticeRows[0];

    // 2. Fetch Recipients List with Student / Faculty metadata
    let recWhere = 'WHERE nr.notice_id::text = $1::text';
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
      JOIN users u ON u.id::text = nr.user_id::text
      LEFT JOIN students s ON s.user_id::text = u.id::text
      LEFT JOIN faculty f ON f.user_id::text = u.id::text
      LEFT JOIN departments d ON d.id::text = f.department_id::text
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
  async getRoleScopedNotices(userId?: string, userRole?: string, filter?: NoticeFilterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    const roleNormalized = (userRole || '').toUpperCase();
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'COLLEGE_ADMIN', 'CLERK'].includes(roleNormalized);

    if (!isAdmin && userId) {
      params.push(userId);
      const uidIdx = params.length;
      params.push(roleNormalized);
      const roleIdx = params.length;

      whereClause += ` AND (
        EXISTS (SELECT 1 FROM notice_recipients nr2 WHERE nr2.notice_id::text = n.id::text AND nr2.user_id::text = $${uidIdx}::text)
        OR EXISTS (SELECT 1 FROM notice_targets nt2 WHERE nt2.notice_id::text = n.id::text AND (LOWER(nt2.target_type) = 'all' OR (LOWER(nt2.target_type) = 'role' AND UPPER(nt2.target_value) = $${roleIdx})))
        OR n.created_by::text = $${uidIdx}::text
      )`;
    }

    if (filter?.filter === 'unread' && userId) {
      params.push(userId);
      whereClause += ` AND EXISTS (SELECT 1 FROM notice_recipients nr3 WHERE nr3.notice_id::text = n.id::text AND nr3.user_id::text = $${params.length}::text AND (nr3.is_read::text = 'true' OR nr3.is_read::text = '1'))`;
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

    if (filter?.priority && filter.priority !== 'all') {
      params.push(filter.priority);
      whereClause += ` AND n.priority = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      whereClause += ` AND (LOWER(n.title) LIKE $${params.length} OR LOWER(n.body) LIKE $${params.length} OR LOWER(n.creator_name) LIKE $${params.length})`;
    }

    const recipientJoin = userId
      ? `LEFT JOIN notice_recipients nr ON nr.notice_id::text = n.id::text AND nr.user_id::text = '${userId.replace(/'/g, "''")}'::text`
      : `LEFT JOIN notice_recipients nr ON nr.notice_id::text = n.id::text`;

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
        (CASE WHEN nr.is_read::text = 'true' OR nr.is_read::text = '1' THEN true ELSE false END) AS is_read,
        nr.read_at,
        (CASE WHEN nr.acknowledged::text = 'true' OR nr.acknowledged::text = '1' THEN true ELSE false END) AS acknowledged,
        nr.acknowledged_at,
        COALESCE(
          (
            SELECT JSON_AGG(
              JSONB_BUILD_OBJECT(
                'id', na.id,
                'file_name', na.file_name,
                'file_type', na.file_type,
                'file_url', na.file_url,
                'file_size_kb', na.file_size_kb
              )
            )
            FROM notice_attachments na
            WHERE na.notice_id::text = n.id::text
          ),
          '[]'::json
        ) AS attachments
      FROM notices n
      ${recipientJoin}
      ${whereClause}
      GROUP BY n.id, n.title, n.body, n.priority, n.category, n.creator_name, n.creator_role, n.status, n.scheduled_at, n.expires_at, n.requires_acknowledgement, n.created_at, nr.is_read, nr.read_at, nr.acknowledged, nr.acknowledged_at
      ORDER BY 
        CASE 
          WHEN (nr.is_read IS NULL OR nr.is_read::text = 'false' OR nr.is_read::text = '0') AND n.priority = 'urgent' THEN 1
          WHEN (nr.is_read IS NULL OR nr.is_read::text = 'false' OR nr.is_read::text = '0') AND n.priority = 'important' THEN 2
          WHEN (nr.is_read IS NULL OR nr.is_read::text = 'false' OR nr.is_read::text = '0') THEN 3
          ELSE 4
        END,
        n.created_at DESC
    `;

    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. UNREAD COUNT FOR BADGES & BELL ICON
  // ──────────────────────────────────────────────────────────────────────────
  async getUnreadCount(userId?: string, userRole?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);

    const notices = await this.getRoleScopedNotices(userId, userRole || 'STUDENT', undefined, slug);
    const unread = notices.filter((n) => !n.is_read);

    return {
      totalUnread: unread.length,
      urgentUnread: unread.filter((n) => n.priority === 'urgent').length,
      importantUnread: unread.filter((n) => n.priority === 'important').length,
      normalUnread: unread.filter((n) => n.priority === 'normal').length,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. GET NOTICE BY ID & MARK READ
  // ──────────────────────────────────────────────────────────────────────────
  async getNoticeById(noticeId: string, userId?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);

    const noticeRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT n.*,
              COALESCE(
                (
                  SELECT JSON_AGG(
                    JSONB_BUILD_OBJECT(
                      'id', na.id,
                      'file_name', na.file_name,
                      'file_type', na.file_type,
                      'file_url', na.file_url,
                      'file_size_kb', na.file_size_kb
                    )
                  )
                  FROM notice_attachments na
                  WHERE na.notice_id::text = n.id::text
                ),
                '[]'::json
              ) AS attachments,
              COALESCE(
                (
                  SELECT JSON_AGG(
                    JSONB_BUILD_OBJECT(
                      'target_type', nt.target_type,
                      'target_value', nt.target_value,
                      'target_label', nt.target_label
                    )
                  )
                  FROM notice_targets nt
                  WHERE nt.notice_id::text = n.id::text
                ),
                '[]'::json
              ) AS targets
       FROM notices n
       WHERE n.id::text = $1::text`,
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

  async markAsRead(noticeId: string, userId?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);
    const uid = userId && userId.trim() ? userId.trim() : 'anonymous';
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notice_recipients (notice_id, user_id, is_read, read_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (notice_id, user_id)
         DO UPDATE SET is_read = true, read_at = COALESCE(notice_recipients.read_at, NOW())`,
        [noticeId, uid],
      );
    } catch (err) {
      console.warn('markAsRead fallback update:', err);
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE notice_recipients
         SET is_read = true, read_at = NOW()
         WHERE notice_id = $1 AND user_id = $2`,
        [noticeId, uid],
      );
    }
    return { success: true, message: 'Notice marked as read' };
  }

  async acknowledgeNotice(noticeId: string, userId?: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.ensureTables(slug);
    const uid = userId && userId.trim() ? userId.trim() : 'anonymous';
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notice_recipients (notice_id, user_id, is_read, read_at, acknowledged, acknowledged_at)
         VALUES ($1, $2, true, NOW(), true, NOW())
         ON CONFLICT (notice_id, user_id)
         DO UPDATE SET is_read = true, read_at = COALESCE(notice_recipients.read_at, NOW()), acknowledged = true, acknowledged_at = NOW()`,
        [noticeId, uid],
      );
    } catch (err) {
      console.warn('acknowledgeNotice fallback update:', err);
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE notice_recipients
         SET is_read = true, read_at = COALESCE(read_at, NOW()), acknowledged = true, acknowledged_at = NOW()
         WHERE notice_id = $1 AND user_id = $2`,
        [noticeId, uid],
      );
    }
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

  /**
   * Fetch notice attachment binary/base64 from PostgreSQL if physical file is missing from disk
   */
  async getNoticeAttachmentData(tenantSlug: string, filename: string) {
    try {
      const slug = (tenantSlug || '').replace(/^tenant_/, '');
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT file_name, file_type, file_data FROM notice_attachments
         WHERE file_url LIKE $1 OR file_name = $2
         ORDER BY created_at DESC LIMIT 1`,
        [`%${filename}%`, filename],
      );
      if (rows && rows[0] && rows[0].file_data) {
        return rows[0];
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch notice attachment from DB: ${e.message}`);
    }
    return null;
  }
}
