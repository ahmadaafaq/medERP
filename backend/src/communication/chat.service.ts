import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { ChatGateway } from './chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  SendMessageDto,
  CreateChatGroupDto,
  ChatGroupFilterDto,
} from './dto/chat.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private readonly ensuredTenants = new Set<string>();

  constructor(
    private readonly tenantSchemaService: TenantSchemaService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    const defaultSlugs = ['srms-ims', 'srms-cet-bareilly', 'srms-cetr-bareilly'];
    setImmediate(async () => {
      for (const slug of defaultSlugs) {
        try {
          await this.ensureTables(slug);
          await this.syncGroupsAndMembers(slug);
        } catch (e: any) {
          this.logger.warn(`Chat initialization for tenant '${slug}': ${e?.message || e}`);
        }
      }
    });
  }

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  /**
   * Ensure chat tables exist in the tenant schema
   */
  async ensureTables(tenantSlug: string): Promise<void> {
    const slug = this.resolveTenantSlug(tenantSlug);
    if (this.ensuredTenants.has(slug)) return;
    this.ensuredTenants.add(slug);

    const schema = `tenant_${slug}`;

    const statements = [
      `CREATE TABLE IF NOT EXISTS "${schema}".chat_groups (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id      VARCHAR(255),
        department_id   VARCHAR(255),
        department_name VARCHAR(255),
        batch_year      VARCHAR(100) NOT NULL DEFAULT '2025',
        batch_id        VARCHAR(255),
        batch_code      VARCHAR(100),
        name            VARCHAR(255) NOT NULL DEFAULT 'Batch Group',
        description     TEXT,
        is_active       BOOLEAN DEFAULT true,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "${schema}".chat_group_members (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_group_id UUID,
        user_id       VARCHAR(255) NOT NULL DEFAULT 'FAC001',
        role          VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
        name          VARCHAR(255),
        avatar_url    TEXT,
        joined_at     TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "${schema}".chat_messages (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_group_id UUID,
        sender_id     VARCHAR(255),
        sender_name   VARCHAR(255) NOT NULL DEFAULT 'Faculty',
        sender_role   VARCHAR(50) NOT NULL DEFAULT 'FACULTY',
        sender_avatar TEXT,
        body          TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "${schema}".chat_attachments (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id   UUID,
        file_name    VARCHAR(255) NOT NULL,
        file_type    VARCHAR(50) DEFAULT 'other',
        file_url     TEXT NOT NULL,
        file_size_kb INT DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "${schema}".chat_read_state (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_group_id        UUID,
        user_id              VARCHAR(255) NOT NULL,
        last_read_message_id UUID,
        updated_at           TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Column ensuring
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS batch_year VARCHAR(100) DEFAULT '2025'`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS batch_code VARCHAR(100)`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS department_id VARCHAR(255)`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS department_name VARCHAR(255)`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS college_id VARCHAR(255)`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS batch_id VARCHAR(255)`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Batch Group'`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,

      `ALTER TABLE "${schema}".chat_group_members ADD COLUMN IF NOT EXISTS chat_group_id UUID`,
      `ALTER TABLE "${schema}".chat_group_members ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT 'FAC001'`,
      `ALTER TABLE "${schema}".chat_group_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'STUDENT'`,
      `ALTER TABLE "${schema}".chat_group_members ADD COLUMN IF NOT EXISTS name VARCHAR(255)`,
      `ALTER TABLE "${schema}".chat_group_members ADD COLUMN IF NOT EXISTS avatar_url TEXT`,

      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS chat_group_id UUID`,
      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS sender_id VARCHAR(255)`,
      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255) DEFAULT 'User'`,
      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'FACULTY'`,
      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT`,
      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS body TEXT`,
      `ALTER TABLE "${schema}".chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`,

      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS message_id UUID`,
      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT 'attachment'`,
      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) DEFAULT 'other'`,
      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT ''`,
      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS file_size_kb INT DEFAULT 0`,
      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS file_data TEXT`,
      `ALTER TABLE "${schema}".chat_attachments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`,

      `ALTER TABLE "${schema}".chat_read_state ADD COLUMN IF NOT EXISTS chat_group_id UUID`,
      `ALTER TABLE "${schema}".chat_read_state ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT 'FAC001'`,
      `ALTER TABLE "${schema}".chat_read_state ADD COLUMN IF NOT EXISTS last_read_message_id UUID`,
      `ALTER TABLE "${schema}".chat_read_state ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,

      // Drop foreign keys if they existed to allow string IDs (e.g. FAC001, roll numbers, branch codes)
      `ALTER TABLE "${schema}".chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey`,
      `ALTER TABLE "${schema}".chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_user_id_fkey`,
      `ALTER TABLE "${schema}".chat_read_state DROP CONSTRAINT IF EXISTS chat_read_state_user_id_fkey`,
      `ALTER TABLE "${schema}".chat_groups DROP CONSTRAINT IF EXISTS chat_groups_department_id_fkey`,
      `ALTER TABLE "${schema}".chat_groups DROP CONSTRAINT IF EXISTS chat_groups_batch_id_fkey`,
      `ALTER TABLE "${schema}".chat_groups DROP CONSTRAINT IF EXISTS chat_groups_college_id_fkey`,

      // Alter data types to VARCHAR(255)
      `ALTER TABLE "${schema}".chat_groups ALTER COLUMN department_id TYPE VARCHAR(255) USING department_id::text`,
      `ALTER TABLE "${schema}".chat_groups ALTER COLUMN batch_id TYPE VARCHAR(255) USING batch_id::text`,
      `ALTER TABLE "${schema}".chat_groups ALTER COLUMN college_id TYPE VARCHAR(255) USING college_id::text`,
      `ALTER TABLE "${schema}".chat_group_members ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text`,
      `ALTER TABLE "${schema}".chat_messages ALTER COLUMN sender_id TYPE VARCHAR(255) USING sender_id::text`,
      `ALTER TABLE "${schema}".chat_read_state ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text`,

      // Indices
      `CREATE INDEX IF NOT EXISTS idx_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_cg_dept ON "${schema}".chat_groups(department_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_cg_by ON "${schema}".chat_groups(batch_year)`,
      `CREATE INDEX IF NOT EXISTS idx_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_cgm_u ON "${schema}".chat_group_members(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_cgm_g ON "${schema}".chat_group_members(chat_group_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_cm_g ON "${schema}".chat_messages(chat_group_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_cgm ON "${schema}".chat_group_members(chat_group_id, user_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_crs ON "${schema}".chat_read_state(chat_group_id, user_id)`,
    ];

    for (const stmt of statements) {
      await this.tenantSchemaService.queryInTenant(slug, stmt).catch(() => null);
    }
  }

  /**
   * Automatically provision / sync batch chat groups for active departments and batches
   */
  async syncGroupsAndMembers(tenantSlug: string): Promise<{ syncedGroups: number; membersAdded: number }> {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    let syncedGroups = 0;
    let membersAdded = 0;

    try {
      // 1. Fetch all departments in tenant
      const departments = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, name, code FROM "${schema}".departments WHERE is_active = true ORDER BY name ASC`,
      ).catch(() => []);

      // 2. Fetch distinct batches or batches table
      const batches = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, year, course_cd, department_id FROM "${schema}".batches WHERE is_active = true ORDER BY year DESC`,
      ).catch(() => []);

      // If batches table is empty, create standard active batch years (>= 2024)
      const batchYears = batches.length > 0 
        ? Array.from(new Set(batches.map((b: any) => String(b.year || '')).filter((y: string) => {
            const num = parseInt(y, 10);
            return !isNaN(num) && num >= 2024;
          })))
        : ['2025', '2026'];
      if (batchYears.length === 0) batchYears.push('2025', '2026');

      // For every department, ensure groups exist for active batch years
      for (const dept of departments) {
        for (const year of batchYears) {
          const groupName = `${year} Batch · ${dept.name}`;
          const existingGroup = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id FROM "${schema}".chat_groups WHERE department_id::text = $1::text AND batch_year::text = $2::text LIMIT 1`,
            [dept.id, year],
          ).catch(() => []);

          let groupId: string;
          if (existingGroup.length > 0) {
            groupId = existingGroup[0].id;
          } else {
            const newGroup = await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".chat_groups (
                department_id, department_name, batch_year, batch_code, name, description
              ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
              [
                dept.id,
                dept.name,
                year,
                `${year}-${dept.code || 'DEPT'}`,
                groupName,
                `Official communication channel for ${year} Batch students & faculty in ${dept.name}`,
              ],
            );
            groupId = newGroup[0].id;
            syncedGroups++;
          }

          // Enroll faculty members of this department into the group
          const facultyRows = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT f.user_id, f.name, f.photo_url 
             FROM "${schema}".faculty f 
             WHERE f.department_id::text = $1::text AND f.user_id IS NOT NULL AND f.is_active = true`,
            [dept.id],
          ).catch(() => []);

          for (const fac of facultyRows) {
            const insRes = await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".chat_group_members (chat_group_id, user_id, role, name, avatar_url)
               VALUES ($1, $2, 'FACULTY', $3, $4)
               ON CONFLICT (chat_group_id, user_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
               RETURNING id`,
              [groupId, fac.user_id, fac.name, fac.photo_url || null],
            ).catch(() => []);
            if (insRes?.length) membersAdded++;
          }

          // Enroll students belonging to this department & batch
          const studentRows = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT s.user_id, s.name, s.photo_url 
             FROM "${schema}".students s 
             LEFT JOIN "${schema}".batches b ON b.id::text = s.batch_id::text
             WHERE s.department_id::text = $1::text 
               AND (s.admission_year::text = $2::text OR b.year::text = $2::text OR s.batch_cd ILIKE $3)
               AND s.user_id IS NOT NULL 
               AND s.is_active = true`,
            [dept.id, year, `%${year}%`],
          ).catch(() => []);

          for (const stu of studentRows) {
            const insRes = await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".chat_group_members (chat_group_id, user_id, role, name, avatar_url)
               VALUES ($1, $2, 'STUDENT', $3, $4)
               ON CONFLICT (chat_group_id, user_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
               RETURNING id`,
              [groupId, stu.user_id, stu.name, stu.photo_url || null],
            ).catch(() => []);
            if (insRes?.length) membersAdded++;
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error in syncGroupsAndMembers for tenant ${slug}: ${err.message}`);
    }

    return { syncedGroups, membersAdded };
  }

  /**
   * Get groups accessible to the current user
   */
  async getGroups(tenantSlug: string, user: any, filters?: ChatGroupFilterDto) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    const userId = user?.id || user?.sub || '';
    const userName = user?.name || '';
    const role = (user?.role || 'STUDENT').toUpperCase();

    const params: any[] = [];
    let whereConditions: string[] = ['g.is_active = true'];

    // Never return old legacy batches (e.g. 2013, 2014)
    whereConditions.push(`(g.batch_year::text >= '2024' OR g.batch_year IS NULL)`);

    // If not ADMIN, filter strictly by membership or active messages
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'COLLEGE_ADMIN') {
      const facultyRecord = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, user_id, emp_id, department_id, name FROM "${schema}".faculty 
         WHERE (user_id::text = $1 OR emp_id = $1 OR id::text = $1) LIMIT 1`,
        [userId],
      ).catch(() => []);

      const isFacultyUser = facultyRecord.length > 0 || ['FACULTY', 'HOD', 'CLERK', 'STAFF', 'TEACHER'].includes(role);

      if (isFacultyUser && facultyRecord.length > 0) {
        const facultyDeptId = facultyRecord[0]?.department_id;
        const facultyEmpId = facultyRecord[0]?.emp_id || userId;
        const facultyUserId = facultyRecord[0]?.user_id || userId;

        params.push(facultyUserId, facultyEmpId);
        const pUser = params.length - 1;
        const pEmp = params.length;

        // Faculty rule:
        // 1) Explicit member of the group
        // 2) OR Has sent a message in this group
        // 3) OR Group belongs to their department AND is an active current batch (>= 2024)
        if (facultyDeptId) {
          params.push(facultyDeptId);
          const pDept = params.length;
          whereConditions.push(`(
            EXISTS (SELECT 1 FROM "${schema}".chat_group_members m WHERE m.chat_group_id::text = g.id::text AND (m.user_id::text = $${pUser} OR m.user_id::text = $${pEmp}))
            OR EXISTS (SELECT 1 FROM "${schema}".chat_messages msg WHERE msg.chat_group_id::text = g.id::text AND (msg.sender_id::text = $${pUser} OR msg.sender_id::text = $${pEmp} OR msg.sender_name ILIKE '%${userName.replace(/'/g, "''")}%'))
            OR (g.department_id::text = $${pDept}::text AND (g.batch_year::text >= '2024' OR g.batch_year IS NULL))
          )`);
        } else {
          whereConditions.push(`(
            EXISTS (SELECT 1 FROM "${schema}".chat_group_members m WHERE m.chat_group_id::text = g.id::text AND (m.user_id::text = $${pUser} OR m.user_id::text = $${pEmp}))
            OR EXISTS (SELECT 1 FROM "${schema}".chat_messages msg WHERE msg.chat_group_id::text = g.id::text AND (msg.sender_id::text = $${pUser} OR msg.sender_id::text = $${pEmp} OR msg.sender_name ILIKE '%${userName.replace(/'/g, "''")}%'))
          )`);
        }
      } else {
        // Student: group membership, messages, or student's enrolled department/batch with active messages
        const studentRecord = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT s.department_id, s.batch_cd, s.admission_year, b.year as batch_year
           FROM "${schema}".students s
           LEFT JOIN "${schema}".batches b ON b.id::text = s.batch_id::text
           WHERE (s.user_id::text = $1 OR s.registration_no = $1 OR s.rollno = $1) LIMIT 1`,
          [userId],
        ).catch(() => []);

        const stu = studentRecord[0];
        params.push(userId);
        const pUser = params.length;

        if (stu?.department_id) {
          const sYear = String(stu.batch_year || stu.admission_year || '');
          params.push(stu.department_id);
          const pDept = params.length;
          params.push(sYear);
          const pYear = params.length;

          whereConditions.push(`(
            EXISTS (SELECT 1 FROM "${schema}".chat_group_members m WHERE m.chat_group_id::text = g.id::text AND m.user_id::text = $${pUser})
            OR EXISTS (SELECT 1 FROM "${schema}".chat_messages msg WHERE msg.chat_group_id::text = g.id::text AND (msg.sender_id::text = $${pUser} OR msg.sender_name ILIKE '%${userName.replace(/'/g, "''")}%'))
            OR (
              g.department_id::text = $${pDept}::text 
              AND ($${pYear} = '' OR g.batch_year::text = $${pYear}::text OR g.name ILIKE '%' || $${pYear} || '%')
              AND EXISTS (SELECT 1 FROM "${schema}".chat_messages msg WHERE msg.chat_group_id::text = g.id::text)
            )
          )`);
        } else {
          whereConditions.push(`(
            EXISTS (SELECT 1 FROM "${schema}".chat_group_members m WHERE m.chat_group_id::text = g.id::text AND m.user_id::text = $${pUser})
            OR EXISTS (SELECT 1 FROM "${schema}".chat_messages msg WHERE msg.chat_group_id::text = g.id::text AND (msg.sender_id::text = $${pUser} OR msg.sender_name ILIKE '%${userName.replace(/'/g, "''")}%'))
          )`);
        }
      }
    }

    if (filters?.search) {
      params.push(`%${filters.search.trim()}%`);
      whereConditions.push(`(g.name ILIKE $${params.length} OR g.department_name ILIKE $${params.length} OR g.batch_year::text ILIKE $${params.length})`);
    }

    if (filters?.department_id) {
      params.push(filters.department_id);
      whereConditions.push(`g.department_id::text = $${params.length}::text`);
    }

    if (filters?.batch_year) {
      params.push(filters.batch_year);
      whereConditions.push(`g.batch_year::text = $${params.length}::text`);
    }

    // Prepare query with unread count and latest message preview
    params.push(userId);
    const userParamIndex = params.length;

    const sql = `
      SELECT 
        g.id,
        g.name,
        g.department_id,
        g.department_name,
        g.batch_year,
        g.batch_code,
        g.description,
        g.created_at,
        (SELECT COUNT(*) FROM "${schema}".chat_group_members mem WHERE mem.chat_group_id::text = g.id::text) AS member_count,
        (
          SELECT json_build_object(
            'id', msg.id,
            'body', msg.body,
            'sender_id', msg.sender_id,
            'sender_name', COALESCE(
              NULLIF(
                CASE 
                  WHEN UPPER(TRIM(msg.sender_name)) IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY', 'ADMIN USER') THEN NULL 
                  ELSE msg.sender_name 
                END, 
                ''
              ),
              (
                SELECT f.name FROM "${schema}".faculty f 
                WHERE (f.user_id::text = msg.sender_id::text OR f.emp_id::text = msg.sender_id::text OR f.id::text = msg.sender_id::text)
                  AND f.name IS NOT NULL 
                  AND UPPER(TRIM(f.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
                LIMIT 1
              ),
              (
                SELECT u.name FROM "${schema}".users u 
                WHERE u.id::text = msg.sender_id::text 
                  AND u.name IS NOT NULL 
                  AND UPPER(TRIM(u.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
                LIMIT 1
              ),
              (
                SELECT s.name FROM "${schema}".students s 
                WHERE (s.user_id::text = msg.sender_id::text OR s.registration_no::text = msg.sender_id::text OR s.rollno::text = msg.sender_id::text)
                  AND s.name IS NOT NULL 
                  AND UPPER(TRIM(s.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
                LIMIT 1
              ),
              msg.sender_name
            ),
            'sender_role', msg.sender_role,
            'created_at', msg.created_at
          )
          FROM "${schema}".chat_messages msg
          WHERE msg.chat_group_id::text = g.id::text
          ORDER BY msg.created_at DESC
          LIMIT 1
        ) AS last_message,
        COALESCE(
          (
            SELECT COUNT(*) 
            FROM "${schema}".chat_messages unread_msg
            WHERE unread_msg.chat_group_id::text = g.id::text
              AND unread_msg.sender_id::text != $${userParamIndex}::text
              AND unread_msg.created_at > COALESCE(
                (
                  SELECT prev.created_at 
                  FROM "${schema}".chat_messages prev 
                  JOIN "${schema}".chat_read_state rs ON rs.last_read_message_id::text = prev.id::text
                  WHERE rs.chat_group_id::text = g.id::text AND rs.user_id::text = $${userParamIndex}::text
                  LIMIT 1
                ),
                '1970-01-01'::timestamptz
              )
          ), 0
        ) AS unread_count
      FROM "${schema}".chat_groups g
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY g.created_at DESC
    `;

    try {
      const groups = await this.tenantSchemaService.queryInTenant(slug, sql, params);
      return groups.map((g: any) => ({
        ...g,
        member_count: parseInt(g.member_count || '0', 10),
        unread_count: parseInt(g.unread_count || '0', 10),
      }));
    } catch (err: any) {
      this.logger.error(`Error querying chat groups in ${slug}: ${err?.message || err}`);
      // Fallback query if unread count subquery has edge case
      try {
        const fallbackGroups = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT g.*, 
            (SELECT COUNT(*) FROM "${schema}".chat_group_members mem WHERE mem.chat_group_id::text = g.id::text) AS member_count,
            0 AS unread_count
           FROM "${schema}".chat_groups g
           WHERE ${whereConditions.join(' AND ')}
           ORDER BY g.created_at DESC`,
          params.slice(0, userParamIndex - 1),
        );
        return fallbackGroups.map((g: any) => ({
          ...g,
          member_count: parseInt(g.member_count || '0', 10),
          unread_count: 0,
        }));
      } catch (fbErr: any) {
        this.logger.error(`Fallback chat groups query error: ${fbErr?.message || fbErr}`);
        return [];
      }
    }
  }

  /**
   * Get single group details
   */
  async getGroupById(tenantSlug: string, user: any, groupId: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT g.*, 
        (SELECT COUNT(*) FROM "${schema}".chat_group_members mem WHERE mem.chat_group_id::text = g.id::text) AS member_count
       FROM "${schema}".chat_groups g
       WHERE g.id::text = $1::text`,
      [groupId],
    );

    if (!rows[0]) throw new NotFoundException('Chat group not found');

    const memberCount = parseInt(rows[0].member_count || '0', 10);
    return { ...rows[0], member_count: memberCount };
  }

  /**
   * Get paginated message history for a group
   */
  async getMessages(tenantSlug: string, user: any, groupId: string, pagination: { limit?: number; before?: string } = {}) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    const limit = Math.min(pagination.limit || 50, 100);
    const params: any[] = [groupId];
    let beforeClause = '';

    if (pagination.before) {
      params.push(pagination.before);
      beforeClause = `AND m.created_at < (SELECT created_at FROM "${schema}".chat_messages WHERE id::text = $2::text)`;
    }

    params.push(limit);
    const limitIndex = params.length;

    const sql = `
      SELECT 
        m.id,
        m.chat_group_id,
        m.sender_id,
        COALESCE(
          NULLIF(
            CASE 
              WHEN UPPER(TRIM(m.sender_name)) IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY', 'ADMIN USER') THEN NULL 
              ELSE m.sender_name 
            END, 
            ''
          ),
          (
            SELECT f.name FROM "${schema}".faculty f 
            WHERE (f.user_id::text = m.sender_id::text OR f.emp_id::text = m.sender_id::text OR f.id::text = m.sender_id::text)
              AND f.name IS NOT NULL 
              AND UPPER(TRIM(f.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          (
            SELECT u.name FROM "${schema}".users u 
            WHERE u.id::text = m.sender_id::text 
              AND u.name IS NOT NULL 
              AND UPPER(TRIM(u.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          (
            SELECT s.name FROM "${schema}".students s 
            WHERE (s.user_id::text = m.sender_id::text OR s.registration_no::text = m.sender_id::text OR s.rollno::text = m.sender_id::text)
              AND s.name IS NOT NULL 
              AND UPPER(TRIM(s.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          (
            SELECT gm.name FROM "${schema}".chat_group_members gm 
            WHERE gm.user_id::text = m.sender_id::text 
              AND gm.name IS NOT NULL 
              AND UPPER(TRIM(gm.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          (
            SELECT f2.name FROM "${schema}".faculty f2 
            WHERE f2.name IS NOT NULL 
              AND UPPER(TRIM(f2.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          m.sender_name
        ) AS sender_name,
        m.sender_role,
        COALESCE(
          NULLIF(m.sender_avatar, ''),
          (
            SELECT s.photo_url FROM "${schema}".students s 
            WHERE (s.user_id::text = m.sender_id::text 
               OR s.registration_no::text = m.sender_id::text 
               OR s.rollno::text = m.sender_id::text
               OR UPPER(s.name) = UPPER(m.sender_name))
              AND s.photo_url IS NOT NULL AND s.photo_url != ''
            LIMIT 1
          ),
          (
            SELECT f.photo_url FROM "${schema}".faculty f 
            WHERE (f.user_id::text = m.sender_id::text 
               OR f.emp_id::text = m.sender_id::text
               OR UPPER(f.name) = UPPER(m.sender_name))
              AND f.photo_url IS NOT NULL AND f.photo_url != ''
            LIMIT 1
          ),
          (
            SELECT gm.avatar_url FROM "${schema}".chat_group_members gm 
            WHERE (gm.user_id::text = m.sender_id::text 
               OR UPPER(gm.name) = UPPER(m.sender_name))
              AND gm.avatar_url IS NOT NULL AND gm.avatar_url != ''
            LIMIT 1
          ),
          (
            SELECT prev.sender_avatar FROM "${schema}".chat_messages prev
            WHERE (prev.sender_id::text = m.sender_id::text OR UPPER(prev.sender_name) = UPPER(m.sender_name))
              AND prev.sender_avatar IS NOT NULL AND prev.sender_avatar != ''
            ORDER BY prev.created_at DESC
            LIMIT 1
          )
        ) AS sender_avatar,
        m.body,
        m.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'file_name', a.file_name,
                'file_type', a.file_type,
                'file_url', a.file_url,
                'file_size_kb', a.file_size_kb,
                'created_at', a.created_at
              )
            )
            FROM "${schema}".chat_attachments a
            WHERE a.message_id::text = m.id::text
          ), '[]'::json
        ) AS attachments
      FROM "${schema}".chat_messages m
      WHERE m.chat_group_id::text = $1::text ${beforeClause}
      ORDER BY m.created_at DESC
      LIMIT $${limitIndex}
    `;

    const messages = await this.tenantSchemaService.queryInTenant(slug, sql, params).catch(() => []);

    // Reverse to return in chronological order (oldest to newest)
    return messages.reverse();
  }

  /**
   * Send a message to a chat group with attachments and dispatch notifications
   */
  async sendMessage(tenantSlug: string, user: any, groupId: string, dto: SendMessageDto) {
    try {
      const slug = this.resolveTenantSlug(tenantSlug);
      const schema = `tenant_${slug}`;
      await this.ensureTables(slug);

      const senderId = user?.id || user?.sub || 'FAC001';
      let senderName = user?.name || user?.username || dto.sender_name || 'Faculty Member';
      const senderRole = (user?.role || 'FACULTY').toUpperCase();
      let senderAvatar = user?.photo_url || user?.photoUrl || dto.sender_avatar || null;

      if (!senderName || ['FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY'].includes(senderName.toUpperCase().trim())) {
        const nameLookup = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT COALESCE(
            (SELECT name FROM "${schema}".faculty WHERE (user_id::text = $1::text OR emp_id::text = $1::text OR id::text = $1::text) AND name IS NOT NULL AND UPPER(TRIM(name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY') LIMIT 1),
            (SELECT name FROM "${schema}".users WHERE id::text = $1::text AND name IS NOT NULL AND UPPER(TRIM(name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY') LIMIT 1),
            (SELECT name FROM "${schema}".students WHERE (user_id::text = $1::text OR registration_no::text = $1::text OR rollno::text = $1::text) AND name IS NOT NULL AND UPPER(TRIM(name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY') LIMIT 1),
            (SELECT name FROM "${schema}".chat_group_members WHERE user_id::text = $1::text AND name IS NOT NULL AND UPPER(TRIM(name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY') LIMIT 1),
            (SELECT name FROM "${schema}".faculty WHERE name IS NOT NULL AND UPPER(TRIM(name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY') LIMIT 1)
          ) AS name`,
          [senderId],
        ).catch(() => []);
        if (nameLookup[0]?.name) {
          senderName = nameLookup[0].name;
        }
      }

      if (!senderAvatar && senderId) {
        const avatarLookup = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT COALESCE(
            (SELECT photo_url FROM "${schema}".students WHERE (user_id::text = $1::text OR registration_no::text = $1::text OR rollno::text = $1::text OR UPPER(name) = UPPER($2::text)) AND photo_url IS NOT NULL AND photo_url != '' LIMIT 1),
            (SELECT photo_url FROM "${schema}".faculty WHERE (user_id::text = $1::text OR emp_id::text = $1::text OR UPPER(name) = UPPER($2::text)) AND photo_url IS NOT NULL AND photo_url != '' LIMIT 1),
            (SELECT avatar_url FROM "${schema}".chat_group_members WHERE (user_id::text = $1::text OR UPPER(name) = UPPER($2::text)) AND avatar_url IS NOT NULL AND avatar_url != '' LIMIT 1),
            (SELECT sender_avatar FROM "${schema}".chat_messages WHERE (sender_id::text = $1::text OR UPPER(sender_name) = UPPER($2::text)) AND sender_avatar IS NOT NULL AND sender_avatar != '' ORDER BY created_at DESC LIMIT 1)
          ) AS avatar`,
          [senderId, senderName],
        ).catch(() => []);
        senderAvatar = avatarLookup[0]?.avatar || null;
      }

      if (!dto.body?.trim() && (!dto.attachments || dto.attachments.length === 0)) {
        throw new BadRequestException('Message must contain text body or at least one attachment');
      }

      // Verify group exists
      const groupRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, name, department_name, batch_year FROM "${schema}".chat_groups WHERE id::text = $1::text`,
        [groupId],
      );
      if (!groupRows[0]) throw new NotFoundException('Chat group not found');
      const group = groupRows[0];

      // Ensure sender is enrolled in chat_group_members
      if (senderId) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO "${schema}".chat_group_members (chat_group_id, user_id, role, name, avatar_url)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (chat_group_id, user_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = COALESCE(EXCLUDED.avatar_url, "${schema}".chat_group_members.avatar_url)`,
          [groupId, senderId, senderRole, senderName, senderAvatar],
        ).catch(async () => {
          await this.tenantSchemaService.queryInTenant(
            slug,
            `UPDATE "${schema}".chat_group_members SET name = $1, avatar_url = COALESCE($4, avatar_url) WHERE chat_group_id::text = $2::text AND user_id::text = $3::text`,
            [senderName, groupId, senderId, senderAvatar],
          ).catch(() => null);
        });
      }

      // Insert message
      const msgRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".chat_messages (
          chat_group_id, sender_id, sender_name, sender_role, sender_avatar, body, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [groupId, senderId, senderName, senderRole, senderAvatar, dto.body?.trim() || ''],
      );

      const message = msgRows[0];
      const attachments: any[] = [];

      // Insert attachments if present
      if (dto.attachments && dto.attachments.length > 0) {
        for (const att of dto.attachments) {
          const fileName = att.file_name || (att as any).name || 'attachment';
          const fileType = att.file_type || (att as any).type || 'other';
          const fileUrl = att.file_url || (att as any).url || '';
          const sizeKb = Number(att.file_size_kb || 0);

          const fileData = (att as any).file_data || (att as any).data || null;

          const attRows = await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO "${schema}".chat_attachments (
              message_id, file_name, file_type, file_url, file_size_kb, file_data, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *`,
            [
              message.id,
              fileName,
              fileType,
              fileUrl,
              sizeKb,
              fileData,
            ],
          ).catch((attErr) => {
            this.logger.warn(`Error inserting attachment: ${attErr?.message || attErr}`);
            return [];
          });

          if (attRows[0]) {
            attachments.push(attRows[0]);
          } else {
            attachments.push({
              message_id: message.id,
              file_name: fileName,
              file_type: fileType,
              file_url: fileUrl,
              file_size_kb: sizeKb,
            });
          }
        }
      }

      const fullMessage = {
        ...message,
        attachments,
      };

      // Mark as read for sender
      if (senderId) {
        await this.markAsRead(slug, user, groupId, message.id).catch(() => null);
      }

      // Broadcast over WebSocket
      this.chatGateway.server?.to(`group:${groupId}`).emit('chat:message:new', {
        groupId,
        message: fullMessage,
      });

      // Also broadcast general event
      this.chatGateway.server?.emit('chat:message:broadcast', {
        groupId,
        groupName: group.name,
        message: fullMessage,
      });

      // Asynchronously dispatch dashboard notifications to other members
      this.dispatchGroupNotification(slug, group, fullMessage, senderId).catch((err) => {
        this.logger.warn(`Failed to dispatch group notification: ${err?.message}`);
      });

      return fullMessage;
    } catch (err: any) {
      this.logger.error(`Error in sendMessage: ${err?.message || err}`, err?.stack);
      throw new BadRequestException(err?.message || 'Failed to send message');
    }
  }

  /**
   * Dispatch real-time dashboard notifications for new group messages
   */
  private async dispatchGroupNotification(slug: string, group: any, message: any, senderId?: string) {
    const schema = `tenant_${slug}`;
    try {
      const summary = message.body 
        ? (message.body.length > 80 ? message.body.slice(0, 77) + '...' : message.body)
        : `Sent ${message.attachments?.length || 1} attachment(s)`;

      const title = `[Chat] ${group.name}`;
      const notifMessage = `${message.sender_name} (${message.sender_role}): ${summary}`;

      // Insert notification in notifications table
      await this.notificationsService.sendNotification(slug, {
        recipient_id: 'ALL',
        title,
        message: notifMessage,
        type: 'info',
        category: 'announcements',
      }).catch(() => null);

      // Broadcast toast to all connected clients
      this.notificationsGateway.broadcastNotification({
        id: `chat-${message.id}`,
        title,
        message: notifMessage,
        type: 'info',
        category: 'chat',
        groupId: group.id,
        senderId: message.sender_id,
        created_at: new Date().toISOString(),
        is_read: false,
      });
    } catch (e: any) {
      this.logger.warn(`Error dispatching chat notification: ${e?.message}`);
    }
  }

  /**
   * Mark group as read up to latest message
   */
  async markAsRead(tenantSlug: string, user: any, groupId: string, lastMessageId?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const userId = user?.id || user?.sub || 'FAC001';
    if (!userId) return { success: false };

    let targetMsgId = lastMessageId;
    if (!targetMsgId) {
      const latest = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM "${schema}".chat_messages WHERE chat_group_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [groupId],
      ).catch(() => []);
      targetMsgId = latest[0]?.id;
    }

    if (targetMsgId) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".chat_read_state (chat_group_id, user_id, last_read_message_id, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (chat_group_id, user_id) 
         DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id, updated_at = NOW()`,
        [groupId, userId, targetMsgId],
      ).catch(async () => {
        const upd = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${schema}".chat_read_state SET last_read_message_id = $1, updated_at = NOW() WHERE chat_group_id = $2 AND user_id = $3`,
          [targetMsgId, groupId, userId],
        ).catch(() => []);
        if (!upd?.length) {
          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO "${schema}".chat_read_state (chat_group_id, user_id, last_read_message_id, updated_at) VALUES ($1, $2, $3, NOW())`,
            [groupId, userId, targetMsgId],
          ).catch(() => null);
        }
      });
    }

    return { success: true, groupId, last_read_message_id: targetMsgId };
  }

  /**
   * Get total unread count for user across all their groups
   */
  async getUnreadCount(tenantSlug: string, user: any): Promise<{ unread_count: number; groups_with_unread: number }> {
    if (!tenantSlug || tenantSlug === 'superadmin' || tenantSlug === 'public' || tenantSlug === 'owner' || user?.role === 'SUPER_ADMIN') {
      return { unread_count: 0, groups_with_unread: 0 };
    }
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    const userId = user?.id || user?.sub;
    if (!userId) return { unread_count: 0, groups_with_unread: 0 };

    const sql = `
      SELECT 
        COUNT(DISTINCT unread_msg.id) AS total_unread,
        COUNT(DISTINCT unread_msg.chat_group_id) AS groups_with_unread
      FROM "${schema}".chat_messages unread_msg
      JOIN "${schema}".chat_group_members mem ON mem.chat_group_id::text = unread_msg.chat_group_id::text AND mem.user_id::text = $1::text
      LEFT JOIN "${schema}".chat_read_state rs 
        ON rs.chat_group_id::text = unread_msg.chat_group_id::text AND rs.user_id::text = $1::text
      LEFT JOIN "${schema}".chat_messages prev 
        ON prev.id::text = rs.last_read_message_id::text
      WHERE unread_msg.sender_id::text != $1::text
        AND (
          rs.last_read_message_id IS NULL 
          OR prev.created_at IS NULL
          OR unread_msg.created_at > prev.created_at
        )
    `;

    const res = await this.tenantSchemaService.queryInTenant(slug, sql, [userId]).catch(() => []);
    return {
      unread_count: parseInt(res[0]?.total_unread || '0', 10),
      groups_with_unread: parseInt(res[0]?.groups_with_unread || '0', 10),
    };
  }

  /**
   * Get members roster for a group
   */
  async getGroupMembers(tenantSlug: string, user: any, groupId: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    const members = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT 
        m.id,
        m.user_id,
        m.role,
        COALESCE(
          NULLIF(
            CASE 
              WHEN UPPER(TRIM(m.name)) IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY', 'ADMIN USER') THEN NULL 
              ELSE m.name 
            END, 
            ''
          ),
          (
            SELECT f.name FROM "${schema}".faculty f 
            WHERE (f.user_id::text = m.user_id::text OR f.emp_id::text = m.user_id::text OR f.id::text = m.user_id::text)
              AND f.name IS NOT NULL 
              AND UPPER(TRIM(f.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          (
            SELECT u.name FROM "${schema}".users u 
            WHERE u.id::text = m.user_id::text 
              AND u.name IS NOT NULL 
              AND UPPER(TRIM(u.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          (
            SELECT s.name FROM "${schema}".students s 
            WHERE (s.user_id::text = m.user_id::text OR s.registration_no::text = m.user_id::text OR s.rollno::text = m.user_id::text)
              AND s.name IS NOT NULL 
              AND UPPER(TRIM(s.name)) NOT IN ('FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY')
            LIMIT 1
          ),
          m.name
        ) AS name,
        COALESCE(
          NULLIF(m.avatar_url, ''),
          (
            SELECT f.photo_url FROM "${schema}".faculty f 
            WHERE (f.user_id::text = m.user_id::text OR f.emp_id::text = m.user_id::text OR f.id::text = m.user_id::text)
              AND f.photo_url IS NOT NULL AND f.photo_url != ''
            LIMIT 1
          ),
          (
            SELECT s.photo_url FROM "${schema}".students s 
            WHERE (s.user_id::text = m.user_id::text OR s.registration_no::text = m.user_id::text OR s.rollno::text = m.user_id::text)
              AND s.photo_url IS NOT NULL AND s.photo_url != ''
            LIMIT 1
          )
        ) AS avatar_url,
        m.joined_at,
        u.email
       FROM "${schema}".chat_group_members m
       LEFT JOIN "${schema}".users u ON u.id::text = m.user_id::text
       WHERE m.chat_group_id::text = $1::text
       ORDER BY 
         CASE WHEN m.role = 'FACULTY' THEN 1 WHEN m.role = 'ADMIN' THEN 2 ELSE 3 END,
         m.name ASC`,
      [groupId],
    ).catch(() => []);

    return members;
  }

  /**
   * Save uploaded attachment to local disk
   */
  async saveAttachmentFile(tenantSlug: string, file: Express.Multer.File) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const uploadDir = path.join(process.cwd(), 'uploads', 'chat', slug);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}-${cleanName}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    let fileType = 'other';
    if (['.pdf'].includes(ext)) fileType = 'pdf';
    else if (['.doc', '.docx'].includes(ext)) fileType = 'doc';
    else if (['.ppt', '.pptx'].includes(ext)) fileType = 'ppt';
    else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) fileType = 'image';

    const fileUrl = `/api/v1/chat/attachments/file/${slug}/${uniqueFilename}`;
    const sizeKb = Math.round(file.size / 1024);
    const fileData = file.buffer ? file.buffer.toString('base64') : null;

    return {
      file_name: file.originalname,
      file_type: fileType,
      file_url: fileUrl,
      file_size_kb: sizeKb,
      file_path: filePath,
      file_data: fileData,
    };
  }

  /**
   * Fetch attachment binary/base64 from PostgreSQL if physical file is missing from disk
   */
  async getAttachmentFileData(tenantSlug: string, filename: string) {
    try {
      const slug = this.resolveTenantSlug(tenantSlug);
      const schema = `tenant_${slug}`;
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT file_name, file_type, file_data FROM "${schema}".chat_attachments
         WHERE file_url LIKE $1 OR file_name = $2
         ORDER BY created_at DESC LIMIT 1`,
        [`%${filename}%`, filename],
      );
      if (rows && rows[0] && rows[0].file_data) {
        return rows[0];
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch attachment from DB: ${e.message}`);
    }
    return null;
  }

  /**
   * Faculty / User joins or pins a Course + Department + Batch group
   */
  async joinBatchGroup(tenantSlug: string, user: any, dto: any) {
    try {
      const slug = this.resolveTenantSlug(tenantSlug);
      const schema = `tenant_${slug}`;
      await this.ensureTables(slug);

      const userId = String(user?.id || user?.sub || 'FAC001');
      const userName = user?.name || user?.username || 'Faculty Member';
      const userRole = (user?.role || 'FACULTY').toUpperCase();
      const userAvatar = user?.photo_url || user?.photoUrl || null;

      let deptName = String(dto.department_name || '').trim();
      if (!deptName || deptName === '-' || deptName === 'null' || deptName === 'undefined') {
        deptName = String(dto.course_name || 'General').trim();
      }
      const batchYear = String(dto.batch_year || '2025').trim();
      const deptId = dto.department_id ? String(dto.department_id) : null;
      const batchCode = dto.batch_code ? String(dto.batch_code) : `${batchYear}-${deptName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}`;

      const groupName = `${batchYear} Batch · ${deptName}`;

      // 1. Find existing group or create one
      let group = (await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM "${schema}".chat_groups 
         WHERE (department_name ILIKE $1 OR name ILIKE $2) 
           AND (batch_year = $3 OR batch_code = $4) 
         LIMIT 1`,
        [deptName, `%${deptName}%`, batchYear, batchCode],
      ).catch(() => []))[0];

      if (!group) {
        const insRes = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO "${schema}".chat_groups (
            department_id, department_name, batch_year, batch_code, name, description
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            deptId,
            deptName,
            batchYear,
            batchCode,
            groupName,
            `Official batch group discussion for ${batchYear} · ${deptName}`,
          ],
        );
        group = insRes[0];
      }

      // 2. Enroll the faculty / user in chat_group_members
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".chat_group_members (chat_group_id, user_id, role, name, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (chat_group_id, user_id) 
         DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url`,
        [group.id, userId, userRole, userName, userAvatar],
      );

      // 3. Auto enroll all students of that department & batch into the group
      try {
        const stuRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT s.user_id::text AS user_id, s.name, s.photo_url 
           FROM "${schema}".students s 
           WHERE (s.admission_year::text = $1 OR s.batch_cd ILIKE $2)
             AND s.user_id IS NOT NULL AND s.is_active = true`,
          [batchYear, `%${batchYear}%`],
        ).catch(() => []);

        for (const stu of stuRows) {
          if (stu.user_id) {
            await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".chat_group_members (chat_group_id, user_id, role, name, avatar_url)
               VALUES ($1, $2, 'STUDENT', $3, $4)
               ON CONFLICT (chat_group_id, user_id) DO NOTHING`,
              [group.id, String(stu.user_id), stu.name, stu.photo_url || null],
            ).catch(() => null);
          }
        }
      } catch {}

      return {
        success: true,
        message: `Successfully added ${groupName} to your batch list`,
        group,
      };
    } catch (err: any) {
      this.logger.error(`Error in joinBatchGroup: ${err?.message || err}`, err?.stack);
      throw new BadRequestException(err?.message || 'Failed to add batch group');
    }
  }

  /**
   * Get available selection options (courses, departments/branches, batches)
   */
  async getAvailableSelectionOptions(tenantSlug: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureTables(slug);

    const [courses, departments, batches] = await Promise.all([
      this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT DISTINCT code AS course_cd, name AS course_name FROM "${schema}".courses WHERE is_active = true`,
      ).catch(() => []),
      this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, name, code FROM "${schema}".departments WHERE is_active = true ORDER BY name ASC`,
      ).catch(() => []),
      this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, year, course_cd, department_id FROM "${schema}".batches WHERE is_active = true ORDER BY year DESC`,
      ).catch(() => []),
    ]);

    const finalCourses = courses.length > 0 ? courses : [
      { course_cd: '13', course_name: 'B.Tech' },
      { course_cd: '14', course_name: 'BCA' },
      { course_cd: '15', course_name: 'MCA' },
      { course_cd: '1', course_name: 'MBBS' },
    ];

    return {
      courses: finalCourses.filter((c: any) => c.course_cd || c.course_name),
      departments,
      batches: batches.length > 0 ? batches : [
        { year: 2025, code: '2025' },
        { year: 2024, code: '2024' },
        { year: 2023, code: '2023' },
        { year: 2022, code: '2022' },
      ],
    };
  }
}

