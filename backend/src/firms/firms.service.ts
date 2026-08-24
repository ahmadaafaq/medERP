import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FirmMode, FirmStatus, FirmLevelType } from '../database/entities/firm.entity';
import { MenuRole } from '../database/entities/menu-registry.entity';
import { CreateFirmDto } from './dto/create-firm.dto';
import { UpdateFirmDto } from './dto/update-firm.dto';
import { UpdateRolePermissionsDto } from './dto/role-permission.dto';

@Injectable()
export class FirmsService {
  private readonly logger = new Logger(FirmsService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Create a new firm record (Steps 1–4)
   */
  async createFirm(dto: CreateFirmDto) {
    const cleanSlug = dto.slug.toLowerCase().trim();

    // Validate slug uniqueness
    const slugExists = await this.dataSource.query(
      `SELECT id FROM public.firms WHERE slug = $1 LIMIT 1`,
      [cleanSlug],
    );
    if (slugExists.length > 0) {
      throw new ConflictException(`Firm with slug '${cleanSlug}' already exists.`);
    }

    if (dto.domain) {
      const domainExists = await this.dataSource.query(
        `SELECT id FROM public.firms WHERE domain = $1 LIMIT 1`,
        [dto.domain.trim()],
      );
      if (domainExists.length > 0) {
        throw new ConflictException(`Firm with domain '${dto.domain}' already exists.`);
      }
    }

    const now = new Date();
    const trialDays = dto.trial_days ?? 14;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const levelType = dto.level_type || FirmLevelType.STANDARD;
    const themeColor = dto.theme_color || '#5B4BFF';
    const firmMode = dto.firm_mode || FirmMode.MED;

    const rows = await this.dataSource.query(
      `INSERT INTO public.firms (
        title, slug, tenant_name, domain, logo_url, cover_url, banner_url,
        level_type, theme_color, firm_mode, status, trial_days, trial_started_at, trial_ends_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        dto.title.trim(),
        cleanSlug,
        dto.tenant_name.trim(),
        dto.domain?.trim() || null,
        dto.logo_url || null,
        dto.cover_url || null,
        dto.banner_url || null,
        levelType,
        themeColor,
        firmMode,
        FirmStatus.TRIAL,
        trialDays,
        now,
        trialEndsAt,
      ],
    );

    const savedFirm = rows[0];

    // Auto-provision tenant schema and clone all tables
    const targetSchema = `tenant_${cleanSlug}`;
    try {
      await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}"`);
      const tables = await this.dataSource.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_type = 'BASE TABLE'`
      );
      for (const t of tables) {
        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS "${targetSchema}"."${t.table_name}" (LIKE "tenant_srms-cet-bareilly"."${t.table_name}" INCLUDING ALL)`
        ).catch(() => {});
      }
      await this.dataSource.query(
        `INSERT INTO public.tenants (id, name, slug, code, is_active, schema_provisioned, created_at, updated_at)
         VALUES ($1, $2, $3, $3, true, true, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, schema_provisioned = true, updated_at = NOW()`,
        [savedFirm.id, savedFirm.title, cleanSlug],
      );
    } catch (e: any) {
      this.logger.warn(`Could not auto-provision schema for ${cleanSlug}: ${e.message}`);
    }

    // Auto-seed default role permissions for all 5 roles from menu_registry
    try {
      const modeCondition = firmMode === 'MED' ? `('MED', 'BOTH')` : `('NONMED', 'BOTH')`;
      const menuItems = await this.dataSource.query(
        `SELECT role, menu_key FROM public.menu_registry WHERE applicable_firm_mode IN ${modeCondition}`
      );
      for (const m of menuItems) {
        await this.dataSource.query(
          `INSERT INTO public.firm_role_permissions (firm_id, role, menu_key, is_enabled, created_at, updated_at)
           VALUES ($1, $2, $3, true, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [savedFirm.id, m.role, m.menu_key],
        );
      }
      this.logger.log(`Auto-seeded ${menuItems.length} default role permissions for firm '${savedFirm.title}'`);
    } catch (e: any) {
      this.logger.warn(`Could not auto-seed role permissions for ${cleanSlug}: ${e.message}`);
    }

    this.logger.log(`Created firm '${savedFirm.title}' (ID: ${savedFirm.id}, Slug: ${savedFirm.slug}) with ${trialDays} trial days`);

    return savedFirm;
  }

  /**
   * List all firms
   */
  async findAll() {
    return await this.dataSource.query(
      `SELECT * FROM public.firms ORDER BY created_at DESC`,
    );
  }

  /**
   * Find single firm by ID with active license key summary
   */
  async findOne(idOrSlug: string) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const firms = isUuid
      ? await this.dataSource.query(`SELECT * FROM public.firms WHERE id = $1 LIMIT 1`, [idOrSlug])
      : await this.dataSource.query(`SELECT * FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`, [idOrSlug.toLowerCase()]);

    if (firms.length === 0) {
      throw new NotFoundException(`Firm '${idOrSlug}' not found`);
    }

    const firm = firms[0];
    let licenseKeys = [];
    let transactions = [];
    try {
      licenseKeys = await this.dataSource.query(
        `SELECT id, key_prefix, duration_days, amount, issued_at, expires_at, status, created_at FROM public.license_keys WHERE firm_id = $1 ORDER BY created_at DESC`,
        [firm.id],
      );
    } catch {}

    try {
      transactions = await this.dataSource.query(
        `SELECT * FROM public.transactions WHERE firm_id = $1 ORDER BY created_at DESC`,
        [firm.id],
      );
    } catch {}

    firm.license_keys = licenseKeys;
    firm.transactions = transactions;
    return firm;
  }

  /**
   * Update firm details
   */
  async update(idOrSlug: string, dto: UpdateFirmDto) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const existing = isUuid
      ? await this.dataSource.query(`SELECT * FROM public.firms WHERE id = $1 LIMIT 1`, [idOrSlug])
      : await this.dataSource.query(`SELECT * FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`, [idOrSlug.toLowerCase()]);

    if (existing.length === 0) {
      throw new NotFoundException(`Firm '${idOrSlug}' not found`);
    }

    const firm = existing[0];
    const cleanSlug = dto.slug ? dto.slug.toLowerCase().trim() : firm.slug;

    if (dto.slug && cleanSlug !== firm.slug) {
      const slugCheck = await this.dataSource.query(
        `SELECT id FROM public.firms WHERE slug = $1 AND id != $2 LIMIT 1`,
        [cleanSlug, firm.id],
      );
      if (slugCheck.length > 0) {
        throw new ConflictException(`Firm with slug '${cleanSlug}' already exists`);
      }
    }

    const rows = await this.dataSource.query(
      `UPDATE public.firms SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        tenant_name = COALESCE($3, tenant_name),
        domain = COALESCE($4, domain),
        logo_url = COALESCE($5, logo_url),
        cover_url = COALESCE($6, cover_url),
        banner_url = COALESCE($7, banner_url),
        level_type = COALESCE($8, level_type),
        theme_color = COALESCE($9, theme_color),
        firm_mode = COALESCE($10, firm_mode),
        status = COALESCE($11, status),
        trial_days = COALESCE($12, trial_days),
        trial_ends_at = CASE 
          WHEN $12::int IS NOT NULL THEN (NOW() + ($12::int || ' days')::interval)
          ELSE trial_ends_at 
        END,
        theme_config = CASE
          WHEN $13::jsonb IS NOT NULL THEN $13::jsonb
          ELSE theme_config
        END,
        updated_at = NOW()
      WHERE id = $14
      RETURNING *`,
      [
        dto.title !== undefined ? dto.title.trim() : null,
        cleanSlug,
        dto.tenant_name !== undefined ? dto.tenant_name.trim() : null,
        dto.domain !== undefined ? dto.domain?.trim() || null : null,
        dto.logo_url !== undefined ? dto.logo_url : null,
        dto.cover_url !== undefined ? dto.cover_url : null,
        dto.banner_url !== undefined ? dto.banner_url : null,
        dto.level_type !== undefined ? dto.level_type : null,
        dto.theme_color !== undefined ? dto.theme_color : null,
        dto.firm_mode !== undefined ? dto.firm_mode : null,
        dto.status !== undefined ? dto.status : null,
        dto.trial_days !== undefined ? dto.trial_days : null,
        dto.theme_config !== undefined ? JSON.stringify(dto.theme_config) : null,
        firm.id,
      ],
    );

    if (dto.status) {
      if (dto.status === 'SUSPENDED') {
        await this.dataSource.query(`UPDATE public.license_keys SET status = 'SUSPENDED', updated_at = NOW() WHERE firm_id = $1`, [firm.id]);
      } else if (dto.status === 'EXPIRED') {
        await this.dataSource.query(`UPDATE public.license_keys SET status = 'EXPIRED', updated_at = NOW() WHERE firm_id = $1`, [firm.id]);
      } else if (dto.status === 'ACTIVE') {
        await this.dataSource.query(`UPDATE public.license_keys SET status = 'ACTIVE', updated_at = NOW() WHERE firm_id = $1 AND expires_at > NOW()`, [firm.id]);
      }
    }

    return rows[0];
  }

  /**
   * Real-time status lookup by slug (used by Next.js middleware)
   */
  async getFirmStatusBySlug(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();
    const rows = await this.dataSource.query(
      `SELECT * FROM public.firms WHERE slug = $1 LIMIT 1`,
      [cleanSlug],
    );

    if (rows.length === 0) {
      return {
        exists: false,
        status: FirmStatus.EXPIRED,
        isValid: false,
        message: `Firm '${slug}' is not registered`,
      };
    }

    const firm = rows[0];
    const now = new Date();
    let isValid = false;
    let licenseExpiresAt: Date | null = null;

    // Check active license
    const licenses = await this.dataSource.query(
      `SELECT * FROM public.license_keys WHERE firm_id = $1 AND status = 'ACTIVE' ORDER BY expires_at DESC LIMIT 1`,
      [firm.id],
    );

    if (licenses.length > 0) {
      const activeLicense = licenses[0];
      licenseExpiresAt = activeLicense.expires_at;
      if (new Date(activeLicense.expires_at) > now && firm.status !== FirmStatus.SUSPENDED) {
        isValid = true;
      } else if (new Date(activeLicense.expires_at) <= now) {
        await this.dataSource.query(
          `UPDATE public.license_keys SET status = 'EXPIRED' WHERE id = $1`,
          [activeLicense.id],
        );
        await this.dataSource.query(
          `UPDATE public.firms SET status = 'EXPIRED' WHERE id = $1`,
          [firm.id],
        );
        firm.status = FirmStatus.EXPIRED;
      }
    } else {
      if (firm.trial_ends_at && new Date(firm.trial_ends_at) > now && firm.status !== FirmStatus.SUSPENDED) {
        isValid = true;
        licenseExpiresAt = firm.trial_ends_at;
      } else {
        await this.dataSource.query(
          `UPDATE public.firms SET status = 'EXPIRED' WHERE id = $1`,
          [firm.id],
        );
        firm.status = FirmStatus.EXPIRED;
      }
    }

    return {
      exists: true,
      id: firm.id,
      title: firm.title,
      slug: firm.slug,
      status: firm.status,
      firm_mode: firm.firm_mode,
      theme_color: firm.theme_color,
      trialEndsAt: firm.trial_ends_at,
      licenseExpiresAt,
      isValid,
    };
  }

  /**
   * Get role permissions for firm (supports UUID or slug)
   */
  async getFirmPermissions(firmIdOrSlug: string, role?: MenuRole) {
    let firmId = firmIdOrSlug;
    const clean = firmIdOrSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');

    // If not UUID, look up ID by slug or title
    if (!firmIdOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const firm = await this.dataSource.query(
        `SELECT id FROM public.firms WHERE LOWER(slug) = $1 OR LOWER(slug) = $2 OR LOWER(title) ILIKE $3 LIMIT 1`,
        [clean, firmIdOrSlug.toLowerCase(), `%${clean}%`],
      );
      if (firm.length > 0) {
        firmId = firm[0].id;
      } else {
        return [];
      }
    }

    if (role) {
      return await this.dataSource.query(
        `SELECT * FROM public.firm_role_permissions WHERE firm_id = $1 AND role = $2`,
        [firmId, role],
      );
    }
    return await this.dataSource.query(
      `SELECT * FROM public.firm_role_permissions WHERE firm_id = $1`,
      [firmId],
    );
  }

  /**
   * Save selected menu keys for a firm role
   */
  async updateFirmPermissions(firmId: string, dto: UpdateRolePermissionsDto) {
    // Delete existing permissions for this firm + role
    await this.dataSource.query(
      `DELETE FROM public.firm_role_permissions WHERE firm_id = $1 AND role = $2`,
      [firmId, dto.role],
    );

    for (const key of dto.menu_keys) {
      await this.dataSource.query(
        `INSERT INTO public.firm_role_permissions (firm_id, role, menu_key, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())`,
        [firmId, dto.role, key],
      );
    }

    return {
      success: true,
      firm_id: firmId,
      role: dto.role,
      enabled_count: dto.menu_keys.length,
    };
  }

  /**
   * Provision or update Firm Admin credentials inside tenant_{slug}.users
   */
  async provisionAdmin(
    firmId: string,
    dto: { email: string; password: string; name?: string; phone?: string; username?: string },
  ) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email/Username and Password are required to provision Firm Admin');
    }

    const firms = await this.dataSource.query(
      `SELECT id, slug, title FROM public.firms WHERE id = $1 LIMIT 1`,
      [firmId],
    );

    if (firms.length === 0) {
      throw new NotFoundException(`Firm with ID '${firmId}' not found`);
    }

    const firm = firms[0];
    const cleanSlug = firm.slug.toLowerCase().trim();
    const schema = `tenant_${cleanSlug}`;

    // Ensure schema and tables exist
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    
    // Create users table in tenant schema if not exists
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL DEFAULT 'COLLEGE_ADMIN',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        failed_login_count INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Ensure columns exist if table was created previously without them
    await this.dataSource.query(`
      ALTER TABLE "${schema}".users 
        ADD COLUMN IF NOT EXISTS username VARCHAR(100),
        ADD COLUMN IF NOT EXISTS name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    `);

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanUsername = (dto.username || cleanEmail.split('@')[0]).trim().toLowerCase();
    const name = dto.name?.trim() || `${firm.title} Administrator`;
    const phone = dto.phone?.trim() || null;

    const rows = await this.dataSource.query(
      `INSERT INTO "${schema}".users (
        email, username, password_hash, name, phone, role, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'COLLEGE_ADMIN', true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, "${schema}".users.phone),
        role = 'COLLEGE_ADMIN',
        is_active = true,
        updated_at = NOW()
      RETURNING id, email, username, name, phone, role, is_active, created_at, updated_at`,
      [cleanEmail, cleanUsername, passwordHash, name, phone],
    );

    this.logger.log(`Provisioned Firm Admin (${cleanEmail}) for firm '${firm.title}' in schema ${schema}`);

    return {
      success: true,
      message: `Admin credentials successfully created for ${firm.title}. Admin can now log in at /login with username "${cleanEmail}".`,
      firm_id: firm.id,
      firm_slug: firm.slug,
      admin: rows[0],
    };
  }

  /**
   * Get all Admin user accounts for a firm
   */
  async getFirmAdmins(firmId: string) {
    const firms = await this.dataSource.query(
      `SELECT id, slug, title FROM public.firms WHERE id = $1 LIMIT 1`,
      [firmId],
    );

    if (firms.length === 0) {
      throw new NotFoundException(`Firm with ID '${firmId}' not found`);
    }

    const firm = firms[0];
    const schema = `tenant_${firm.slug.toLowerCase().trim()}`;

    try {
      await this.dataSource.query(`
        ALTER TABLE "${schema}".users 
          ADD COLUMN IF NOT EXISTS username VARCHAR(100),
          ADD COLUMN IF NOT EXISTS name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      `).catch(() => {});

      const admins = await this.dataSource.query(
        `SELECT id, email, username, name, phone, role, is_active, last_login_at, created_at, updated_at
         FROM "${schema}".users
         WHERE role IN ('COLLEGE_ADMIN', 'ADMIN', 'SUPER_ADMIN')
         ORDER BY created_at DESC`
      );
      return admins;
    } catch (err: any) {
      this.logger.warn(`Could not query admins from schema ${schema}: ${err.message}`);
      return [];
    }
  }

  /**
   * Delete / De-register a firm and cascade permissions
   */
  async deleteFirm(firmId: string) {
    const firms = await this.dataSource.query(
      `SELECT id, title, slug FROM public.firms WHERE id = $1 LIMIT 1`,
      [firmId],
    );

    if (firms.length === 0) {
      throw new NotFoundException(`Firm with ID '${firmId}' not found`);
    }

    const firm = firms[0];

    await this.dataSource.query(
      `DELETE FROM public.firm_role_permissions WHERE firm_id = $1`,
      [firmId],
    );
    await this.dataSource.query(
      `DELETE FROM public.license_keys WHERE firm_id = $1`,
      [firmId],
    );
    await this.dataSource.query(
      `DELETE FROM public.transactions WHERE firm_id = $1`,
      [firmId],
    );
    await this.dataSource.query(
      `DELETE FROM public.firms WHERE id = $1`,
      [firmId],
    );

    this.logger.log(`Deleted firm '${firm.title}' (ID: ${firmId})`);

    return {
      success: true,
      message: `Firm '${firm.title}' has been successfully removed.`,
      deleted_id: firmId,
    };
  }

  /**
   * Delete a single permission menu key for a role
   */
  async deleteFirmPermission(firmId: string, role: MenuRole, menuKey: string) {
    await this.dataSource.query(
      `DELETE FROM public.firm_role_permissions WHERE firm_id = $1 AND role = $2 AND menu_key = $3`,
      [firmId, role, menuKey],
    );

    return {
      success: true,
      message: `Menu right '${menuKey}' removed for role ${role}.`,
    };
  }

  /**
   * Daily scheduled sweep: marks expired trials and expired licenses as EXPIRED
   */
  async sweepExpiredLicensing(): Promise<{ updatedTrials: number; updatedLicenses: number }> {
    const now = new Date();

    const trialRes = await this.dataSource.query(
      `UPDATE public.firms SET status = 'EXPIRED' WHERE status = 'TRIAL' AND trial_ends_at < $1`,
      [now],
    );

    const licenseRes = await this.dataSource.query(
      `UPDATE public.license_keys SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at < $1`,
      [now],
    );

    this.logger.log(`Licensing sweep complete.`);
    return {
      updatedTrials: trialRes[1] || 0,
      updatedLicenses: licenseRes[1] || 0,
    };
  }

  /**
   * Fetch active theme for tenant (falls back cleanly to platform default)
   */
  async getTenantTheme(idOrSlug: string) {
    const defaultTheme = {
      primary_color: '#F36C21',
      secondary_color: '#E05B10',
      accent_color: '#F36C21',
      danger_color: '#E02424',
      success_color: '#0E9F6E',
      warning_color: '#D97706',
      page_bg: '#F7F8FA',
      sidebar_bg: '#FFFFFF',
      sidebar_text_color: '#11141A',
      header_bg: '#FFFFFF',
      card_bg: '#FFFFFF',
      font_family: 'Inter',
      base_font_size: '14px',
      card_radius: '20px',
      border_radius_scale: 'rounded',
      login_bg_type: 'gradient',
      login_bg_url: '',
      table_header_bg: '#F9FAFB',
      table_zebra: true,
      theme_mode: 'LIGHT',
      version: 3,
    };

    if (!idOrSlug) {
      return {
        tenant_id: null,
        tenant_slug: null,
        title: 'Platform Default',
        logo_url: null,
        favicon_url: null,
        theme_color: defaultTheme.primary_color,
        theme_config: defaultTheme,
        updated_at: new Date().toISOString(),
        updated_by: 'SYSTEM',
      };
    }

    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const cleanSlug = idOrSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');

    const rows = isUuid
      ? await this.dataSource.query(`SELECT * FROM public.firms WHERE id = $1 LIMIT 1`, [idOrSlug])
      : await this.dataSource.query(`SELECT * FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`, [cleanSlug]);

    if (rows.length === 0) {
      return {
        tenant_id: null,
        tenant_slug: cleanSlug,
        title: cleanSlug,
        logo_url: null,
        favicon_url: null,
        theme_color: defaultTheme.primary_color,
        theme_config: defaultTheme,
        updated_at: new Date().toISOString(),
        updated_by: 'SYSTEM',
      };
    }

    const firm = rows[0];
    const existingConfig = firm.theme_config || {};
    const mergedConfig = {
      ...defaultTheme,
      ...existingConfig,
      primary_color: existingConfig.primary_color || firm.theme_color || defaultTheme.primary_color,
      sidebar_bg: existingConfig.sidebar_bg || defaultTheme.sidebar_bg,
      header_bg: existingConfig.header_bg || existingConfig.sidebar_bg || defaultTheme.header_bg,
    };

    return {
      tenant_id: firm.id,
      tenant_slug: firm.slug,
      title: firm.title,
      logo_url: firm.logo_url || null,
      favicon_url: firm.favicon_url || null,
      theme_color: mergedConfig.primary_color,
      theme_config: mergedConfig,
      updated_at: firm.updated_at,
      updated_by: firm.updated_by || 'OWNER',
    };
  }

  /**
   * Update or upsert tenant theme
   */
  async updateTenantTheme(idOrSlug: string, dto: any, updatedBy: string = 'OWNER') {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const cleanSlug = idOrSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');

    const existing = isUuid
      ? await this.dataSource.query(`SELECT * FROM public.firms WHERE id = $1 LIMIT 1`, [idOrSlug])
      : await this.dataSource.query(`SELECT * FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`, [cleanSlug]);

    if (existing.length === 0) {
      throw new NotFoundException(`Tenant firm '${idOrSlug}' not found.`);
    }

    const firm = existing[0];
    const prevConfig = firm.theme_config || {};
    const nextVersion = (prevConfig.version || 1) + 1;

    const newConfig = {
      ...prevConfig,
      ...(dto.theme_config || {}),
      primary_color: dto.primary_color || dto.theme_config?.primary_color || prevConfig.primary_color || firm.theme_color || '#F36C21',
      secondary_color: dto.secondary_color || dto.theme_config?.secondary_color || prevConfig.secondary_color || '#E05B10',
      accent_color: dto.accent_color || dto.theme_config?.accent_color || prevConfig.accent_color || '#F36C21',
      danger_color: dto.danger_color || dto.theme_config?.danger_color || prevConfig.danger_color || '#E02424',
      success_color: dto.success_color || dto.theme_config?.success_color || prevConfig.success_color || '#0E9F6E',
      warning_color: dto.warning_color || dto.theme_config?.warning_color || prevConfig.warning_color || '#D97706',
      page_bg: dto.page_bg || dto.theme_config?.page_bg || prevConfig.page_bg || '#F7F8FA',
      sidebar_bg: dto.sidebar_bg || dto.theme_config?.sidebar_bg || prevConfig.sidebar_bg || '#14171F',
      sidebar_text_color: dto.sidebar_text_color || dto.theme_config?.sidebar_text_color || prevConfig.sidebar_text_color || '#FFFFFF',
      header_bg: dto.header_bg || dto.theme_config?.header_bg || prevConfig.header_bg || '#14171F',
      card_bg: dto.card_bg || dto.theme_config?.card_bg || prevConfig.card_bg || '#FFFFFF',
      font_family: dto.font_family || dto.theme_config?.font_family || prevConfig.font_family || 'Inter',
      base_font_size: dto.base_font_size || dto.theme_config?.base_font_size || prevConfig.base_font_size || '14px',
      card_radius: dto.card_radius || dto.theme_config?.card_radius || prevConfig.card_radius || '22px',
      border_radius_scale: dto.border_radius_scale || dto.theme_config?.border_radius_scale || prevConfig.border_radius_scale || 'rounded',
      login_bg_type: dto.login_bg_type || dto.theme_config?.login_bg_type || prevConfig.login_bg_type || 'gradient',
      login_bg_url: dto.login_bg_url !== undefined ? dto.login_bg_url : prevConfig.login_bg_url || '',
      table_header_bg: dto.table_header_bg || dto.theme_config?.table_header_bg || prevConfig.table_header_bg || '#F8FAFC',
      table_zebra: dto.table_zebra !== undefined ? dto.table_zebra : (prevConfig.table_zebra !== false),
      theme_mode: dto.theme_mode || dto.theme_config?.theme_mode || prevConfig.theme_mode || 'LIGHT',
      version: nextVersion,
    };

    const logoUrl = dto.logo_url !== undefined ? dto.logo_url : firm.logo_url;
    const faviconUrl = dto.favicon_url !== undefined ? dto.favicon_url : firm.favicon_url;

    const rows = await this.dataSource.query(
      `UPDATE public.firms SET
        theme_color = $1,
        theme_config = $2::jsonb,
        logo_url = $3,
        favicon_url = $4,
        updated_by = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [
        newConfig.primary_color,
        JSON.stringify(newConfig),
        logoUrl,
        faviconUrl,
        updatedBy || 'OWNER',
        firm.id,
      ],
    );

    const updatedFirm = rows[0];
    return {
      tenant_id: updatedFirm.id,
      tenant_slug: updatedFirm.slug,
      title: updatedFirm.title,
      logo_url: updatedFirm.logo_url,
      favicon_url: updatedFirm.favicon_url,
      theme_color: newConfig.primary_color,
      theme_config: newConfig,
      updated_at: updatedFirm.updated_at,
      updated_by: updatedFirm.updated_by,
    };
  }
}
