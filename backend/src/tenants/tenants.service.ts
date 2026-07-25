import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateTenantDto, UpdateTenantDto, TenantSettingsDto } from './dto/tenant.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly authService: AuthService,
    private readonly schemaService: TenantSchemaService,
  ) {}

  // ─── LIST ─────────────────────────────────────────────────────────────────
  async findAll(pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const where = search
      ? `WHERE name ILIKE '%' || $3 || '%' OR slug ILIKE '%' || $3 || '%'`
      : '';

    const params = search ? [limit, offset, search] : [limit, offset];

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT id, name, slug, type, is_active, schema_provisioned,
                address, phone, website, settings, created_at, updated_at
         FROM public.tenants ${where}
         ORDER BY name ASC
         LIMIT $1 OFFSET $2`,
        params,
      ),
      this.ds.query(
        `SELECT COUNT(*) FROM public.tenants ${where}`,
        search ? [search] : [],
      ),
    ]);

    return paginate(rows, parseInt(countRows[0].count, 10), pagination);
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const rows = await this.ds.query(
      `SELECT id, name, slug, type, is_active, schema_provisioned,
              address, phone, website, settings, created_at, updated_at
       FROM public.tenants WHERE id=$1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Tenant '${id}' not found`);
    return rows[0];
  }

  async findBySlug(slug: string) {
    const rows = await this.ds.query(
      `SELECT id, name, slug, type, is_active, schema_provisioned, settings
       FROM public.tenants WHERE slug=$1`,
      [slug],
    );
    if (!rows[0]) throw new NotFoundException(`Tenant '${slug}' not found`);
    return rows[0];
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: CreateTenantDto) {
    // Check slug uniqueness
    const existing = await this.ds.query(
      `SELECT id FROM public.tenants WHERE slug=$1`,
      [dto.slug],
    );
    if (existing.length) {
      throw new ConflictException(`Slug '${dto.slug}' is already in use`);
    }

    // Check email uniqueness across all tenants (advisory)
    const emailCheck = await this.ds.query(
      `SELECT id FROM public.tenants WHERE LOWER(settings->>'adminEmail') = $1`,
      [dto.adminEmail.toLowerCase()],
    );
    if (emailCheck.length) {
      throw new ConflictException('An admin with this email already exists in another institution');
    }

    // Hash admin password
    const passwordHash = await this.authService.hashPassword(dto.adminPassword);

    // Create tenant record
    const tenantRows = await this.ds.query(
      `INSERT INTO public.tenants
         (name, slug, type, is_active, address, phone, website, settings)
       VALUES ($1,$2,$3,true,$4,$5,$6,$7)
       RETURNING id, name, slug, type`,
      [
        dto.name,
        dto.slug.toLowerCase(),
        dto.type,
        dto.address ?? null,
        dto.phone ?? null,
        dto.website ?? null,
        JSON.stringify({ ...dto.settings, adminEmail: dto.adminEmail }),
      ],
    );

    const tenant = tenantRows[0];

    // Provision schema (async — creates all tables)
    await this.schemaService.provisionSchema(dto.slug);

    // Create the first ADMIN user inside the tenant schema
    const schema = `tenant_${dto.slug}`;
    await this.ds.query(
      `INSERT INTO "${schema}".users (email, password_hash, role, must_change_password, onboarding_completed)
       VALUES ($1,$2,$3,false,false)`,
      [dto.adminEmail.toLowerCase(), passwordHash, UserRole.ADMIN],
    );

    this.logger.log(`Tenant created: ${dto.slug} (${tenant.id})`);

    return {
      ...tenant,
      message: 'Tenant provisioned. Admin credentials are ready.',
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id); // throws if not found

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (dto.name !== undefined) { sets.push(`name=$${i++}`); params.push(dto.name); }
    if (dto.address !== undefined) { sets.push(`address=$${i++}`); params.push(dto.address); }
    if (dto.phone !== undefined) { sets.push(`phone=$${i++}`); params.push(dto.phone); }
    if (dto.website !== undefined) { sets.push(`website=$${i++}`); params.push(dto.website); }
    if (dto.type !== undefined) { sets.push(`type=$${i++}`); params.push(dto.type); }

    if (!sets.length) throw new BadRequestException('No fields to update');

    sets.push(`updated_at=NOW()`);
    params.push(id);

    await this.ds.query(
      `UPDATE public.tenants SET ${sets.join(', ')} WHERE id=$${i}`,
      params,
    );

    return this.findOne(id);
  }

  // ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────
  async toggleActive(id: string) {
    const tenant = await this.findOne(id);
    await this.ds.query(
      `UPDATE public.tenants SET is_active=$1, updated_at=NOW() WHERE id=$2`,
      [!tenant.is_active, id],
    );
    return { id, isActive: !tenant.is_active };
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  async updateSettings(id: string, dto: TenantSettingsDto) {
    const tenant = await this.findOne(id);
    const current = tenant.settings ?? {};
    const merged = { ...current, ...dto };

    await this.ds.query(
      `UPDATE public.tenants SET settings=$1, updated_at=NOW() WHERE id=$2`,
      [JSON.stringify(merged), id],
    );

    return merged;
  }

  // ─── STATS ────────────────────────────────────────────────────────────────
  async getTenantStats(slug: string) {
    const schema = `tenant_${slug}`;
    const [[studentsRow], [facultyRow], [deptRow]] = await Promise.all([
      this.ds.query(`SELECT COUNT(*) FROM "${schema}".students WHERE is_active=true`),
      this.ds.query(`SELECT COUNT(*) FROM "${schema}".faculty WHERE is_active=true`),
      this.ds.query(`SELECT COUNT(*) FROM "${schema}".departments WHERE is_active=true`),
    ]);

    return {
      students: parseInt(studentsRow.count, 10),
      faculty: parseInt(facultyRow.count, 10),
      departments: parseInt(deptRow.count, 10),
    };
  }
}
