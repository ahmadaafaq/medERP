import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as https from 'https';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateProfessionalLinkerDto, UpdateProfessionalLinkerDto,
  CreateDepartmentMasterDto, UpdateDepartmentMasterDto,
  CreateSubjectMasterDto, UpdateSubjectMasterDto,
  CreateTopicMasterDto, UpdateTopicMasterDto,
  CreateCompetencyMasterDto, UpdateCompetencyMasterDto,
  CreateDeliveryTypeDto, UpdateDeliveryTypeDto,
  CreateSubjectOfferingDto, UpdateSubjectOfferingDto,
  LinkFacultySubjectDto,
  CreateUnitMasterDto, UpdateUnitMasterDto,
} from './dto/admin-master.dto';

const _srmsAdminAgent = new https.Agent({ rejectUnauthorized: false });
async function srmsFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, ...((_srmsAdminAgent as any) ? { dispatcher: undefined } : {}), } as any).catch(() => {
    return new Promise<Response>((resolve, reject) => {
      const urlObj = new URL(url);
      const postData = (init.body as string) || '';
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: (init.method || 'POST').toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...((init.headers as Record<string, string>) || {}),
        },
        rejectUnauthorized: false,
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve(new Response(data, {
            status: res.statusCode || 200,
            headers: res.headers as any,
          }));
        });
      });
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  });
}

@Injectable()
export class AdminMasterService {
  private readonly logger = new Logger(AdminMasterService.name);
  private ensuredSchemas = new Set<string>();

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private isUUID(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  private async resolveTenantSlug(tenantSlugOrId?: string): Promise<string> {
    if (!tenantSlugOrId) return 'srms-ims';
    if (tenantSlugOrId === 'all') return 'all';
    const clean = String(tenantSlugOrId).trim().toLowerCase();
    if (clean === 'srms') return 'srms-ims';
    try {
      const rows = await this.ds.query(
        `SELECT slug FROM public.tenants
         WHERE LOWER(slug) = LOWER($1) OR LOWER(code) = LOWER($1) OR id::text = $1
         LIMIT 1`,
        [clean],
      );
      if (rows.length > 0 && rows[0].slug) {
        return rows[0].slug;
      }
    } catch (e) {}
    return this.tenantSchemaService.resolveTenantSlug(clean);
  }

  private async ensureAdminMasterTables(slug: string): Promise<void> {
    if (!slug || slug === 'all') return;
    if (this.ensuredSchemas.has(slug)) return;
    this.ensuredSchemas.add(slug);

    const schema = `tenant_${slug}`;
    try {
      await this.ds.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});

      // 0. departments schema cleanup
      await this.ds.query(`DROP INDEX IF EXISTS "${schema}".departments_code_idx;`).catch(() => {});
      await this.ds.query(`ALTER TABLE "${schema}".departments DROP CONSTRAINT IF EXISTS departments_code_key;`).catch(() => {});
      await this.ds.query(`ALTER TABLE "${schema}".departments DROP CONSTRAINT IF EXISTS departments_code_idx;`).catch(() => {});
      await this.ds.query(`ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);`).catch(() => {});
      await this.ds.query(`ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);`).catch(() => {});
      await this.ds.query(`ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);`).catch(() => {});
      await this.ds.query(`ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);`).catch(() => {});

      // 1. professional_linkers
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".professional_linkers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) NOT NULL,
          name VARCHAR(200) NOT NULL,
          course_cd VARCHAR(50),
          professional_phase VARCHAR(100),
          academic_session VARCHAR(100),
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. delivery_types
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".delivery_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE "${schema}".delivery_types ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE "${schema}".delivery_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `);

      // 3. units
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".units (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) NOT NULL,
          name VARCHAR(200),
          description TEXT NOT NULL,
          subject_id UUID,
          subject_code VARCHAR(50),
          course_cd VARCHAR(50),
          course_name VARCHAR(200),
          branch_cd VARCHAR(50),
          batch_id UUID,
          batch_year INT,
          bloom_level VARCHAR(50) DEFAULT 'KL-2 (Understand)',
          unit_order INT DEFAULT 1,
          hours INT DEFAULT 10,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS batch_id UUID;
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS batch_year INT;
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(50) DEFAULT 'KL-2 (Understand)';
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS unit_order INT DEFAULT 1;
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS hours INT DEFAULT 10;
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE "${schema}".units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
      `);

      // 4. topics
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id UUID,
          subject_code VARCHAR(50),
          unit_id UUID,
          unit_code VARCHAR(50),
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          batch_year INT,
          bloom_level VARCHAR(50) DEFAULT 'KL-2 (Understand)',
          linker_id UUID,
          code VARCHAR(100) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          hours INT DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        );
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS unit_id UUID;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS unit_code VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS batch_year INT;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(50) DEFAULT 'KL-2 (Understand)';
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS linker_id UUID;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS hours INT DEFAULT 1;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
      `);

      // 5. competencies
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".competencies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id UUID,
          subject_code VARCHAR(50),
          unit_id UUID,
          unit_code VARCHAR(50),
          topic_id UUID,
          topic_code VARCHAR(50),
          linker_id UUID,
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          code VARCHAR(100),
          name VARCHAR(255),
          description TEXT,
          domain VARCHAR(100) DEFAULT 'Knowledge',
          level VARCHAR(100) DEFAULT 'Knows How',
          bloom_level VARCHAR(100) DEFAULT 'KL-2 (Understand)',
          is_core BOOLEAN DEFAULT true,
          batch_year INT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        );
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS unit_id UUID;
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS unit_code VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS topic_code VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(100) DEFAULT 'KL-2 (Understand)';
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT true;
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS batch_year INT;
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
      `);

      // 6. subject_offerings
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".subject_offerings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id UUID,
          subject_code VARCHAR(50),
          prof_id UUID,
          phase_order INT,
          dtype_id UUID,
          dtype_code VARCHAR(50),
          batch_year INT,
          academic_year VARCHAR(50),
          semester INT,
          batch_id UUID,
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          hours_allotted INT,
          is_elective BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS prof_id UUID;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS phase_order INT;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS dtype_id UUID;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS dtype_code VARCHAR(50);
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS batch_year INT;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS semester INT;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS batch_id UUID;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS hours_allotted INT;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS is_elective BOOLEAN DEFAULT false;
        ALTER TABLE "${schema}".subject_offerings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `);
    } catch (e: any) {
      this.logger.error(`Failed to ensure admin master tables for schema ${schema}: ${e.message}`);
    }
  }

  private async listColleges(): Promise<any[]> {
    try {
      const rows = await this.ds.query(`
        SELECT DISTINCT ON (code) id, code, name, slug, domain, plan, primary_color, is_active
        FROM public.tenants
        WHERE is_active = true
        ORDER BY code, CAST(NULLIF(regexp_replace(code, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, name ASC
      `);
      return (rows || []).sort((a: any, b: any) => (parseInt(a.code, 10) || 0) - (parseInt(b.code, 10) || 0));
    } catch (err: any) {
      this.logger.warn(`Failed to list colleges from public.tenants: ${err.message}`);
      return [{ id: 'srms-ims', code: '11', name: 'SRMS Institute of Medical Sciences', slug: 'srms-ims', is_active: true }];
    }
  }

  // ─── 1. PROFESSIONAL LINKER ───────────────────────────────────────────────
  async listProfessionalLinkers(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM professional_linkers ORDER BY created_at DESC, code ASC`,
      ).catch(() => []);

      return rows.map(r => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    // List linkers across all colleges
    const allLinkers: any[] = [];
    for (const col of colleges) {
      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT * FROM professional_linkers ORDER BY created_at DESC, code ASC`,
        ).catch(() => []);

        allLinkers.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allLinkers;
  }

  async createProfessionalLinker(dto: CreateProfessionalLinkerDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".professional_linkers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        course_cd VARCHAR(50),
        professional_phase VARCHAR(100),
        academic_session VARCHAR(100),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE "${schema}".professional_linkers ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".professional_linkers ADD COLUMN IF NOT EXISTS professional_phase VARCHAR(100);
      ALTER TABLE "${schema}".professional_linkers ADD COLUMN IF NOT EXISTS academic_session VARCHAR(100);
      ALTER TABLE "${schema}".professional_linkers ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE "${schema}".professional_linkers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `).catch(() => {});

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM professional_linkers WHERE code = $1`,
      [dto.code.toUpperCase()],
    );

    if (existing.length > 0) {
      const updated = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE professional_linkers
         SET name = $1,
             course_cd = COALESCE($2, course_cd),
             professional_phase = COALESCE($3, professional_phase),
             academic_session = COALESCE($4, academic_session),
             description = COALESCE($5, description),
             is_active = true,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [dto.name, dto.course_cd || null, dto.professional_phase || null, dto.academic_session || null, dto.description || null, existing[0].id],
      );
      return updated[0];
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO professional_linkers (code, name, course_cd, professional_phase, academic_session, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.course_cd || null, dto.professional_phase || null, dto.academic_session || null, dto.description || null],
    );
    return rows[0];
  }

  async updateProfessionalLinker(id: string, dto: UpdateProfessionalLinkerDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE professional_linkers
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           course_cd = COALESCE($3, course_cd),
           professional_phase = COALESCE($4, professional_phase),
           academic_session = COALESCE($5, academic_session),
           description = COALESCE($6, description),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [dto.code?.toUpperCase(), dto.name, dto.course_cd, dto.professional_phase, dto.academic_session, dto.description, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Professional Linker not found');
    return rows[0];
  }

  async deleteProfessionalLinker(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM professional_linkers WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Professional Linker deleted successfully' };
  }

  // ─── 2. DEPARTMENT MASTER (COLLEGE-WISE & CROSS-COLLEGE) ────────────────────
  async listDepartments(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
        await this.ds.query(`
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT d.*, 
                  COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                  d.course_cd AS course_code,
                  COALESCE(d.branch_cd, d.code) AS branch_cd,
                  u.email as hod_email 
           FROM departments d
           LEFT JOIN courses c ON c.course_cd::text = d.course_cd::text OR c.code::text = d.course_cd::text
           LEFT JOIN users u ON u.id::text = d.hod_user_id::text
           ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
        ).catch(() => []);

        return rows.map(r => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to list departments for ${slug}: ${err.message}`);
        return [];
      }
    }

    // List departments across all colleges
    const allDepartments: any[] = [];
    for (const col of colleges) {
      try {
        const schema = `tenant_${col.slug}`;
        await this.ds.query(`
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT d.*, 
                  COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                  d.course_cd AS course_code,
                  COALESCE(d.branch_cd, d.code) AS branch_cd,
                  u.email as hod_email 
           FROM departments d
           LEFT JOIN courses c ON c.course_cd::text = d.course_cd::text OR c.code::text = d.course_cd::text
           LEFT JOIN users u ON u.id::text = d.hod_user_id::text
           ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
        ).catch(() => []);

        allDepartments.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allDepartments;
  }

  async syncDepartmentsFromBranches(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.listColleges();
    const targetSlugs = (slug === 'all' || !slug) ? colleges.map(c => c.slug).filter(Boolean) : [slug];

    let totalSynced = 0;
    const syncedDepartments: any[] = [];

    for (const s of targetSlugs) {
      const schema = `tenant_${s}`;
      await this.ensureAdminMasterTables(s);

      const targetCol = colleges.find(c => c.slug === s || c.code === s || c.id === s);
      const colId = targetCol?.id || s;
      const colName = targetCol?.name || '';
      const colCode = targetCol?.code || s;
      const isIms = (s === 'srms-ims' || s === 'rmribar' || colCode === '11' || colName.toLowerCase().includes('medical') || colName.toLowerCase().includes('hospital'));

      // 1. Fetch courses in this tenant to know which course branches belong to
      const courses = await this.tenantSchemaService.queryInTenant(
        s,
        `SELECT code, name, course_cd, degree_level, academic_system FROM courses ORDER BY code ASC`,
      ).catch(() => []);

      const branchItemsToSync: Array<{
        code: string;
        name: string;
        type: string;
        course_cd: string;
        course_name: string;
      }> = [];

      // 2. If SRMS tenant, query live SRMS GetBranch API
      if (s.startsWith('srms')) {
        for (const crs of courses) {
          const cd = String(colCode || '1');
          const courseCd = String(crs.course_cd || crs.code || '');
          try {
            const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ colgcd: cd, coursecd: courseCd }),
            });
            if (res.ok) {
              const data = await res.json();
              const list = (data && data.data && Array.isArray(data.data)) ? data.data : (Array.isArray(data) ? data : []);
              for (const ext of list) {
                const rawName = String(ext.branch_name || ext.name || '').trim();
                const bCd = String(ext.branch_cd || ext.code || '1').trim();
                let deptType = 'General';
                if (isIms) {
                  deptType = rawName.toLowerCase().includes('anat') || rawName.toLowerCase().includes('physio') ? 'Pre-Clinical'
                    : rawName.toLowerCase().includes('path') || rawName.toLowerCase().includes('pharm') || rawName.toLowerCase().includes('micro') ? 'Para-Clinical'
                    : 'Clinical';
                } else {
                  deptType = 'Engineering';
                }
                branchItemsToSync.push({
                  code: bCd,
                  name: rawName || `${crs.name} Branch ${bCd}`,
                  type: deptType,
                  course_cd: courseCd,
                  course_name: crs.name,
                });
              }
            }
          } catch (err) {}
        }
      }

      // 3. If medical college tenant (e.g. rmribar or srms-ims) and standard departments needed for MBBS/BAMS:
      if (isIms || courses.some((c: any) => c.name?.toUpperCase().includes('MBBS') || c.code === '100')) {
        const mbbsCourse = courses.find((c: any) => c.name?.toUpperCase().includes('MBBS') || c.code === '100') || courses[0];
        const cCd = String(mbbsCourse?.course_cd || mbbsCourse?.code || '100');
        const cName = mbbsCourse?.name || 'MBBS';

        const standardMedicalDepts = [
          { code: '50', name: 'ANATOMY', type: 'Pre-Clinical' },
          { code: '60', name: 'PHYSIOLOGY', type: 'Pre-Clinical' },
          { code: '70', name: 'BIOCHEMISTRY', type: 'Pre-Clinical' },
          { code: '80', name: 'PATHOLOGY', type: 'Para-Clinical' },
          { code: '90', name: 'MICROBIOLOGY', type: 'Para-Clinical' },
          { code: '100', name: 'PHARMACOLOGY', type: 'Para-Clinical' },
          { code: '110', name: 'FORENSIC MEDICINE & TOXICOLOGY', type: 'Para-Clinical' },
          { code: '120', name: 'COMMUNITY MEDICINE', type: 'Para-Clinical' },
          { code: '130', name: 'GENERAL MEDICINE', type: 'Clinical' },
          { code: '140', name: 'PEDIATRICS', type: 'Clinical' },
          { code: '150', name: 'DERMATOLOGY, VENEREOLOGY & LEPROSY', type: 'Clinical' },
          { code: '160', name: 'PSYCHIATRY', type: 'Clinical' },
          { code: '170', name: 'RESPIRATORY MEDICINE', type: 'Clinical' },
          { code: '180', name: 'GENERAL SURGERY', type: 'Clinical' },
          { code: '190', name: 'ORTHOPEDICS', type: 'Clinical' },
          { code: '200', name: 'OPHTHALMOLOGY', type: 'Clinical' },
          { code: '210', name: 'OTO-RHINO-LARYNGOLOGY (ENT)', type: 'Clinical' },
          { code: '220', name: 'OBSTETRICS & GYNAECOLOGY', type: 'Clinical' },
          { code: '230', name: 'ANESTHESIOLOGY', type: 'Clinical' },
          { code: '240', name: 'RADIO-DIAGNOSIS', type: 'Clinical' },
          { code: '250', name: 'DENTISTRY', type: 'Clinical' },
          { code: '260', name: 'EMERGENCY MEDICINE', type: 'Clinical' },
        ];

        for (const md of standardMedicalDepts) {
          if (!branchItemsToSync.some(b => b.code === md.code && b.course_cd === cCd)) {
            branchItemsToSync.push({
              code: md.code,
              name: md.name,
              type: md.type,
              course_cd: cCd,
              course_name: cName,
            });
          }
        }
      }

      // 4. Upsert all branch items into tenant departments table
      for (const item of branchItemsToSync) {
        const branchCode = item.code;
        const branchName = item.name;
        const courseCd = item.course_cd;
        const courseName = item.course_name;
        const deptType = item.type || 'General';

        const existing = await this.tenantSchemaService.queryInTenant(
          s,
          `SELECT id FROM departments WHERE (branch_cd = $1 OR code = $1) AND (course_cd = $2 OR $2 IS NULL) LIMIT 1`,
          [branchCode, courseCd],
        ).catch(() => []);

        if (existing && existing.length > 0) {
          const updated = await this.tenantSchemaService.queryInTenant(
            s,
            `UPDATE departments
             SET name = $1,
                 branch_cd = $2,
                 code = $2,
                 type = $3,
                 course_cd = COALESCE($4, course_cd),
                 course_name = COALESCE($5, course_name),
                 colg_cd = COALESCE($6, colg_cd),
                 is_active = true
             WHERE id = $7
             RETURNING *`,
            [branchName, branchCode, deptType, courseCd, courseName, colCode, existing[0].id],
          );
          if (updated && updated[0]) {
            syncedDepartments.push({ ...updated[0], college_id: colId, college_name: colName, college_code: colCode, college_slug: s });
            totalSynced++;
          }
        } else {
          const inserted = await this.tenantSchemaService.queryInTenant(
            s,
            `INSERT INTO departments (code, branch_cd, name, type, course_cd, course_name, colg_cd, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             RETURNING *`,
            [branchCode, branchCode, branchName, deptType, courseCd, courseName, colCode],
          );
          if (inserted && inserted[0]) {
            syncedDepartments.push({ ...inserted[0], college_id: colId, college_name: colName, college_code: colCode, college_slug: s });
            totalSynced++;
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully synced ${totalSynced} departments from Branch data into PostgreSQL`,
      count: totalSynced,
      data: syncedDepartments,
    };
  }

  async createDepartment(dto: CreateDepartmentMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.college_id || tenantSlug);
    const branchCdVal = String(dto.branch_cd || dto.code || '').trim() || '1';

    await this.ensureAdminMasterTables(slug);

    // If department with same branch_cd and course_cd exists in this tenant, update it
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM departments WHERE (branch_cd = $1 OR code = $1) AND (course_cd = $2 OR $2 IS NULL) LIMIT 1`,
      [branchCdVal, dto.course_cd || null],
    ).catch(() => []);

    if (existing && existing.length > 0) {
      const updated = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE departments
         SET name = $1,
             type = $2,
             course_cd = COALESCE($3, course_cd),
             course_name = COALESCE($4, course_name),
             colg_cd = COALESCE($5, colg_cd),
             hod_user_id = COALESCE($6, hod_user_id),
             is_active = true
         WHERE id = $7
         RETURNING *`,
        [dto.name, dto.type || 'General', dto.course_cd || null, dto.course_name || null, dto.colg_cd || null, dto.hod_user_id || null, existing[0].id],
      );
      return updated[0];
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO departments (code, branch_cd, name, type, course_cd, course_name, colg_cd, hod_user_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [branchCdVal, branchCdVal, dto.name, dto.type || 'General', dto.course_cd || null, dto.course_name || null, dto.colg_cd || null, dto.hod_user_id || null],
    );
    return rows[0];
  }

  async updateDepartment(id: string, dto: UpdateDepartmentMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.college_id || tenantSlug);
    const branchCdVal = dto.code || dto.branch_cd ? String(dto.code || dto.branch_cd).trim() : undefined;
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           branch_cd = COALESCE($1, branch_cd),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           course_cd = COALESCE($4, course_cd),
           hod_user_id = COALESCE($5, hod_user_id),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [branchCdVal, dto.name, dto.type, dto.course_cd, dto.hod_user_id, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Department not found');
    return rows[0];
  }

  async deleteDepartment(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    // Safely clear foreign key references in child tables before deleting department
    const tablesToNullify = ['batches', 'faculty', 'groups_master', 'students', 'subjects', 'question_bank', 'timetable_slots', 'chat_groups'];
    for (const table of tablesToNullify) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET department_id = NULL WHERE department_id = $1`,
          [id],
        );
      } catch (e) {}
    }

    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM departments WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Department deleted successfully' };
  }

  // ─── 3. SUBJECT MASTER (COLLEGE-WISE & CROSS-COLLEGE) ───────────────────────
  async listSubjects(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
        await this.ds.query(`
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sub_addinfo VARCHAR(100);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS mst_sub_name VARCHAR(200);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT s.*, 
                  COALESCE(s.course_cd, d.course_cd) as course_cd,
                  COALESCE(s.course_name, d.course_name) as course_name,
                  COALESCE(s.branch_cd, d.branch_cd, d.code) as branch_cd,
                  COALESCE(s.batch_cd, b.code, b.year::text) as batch_code,
                  COALESCE(s.batch_cd, b.code, b.year::text) as batch_cd,
                  s.sem_cd,
                  s.semester,
                  s.sub_addinfo,
                  s.mst_sub_name,
                  d.name as department_name, 
                  d.code as department_code
           FROM subjects s
           LEFT JOIN departments d ON d.id::text = s.department_id::text
           LEFT JOIN batches b ON b.id::text = s.batch_id::text
           ORDER BY s.code ASC, s.name ASC`,
        ).catch(() => []);

        return rows.map(r => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to list subjects for ${slug}: ${err.message}`);
        return [];
      }
    }

    // List subjects across all colleges
    const allSubjects: any[] = [];
    for (const col of colleges) {
      try {
        const schema = `tenant_${col.slug}`;
        await this.ds.query(`
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sub_addinfo VARCHAR(100);
          ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS mst_sub_name VARCHAR(200);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT s.*, 
                  COALESCE(s.course_cd, d.course_cd) as course_cd,
                  COALESCE(s.course_name, d.course_name) as course_name,
                  COALESCE(s.branch_cd, d.branch_cd, d.code) as branch_cd,
                  COALESCE(s.batch_cd, b.code, b.year::text) as batch_code,
                  COALESCE(s.batch_cd, b.code, b.year::text) as batch_cd,
                  s.sem_cd,
                  s.semester,
                  s.sub_addinfo,
                  s.mst_sub_name,
                  d.name as department_name, 
                  d.code as department_code
           FROM subjects s
           LEFT JOIN departments d ON d.id::text = s.department_id::text
           LEFT JOIN batches b ON b.id::text = s.batch_id::text
           ORDER BY s.code ASC, s.name ASC`,
        ).catch(() => []);

        allSubjects.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allSubjects;
  }

  async createSubject(dto: CreateSubjectMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
    await this.ds.query(`
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(50);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sub_addinfo VARCHAR(100);
      ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS mst_sub_name VARCHAR(200);
    `).catch(() => {});

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM subjects WHERE code = $1`,
      [dto.code.toUpperCase()],
    );

    let deptId = dto.department_id || null;
    let courseCd = dto.course_cd || null;
    let courseName = dto.course_name || null;
    let branchCd = dto.branch_cd || null;

    if (deptId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deptId)) {
      const deptRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, course_cd, course_name, branch_cd FROM departments 
         WHERE (branch_cd = $1 OR code = $1) ${dto.course_cd ? 'AND (course_cd = $2 OR $2 IS NULL)' : ''} 
         LIMIT 1`,
        dto.course_cd ? [deptId, dto.course_cd] : [deptId],
      );
      if (deptRows.length > 0) {
        deptId = deptRows[0].id;
        courseCd = courseCd || deptRows[0].course_cd;
        courseName = courseName || deptRows[0].course_name;
        branchCd = branchCd || deptRows[0].branch_cd;
      }
    }

    if (existing.length > 0) {
      const updated = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE subjects 
         SET name = $1, 
             department_id = COALESCE($2, department_id), 
             batch_id = COALESCE($3, batch_id), 
             credits = $4, 
             type = $5, 
             is_longitudinal = $6, 
             course_cd = COALESCE($7, course_cd), 
             course_name = COALESCE($8, course_name), 
             branch_cd = COALESCE($9, branch_cd),
             batch_cd = COALESCE($10, batch_cd),
             sem_cd = COALESCE($11, sem_cd),
             semester = COALESCE($12, semester),
             sub_addinfo = COALESCE($13, sub_addinfo),
             mst_sub_name = COALESCE($14, mst_sub_name),
             is_active = true
         WHERE id = $15
         RETURNING *`,
        [
          dto.name,
          deptId,
          dto.batch_id || null,
          dto.credits || 4,
          dto.type || 'THEORY',
          dto.is_longitudinal || false,
          courseCd,
          courseName,
          branchCd,
          dto.batch_cd || null,
          dto.sem_cd || null,
          dto.semester || null,
          dto.sub_addinfo || null,
          dto.mst_sub_name || null,
          existing[0].id,
        ],
      );
      return updated[0];
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO subjects (code, name, department_id, batch_id, credits, type, is_longitudinal, is_active, course_cd, course_name, branch_cd, batch_cd, sem_cd, semester, sub_addinfo, mst_sub_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        dto.code.toUpperCase(),
        dto.name,
        deptId,
        dto.batch_id || null,
        dto.credits || 4,
        dto.type || 'THEORY',
        dto.is_longitudinal || false,
        courseCd,
        courseName,
        branchCd,
        dto.batch_cd || null,
        dto.sem_cd || null,
        dto.semester || null,
        dto.sub_addinfo || null,
        dto.mst_sub_name || null,
      ],
    );
    return rows[0];
  }

  async updateSubject(id: string, dto: UpdateSubjectMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);

    let deptId = dto.department_id;
    let courseCd = dto.course_cd;
    let courseName = dto.course_name;
    let branchCd = dto.branch_cd;

    if (deptId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deptId)) {
      const deptRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, course_cd, course_name, branch_cd FROM departments 
         WHERE (branch_cd = $1 OR code = $1) ${dto.course_cd ? 'AND (course_cd = $2 OR $2 IS NULL)' : ''} 
         LIMIT 1`,
        dto.course_cd ? [deptId, dto.course_cd] : [deptId],
      );
      if (deptRows.length > 0) {
        deptId = deptRows[0].id;
        courseCd = courseCd || deptRows[0].course_cd;
        courseName = courseName || deptRows[0].course_name;
        branchCd = branchCd || deptRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE subjects
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           department_id = COALESCE($3, department_id),
           batch_id = COALESCE($4, batch_id),
           credits = COALESCE($5, credits),
           type = COALESCE($6, type),
           is_longitudinal = COALESCE($7, is_longitudinal),
           is_active = COALESCE($8, is_active),
           course_cd = COALESCE($9, course_cd),
           course_name = COALESCE($10, course_name),
           branch_cd = COALESCE($11, branch_cd)
       WHERE id = $12
       RETURNING *`,
      [
        dto.code?.toUpperCase(),
        dto.name,
        deptId,
        dto.batch_id,
        dto.credits,
        dto.type,
        dto.is_longitudinal,
        dto.is_active,
        courseCd,
        courseName,
        branchCd,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Subject not found');
    return rows[0];
  }

  async deleteSubject(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);

    // Safely clear/delete foreign key references in child tables before deleting subject
    const nullifyTables = ['attendance_sessions', 'logbook_activity_types', 'logbook_entries', 'timetable_slots', 'competencies', 'faculty', 'question_bank', 'examination_papers'];
    for (const table of nullifyTables) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET subject_id = NULL WHERE subject_id = $1`,
          [id],
        );
      } catch (e) {}
    }

    const deleteTables = ['topics', 'subject_offerings', 'faculty_subjects'];
    for (const table of deleteTables) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `DELETE FROM "${table}" WHERE subject_id = $1`,
          [id],
        );
      } catch (e) {}
    }

    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM subjects WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Subject deleted successfully' };
  }

  // ─── 4. TOPIC MASTER ───────────────────────────────────────────────────────
  async listTopics(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.listColleges();

    if (slug === 'all') {
      const activeTenants = colleges.filter((c: any) => c.slug);
      const allTopics: any[] = [];
      for (const col of activeTenants) {
        try {
          const rows = await this.tenantSchemaService.queryInTenant(
            col.slug,
            `SELECT t.*, 
                    s.name as subject_name,
                    COALESCE(t.subject_code::text, s.code::text) as subject_code,
                    COALESCE(t.subject_id::text, s.id::text) as subject_id,
                    u.name as unit_name,
                    COALESCE(t.unit_code::text, u.code::text) as unit_code,
                    COALESCE(t.unit_id::text, u.id::text) as unit_id,
                    u.bloom_level as unit_bloom_level,
                    l.code as cbme_code, l.name as cbme_name,
                    COALESCE(t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
                    COALESCE(t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
             FROM topics t
             LEFT JOIN subjects s ON (s.id::text = t.subject_id::text OR s.code::text = t.subject_code::text)
             LEFT JOIN units u ON (u.id::text = t.unit_id::text OR u.code::text = t.unit_code::text)
             LEFT JOIN professional_linkers l ON l.id::text = t.linker_id::text
             ORDER BY t.created_at DESC, t.code ASC`,
          );
          rows.forEach((r: any) => {
            allTopics.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (err) {
          // Schema might not exist yet
        }
      }
      return allTopics;
    }

    const currentCollege = colleges.find((c: any) => c.slug === slug);
    await this.ensureAdminMasterTables(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, 
              s.name as subject_name,
              COALESCE(t.subject_code::text, s.code::text) as subject_code,
              COALESCE(t.subject_id::text, s.id::text) as subject_id,
              u.name as unit_name,
              COALESCE(t.unit_code::text, u.code::text) as unit_code,
              COALESCE(t.unit_id::text, u.id::text) as unit_id,
              u.bloom_level as unit_bloom_level,
              l.code as cbme_code, l.name as cbme_name,
              COALESCE(t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
              COALESCE(t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
       FROM topics t
       LEFT JOIN subjects s ON (s.id::text = t.subject_id::text OR s.code::text = t.subject_code::text)
       LEFT JOIN units u ON (u.id::text = t.unit_id::text OR u.code::text = t.unit_code::text)
       LEFT JOIN professional_linkers l ON l.id::text = t.linker_id::text
       ORDER BY t.created_at DESC, t.code ASC`,
    );

    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    }));
  }

  async createTopic(dto: CreateTopicMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id || dto.subjectId;
    let subjectCode = dto.subject_code || dto.subjectCode;
    let courseCd = dto.course_cd || dto.courseCd;
    let branchCd = dto.branch_cd || dto.branchCd;
    const subSearch = dto.subject_code || dto.subjectCode || dto.subject_id || dto.subjectId;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id || dto.unitId;
    let unitCode = dto.unit_code || dto.unitCode;
    let bloomLevel = dto.bloom_level || dto.bloomLevel;
    const unitSearch = dto.unit_code || dto.unitCode || dto.unit_id || dto.unitId;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        bloomLevel = bloomLevel || unitRows[0].bloom_level;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    const learningMethod = dto.learning_method || dto.learningMethod || null;
    const assessmentMethod = dto.assessment_method || dto.assessmentMethod || null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO topics (subject_id, subject_code, unit_id, unit_code, course_cd, branch_cd, batch_year, bloom_level, code, name, description, hours, is_active, linker_id, learning_method, assessment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14, $15)
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || dto.batchYear || null,
        bloomLevel || 'KL-2 (Understand)',
        dto.code.trim().toUpperCase(),
        dto.name.trim(),
        dto.description?.trim() || null,
        dto.hours || 1,
        dto.linker_id || dto.linkerId || null,
        learningMethod,
        assessmentMethod,
      ],
    );

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, 
              s.name as subject_name, s.code as subject_code,
              u.name as unit_name, u.code as unit_code, u.bloom_level as unit_bloom_level,
              l.code as cbme_code, l.name as cbme_name
       FROM topics t
       LEFT JOIN subjects s ON (s.id::text = t.subject_id::text OR s.code::text = t.subject_code::text)
       LEFT JOIN units u ON (u.id::text = t.unit_id::text OR u.code::text = t.unit_code::text)
       LEFT JOIN professional_linkers l ON l.id::text = t.linker_id::text
       WHERE t.id = $1`,
      [rows[0].id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateTopic(id: string, dto: UpdateTopicMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id;
    let subjectCode = dto.subject_code;
    let courseCd = dto.course_cd;
    let branchCd = dto.branch_cd;
    const subSearch = dto.subject_code || dto.subject_id;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id;
    let unitCode = dto.unit_code;
    let bloomLevel = dto.bloom_level;
    const unitSearch = dto.unit_code || dto.unit_id;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        bloomLevel = bloomLevel || unitRows[0].bloom_level;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    const learningMethod = dto.learning_method !== undefined ? dto.learning_method : dto.learningMethod;
    const assessmentMethod = dto.assessment_method !== undefined ? dto.assessment_method : dto.assessmentMethod;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE topics
       SET subject_id = COALESCE($1, subject_id),
           subject_code = COALESCE($2, subject_code),
           unit_id = COALESCE($3, unit_id),
           unit_code = COALESCE($4, unit_code),
           course_cd = COALESCE($5, course_cd),
           branch_cd = COALESCE($6, branch_cd),
           batch_year = COALESCE($7, batch_year),
           bloom_level = COALESCE($8, bloom_level),
           code = COALESCE($9, code),
           name = COALESCE($10, name),
           description = COALESCE($11, description),
           hours = COALESCE($12, hours),
           is_active = COALESCE($13, is_active),
           linker_id = COALESCE($14, linker_id),
           learning_method = COALESCE($15, learning_method),
           assessment_method = COALESCE($16, assessment_method),
           updated_at = NOW()
       WHERE id = $17
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || null,
        bloomLevel || null,
        dto.code ? dto.code.trim().toUpperCase() : null,
        dto.name ? dto.name.trim() : null,
        dto.description !== undefined ? dto.description : null,
        dto.hours || null,
        dto.is_active,
        dto.linker_id || null,
        learningMethod !== undefined ? learningMethod : null,
        assessmentMethod !== undefined ? assessmentMethod : null,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Topic not found');

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, 
              s.name as subject_name, s.code as subject_code,
              u.name as unit_name, u.code as unit_code, u.bloom_level as unit_bloom_level,
              l.code as cbme_code, l.name as cbme_name
       FROM topics t
       LEFT JOIN subjects s ON (s.id::text = t.subject_id::text OR s.code::text = t.subject_code::text)
       LEFT JOIN units u ON (u.id::text = t.unit_id::text OR u.code::text = t.unit_code::text)
       LEFT JOIN professional_linkers l ON l.id::text = t.linker_id::text
       WHERE t.id = $1`,
      [id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteTopic(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE competencies SET topic_id = NULL WHERE topic_id = $1`,
        [id],
      );
    } catch (e) {}
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM topics WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Topic deleted successfully' };
  }

  // ─── 5. COMPETENCY / SUB-TOPIC MASTER ──────────────────────────────────────────
  async listCompetencies(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.listColleges();

    if (slug === 'all') {
      const activeTenants = colleges.filter((c: any) => c.slug);
      const allCompetencies: any[] = [];
      for (const col of activeTenants) {
        try {
          const rows = await this.tenantSchemaService.queryInTenant(
            col.slug,
            `SELECT c.*, 
                    s.name as subject_name,
                    COALESCE(c.subject_code::text, s.code::text, t.subject_code::text, u.subject_code::text) as subject_code,
                    COALESCE(c.subject_id::text, s.id::text, t.subject_id::text, u.subject_id::text) as subject_id,
                    u.name as unit_name,
                    COALESCE(c.unit_code::text, u.code::text, t.unit_code::text) as unit_code,
                    COALESCE(c.unit_id::text, u.id::text, t.unit_id::text) as unit_id,
                    u.description as unit_description,
                    t.name as topic_name,
                    COALESCE(c.topic_code::text, t.code::text) as topic_code,
                    COALESCE(c.topic_id::text, t.id::text) as topic_id,
                    t.description as topic_description,
                    l.code as cbme_code, l.name as cbme_name,
                    COALESCE(c.course_cd::text, t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
                    COALESCE(c.branch_cd::text, t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
             FROM competencies c
             LEFT JOIN subjects s ON (s.id::text = c.subject_id::text OR s.code::text = c.subject_code::text)
             LEFT JOIN units u ON (u.id::text = c.unit_id::text OR u.code::text = c.unit_code::text)
             LEFT JOIN topics t ON (t.id::text = c.topic_id::text OR t.code::text = c.topic_code::text)
             LEFT JOIN professional_linkers l ON l.id::text = c.linker_id::text
             ORDER BY c.created_at DESC, c.code ASC`,
          );
          rows.forEach((r: any) => {
            allCompetencies.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (err) {
          // Schema might not exist yet
        }
      }
      return allCompetencies;
    }

    const currentCollege = colleges.find((c: any) => c.slug === slug);
    await this.ensureAdminMasterTables(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT c.*, 
              s.name as subject_name,
              COALESCE(c.subject_code::text, s.code::text, t.subject_code::text, u.subject_code::text) as subject_code,
              COALESCE(c.subject_id::text, s.id::text, t.subject_id::text, u.subject_id::text) as subject_id,
              u.name as unit_name,
              COALESCE(c.unit_code::text, u.code::text, t.unit_code::text) as unit_code,
              COALESCE(c.unit_id::text, u.id::text, t.unit_id::text) as unit_id,
              u.description as unit_description,
              t.name as topic_name,
              COALESCE(c.topic_code::text, t.code::text) as topic_code,
              COALESCE(c.topic_id::text, t.id::text) as topic_id,
              t.description as topic_description,
              l.code as cbme_code, l.name as cbme_name,
              COALESCE(c.course_cd::text, t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
              COALESCE(c.branch_cd::text, t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
       FROM competencies c
       LEFT JOIN subjects s ON (s.id::text = c.subject_id::text OR s.code::text = c.subject_code::text)
       LEFT JOIN units u ON (u.id::text = c.unit_id::text OR u.code::text = c.unit_code::text)
       LEFT JOIN topics t ON (t.id::text = c.topic_id::text OR t.code::text = c.topic_code::text)
       LEFT JOIN professional_linkers l ON l.id::text = c.linker_id::text
       ORDER BY c.created_at DESC, c.code ASC`,
    );

    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    }));
  }

  async createCompetency(dto: CreateCompetencyMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id || dto.subjectId;
    let subjectCode = dto.subject_code || dto.subjectCode;
    let courseCd = dto.course_cd || dto.courseCd;
    let branchCd = dto.branch_cd || dto.branchCd;
    const subSearch = dto.subject_code || dto.subjectCode || dto.subject_id || dto.subjectId;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id || dto.unitId;
    let unitCode = dto.unit_code || dto.unitCode;
    const unitSearch = dto.unit_code || dto.unitCode || dto.unit_id || dto.unitId;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    // Resolve topic if string code or UUID
    let topicId = dto.topic_id || dto.topicId;
    let topicCode = dto.topic_code || dto.topicCode;
    let bloomLevel = dto.bloom_level || dto.bloomLevel;
    const topicSearch = dto.topic_code || dto.topicCode || dto.topic_id || dto.topicId;
    if (topicSearch) {
      const topicRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, unit_id, unit_code, subject_id, subject_code, course_cd, branch_cd FROM topics WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [topicSearch],
      ).catch(() => []);
      if (topicRows.length > 0) {
        topicId = topicRows[0].id;
        topicCode = topicRows[0].code;
        bloomLevel = bloomLevel || topicRows[0].bloom_level;
        unitId = unitId || topicRows[0].unit_id;
        unitCode = unitCode || topicRows[0].unit_code;
        subjectId = subjectId || topicRows[0].subject_id;
        subjectCode = subjectCode || topicRows[0].subject_code;
        courseCd = courseCd || topicRows[0].course_cd;
        branchCd = branchCd || topicRows[0].branch_cd;
      }
    }

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    // If batch items provided
    if (dto.items && Array.isArray(dto.items) && dto.items.length > 0) {
      const insertedList: any[] = [];
      for (const item of dto.items) {
        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO competencies (subject_id, subject_code, unit_id, unit_code, topic_id, topic_code, course_cd, branch_cd, batch_year, code, name, description, domain, level, bloom_level, is_core, is_active, linker_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17)
           RETURNING *`,
          [
            subjectId || null,
            subjectCode || null,
            unitId || null,
            unitCode || null,
            topicId || null,
            topicCode || null,
            courseCd || null,
            branchCd || null,
            dto.batch_year || dto.batchYear || null,
            item.code.trim().toUpperCase(),
            item.name?.trim() || null,
            item.description.trim(),
            item.domain || dto.domain || 'Knowledge',
            item.level || dto.level || 'Knows How',
            item.bloom_level || bloomLevel || 'KL-2 (Understand)',
            item.is_core ?? true,
            dto.linker_id || dto.linkerId || null,
          ],
        );
        insertedList.push({
          ...rows[0],
          college_id: currentCollege?.id,
          college_name: currentCollege?.name,
          college_code: currentCollege?.code,
          college_slug: slug,
        });
      }
      return insertedList[0] || { success: true };
    }

    const learningMethod = dto.learning_method || dto.learningMethod || null;
    const assessmentMethod = dto.assessment_method || dto.assessmentMethod || null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO competencies (subject_id, subject_code, unit_id, unit_code, topic_id, topic_code, course_cd, branch_cd, batch_year, code, name, description, domain, level, bloom_level, is_core, is_active, linker_id, learning_method, assessment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17, $18, $19)
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        topicId || null,
        topicCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || dto.batchYear || null,
        (dto.code || '').trim().toUpperCase(),
        dto.name?.trim() || null,
        (dto.description || '').trim(),
        dto.domain || 'Knowledge',
        dto.level || 'Knows How',
        bloomLevel || 'KL-2 (Understand)',
        dto.is_core ?? dto.isCore ?? true,
        dto.linker_id || dto.linkerId || null,
        learningMethod,
        assessmentMethod,
      ],
    );

    return {
      ...rows[0],
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateCompetency(id: string, dto: UpdateCompetencyMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id;
    let subjectCode = dto.subject_code;
    let courseCd = dto.course_cd;
    let branchCd = dto.branch_cd;
    const subSearch = dto.subject_code || dto.subject_id;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id;
    let unitCode = dto.unit_code;
    const unitSearch = dto.unit_code || dto.unit_id;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    // Resolve topic if string code or UUID
    let topicId = dto.topic_id;
    let topicCode = dto.topic_code;
    let bloomLevel = dto.bloom_level;
    const topicSearch = dto.topic_code || dto.topic_id;
    if (topicSearch) {
      const topicRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, unit_id, unit_code, subject_id, subject_code, course_cd, branch_cd FROM topics WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [topicSearch],
      ).catch(() => []);
      if (topicRows.length > 0) {
        topicId = topicRows[0].id;
        topicCode = topicRows[0].code;
        bloomLevel = bloomLevel || topicRows[0].bloom_level;
        unitId = unitId || topicRows[0].unit_id;
        unitCode = unitCode || topicRows[0].unit_code;
        subjectId = subjectId || topicRows[0].subject_id;
        subjectCode = subjectCode || topicRows[0].subject_code;
        courseCd = courseCd || topicRows[0].course_cd;
        branchCd = branchCd || topicRows[0].branch_cd;
      }
    }

    const learningMethod = dto.learning_method !== undefined ? dto.learning_method : dto.learningMethod;
    const assessmentMethod = dto.assessment_method !== undefined ? dto.assessment_method : dto.assessmentMethod;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE competencies
       SET subject_id = COALESCE($1, subject_id),
           subject_code = COALESCE($2, subject_code),
           unit_id = COALESCE($3, unit_id),
           unit_code = COALESCE($4, unit_code),
           topic_id = COALESCE($5, topic_id),
           topic_code = COALESCE($6, topic_code),
           course_cd = COALESCE($7, course_cd),
           branch_cd = COALESCE($8, branch_cd),
           batch_year = COALESCE($9, batch_year),
           code = COALESCE($10, code),
           name = COALESCE($11, name),
           description = COALESCE($12, description),
           domain = COALESCE($13, domain),
           level = COALESCE($14, level),
           bloom_level = COALESCE($15, bloom_level),
           is_core = COALESCE($16, is_core),
           is_active = COALESCE($17, is_active),
           linker_id = COALESCE($18, linker_id),
           learning_method = COALESCE($19, learning_method),
           assessment_method = COALESCE($20, assessment_method),
           updated_at = NOW()
       WHERE id = $21
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        topicId || null,
        topicCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || null,
        dto.code ? dto.code.trim().toUpperCase() : null,
        dto.name ? dto.name.trim() : null,
        dto.description !== undefined ? dto.description : null,
        dto.domain || null,
        dto.level || null,
        bloomLevel || null,
        dto.is_core,
        dto.is_active,
        dto.linker_id || null,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Competency not found');

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...rows[0],
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteCompetency(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM competencies WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Competency deleted successfully' };
  }

  // ─── 6. DELIVERY TYPES ─────────────────────────────────────────────────────
  async listDeliveryTypes(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      let rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT DISTINCT ON (code) * FROM delivery_types ORDER BY code ASC`,
      ).catch(() => []);

      // If empty, auto-seed standard delivery types
      if (!rows || rows.length === 0) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO delivery_types (code, name, is_active)
           VALUES 
             ('TH', 'Theory', true),
             ('PR', 'Practical / Lab', true),
             ('TUT', 'Tutorial', true),
             ('SDL', 'Self Directed Learning', true),
             ('SGT', 'Small Group Teaching', true),
             ('DOAP', 'Demonstration / DOAP Session', true)
           ON CONFLICT (code) DO NOTHING`,
        ).catch(() => {});

        rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT DISTINCT ON (code) * FROM delivery_types ORDER BY code ASC`,
        ).catch(() => []);
      }

      if (!rows || rows.length === 0) {
        rows = [
          { id: '1', code: 'TH', name: 'Theory', is_active: true },
          { id: '2', code: 'PR', name: 'Practical / Lab', is_active: true },
          { id: '3', code: 'TUT', name: 'Tutorial', is_active: true },
          { id: '4', code: 'SDL', name: 'Self Directed Learning', is_active: true },
          { id: '5', code: 'SGT', name: 'Small Group Teaching', is_active: true },
          { id: '6', code: 'DOAP', name: 'Demonstration / DOAP Session', is_active: true },
        ];
      }

      return rows.map(r => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    // tenant === 'all' or default
    const allItems: any[] = [];
    const seen = new Set<string>();
    for (const col of colleges) {
      if (!col.slug) continue;
      let rows = await this.tenantSchemaService.queryInTenant(
        col.slug,
        `SELECT DISTINCT ON (code) * FROM delivery_types ORDER BY code ASC`,
      ).catch(() => []);

      if (!rows || rows.length === 0) {
        await this.tenantSchemaService.queryInTenant(
          col.slug,
          `INSERT INTO delivery_types (code, name, is_active)
           VALUES 
             ('TH', 'Theory', true),
             ('PR', 'Practical / Lab', true),
             ('TUT', 'Tutorial', true),
             ('SDL', 'Self Directed Learning', true),
             ('SGT', 'Small Group Teaching', true),
             ('DOAP', 'Demonstration / DOAP Session', true)
           ON CONFLICT (code) DO NOTHING`,
        ).catch(() => {});

        rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT DISTINCT ON (code) * FROM delivery_types ORDER BY code ASC`,
        ).catch(() => []);
      }

      for (const r of rows) {
        if (!seen.has(r.code)) {
          seen.add(r.code);
          allItems.push({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          });
        }
      }
    }

    if (allItems.length === 0) {
      return [
        { id: '1', code: 'TH', name: 'Theory', is_active: true, college_id: '1', college_name: 'SRMS CET,BAREILLY', college_code: '1', college_slug: 'srms-cet-bareilly' },
        { id: '2', code: 'PR', name: 'Practical / Lab', is_active: true, college_id: '1', college_name: 'SRMS CET,BAREILLY', college_code: '1', college_slug: 'srms-cet-bareilly' },
        { id: '3', code: 'TUT', name: 'Tutorial', is_active: true, college_id: '1', college_name: 'SRMS CET,BAREILLY', college_code: '1', college_slug: 'srms-cet-bareilly' },
        { id: '4', code: 'SDL', name: 'Self Directed Learning', is_active: true, college_id: '1', college_name: 'SRMS CET,BAREILLY', college_code: '1', college_slug: 'srms-cet-bareilly' },
        { id: '5', code: 'SGT', name: 'Small Group Teaching', is_active: true, college_id: '1', college_name: 'SRMS CET,BAREILLY', college_code: '1', college_slug: 'srms-cet-bareilly' },
        { id: '6', code: 'DOAP', name: 'Demonstration / DOAP Session', is_active: true, college_id: '1', college_name: 'SRMS CET,BAREILLY', college_code: '1', college_slug: 'srms-cet-bareilly' },
      ];
    }

    return allItems;
  }

  async createDeliveryType(dto: CreateDeliveryTypeDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM delivery_types WHERE code = $1`,
      [dto.code.toUpperCase()],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`Delivery type with code '${dto.code}' already exists.`);
    }
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO delivery_types (code, name, description, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.description || null],
    );
    return rows[0];
  }

  async updateDeliveryType(id: string, dto: UpdateDeliveryTypeDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE delivery_types
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [dto.code?.toUpperCase(), dto.name, dto.description !== undefined ? dto.description : null, dto.is_active ?? dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Delivery type not found');
    return rows[0];
  }

  async deleteDeliveryType(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM delivery_types WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Delivery type deleted successfully' };
  }

  // ─── 7. SUBJECT OFFERINGS ──────────────────────────────────────────────────
  async listSubjectOfferings(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      await this.ensureAdminMasterTables(slug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT so.*, 
                s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
                p.name AS prof_name, p.phase_order, p.academic_year,
                dt.name AS dtype_name, dt.code AS dtype_code,
                (SELECT COUNT(*) FROM attendance_sessions ass WHERE ass.offering_id::text = so.id::text OR (ass.subject_id::text = so.subject_id::text AND ass.offering_id IS NULL)) AS attendance_sessions_count
         FROM subject_offerings so
         LEFT JOIN subjects s ON s.id::text = so.subject_id::text
         LEFT JOIN professional_phases p ON p.id::text = so.prof_id::text
         LEFT JOIN delivery_types dt ON dt.id::text = so.dtype_id::text
         ORDER BY s.name ASC, p.phase_order ASC, dt.code ASC`,
      ).catch(() => []);

      return rows.map(r => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    // List subject offerings across all colleges
    const allOfferings: any[] = [];
    for (const col of colleges) {
      try {
        await this.ensureAdminMasterTables(col.slug);
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT so.*, 
                  s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
                  p.name AS prof_name, p.phase_order, p.academic_year,
                  dt.name AS dtype_name, dt.code AS dtype_code,
                  (SELECT COUNT(*) FROM attendance_sessions ass WHERE ass.offering_id::text = so.id::text OR (ass.subject_id::text = so.subject_id::text AND ass.offering_id IS NULL)) AS attendance_sessions_count
           FROM subject_offerings so
           LEFT JOIN subjects s ON s.id::text = so.subject_id::text
           LEFT JOIN professional_phases p ON p.id::text = so.prof_id::text
           LEFT JOIN delivery_types dt ON dt.id::text = so.dtype_id::text
           ORDER BY s.name ASC, p.phase_order ASC, dt.code ASC`,
        ).catch(() => []);

        allOfferings.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allOfferings;
  }

  async createSubjectOffering(dto: CreateSubjectOfferingDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);

    // 1. Resolve Subject
    let subjectId = dto.subject_id || dto.subjectId;
    const subjectSearch = dto.subject_code || dto.subjectCode || dto.subject_id || dto.subjectId;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) subjectId = subRows[0].id;
    }
    if (!subjectId) {
      const subFallback = await this.tenantSchemaService.queryInTenant(slug, `SELECT id FROM subjects LIMIT 1`).catch(() => []);
      if (subFallback.length > 0) subjectId = subFallback[0].id;
    }

    // 2. Resolve Professional Phase
    let profId = dto.prof_id || dto.profId;
    const profSearch = dto.phase_order !== undefined ? String(dto.phase_order) : (dto.prof_id || dto.profId);
    if (profSearch) {
      const profRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM professional_phases WHERE id::text = $1 OR phase_order::text = $1 LIMIT 1`,
        [profSearch],
      ).catch(() => []);
      if (profRows.length > 0) profId = profRows[0].id;
    }
    if (!profId) {
      const profFallback = await this.tenantSchemaService.queryInTenant(slug, `SELECT id FROM professional_phases LIMIT 1`).catch(() => []);
      if (profFallback.length > 0) {
        profId = profFallback[0].id;
      } else {
        const newProf = await this.tenantSchemaService.queryInTenant(slug, `INSERT INTO professional_phases (name, phase_order, is_active) VALUES ('Semester 1', 1, true) RETURNING id`).catch(() => []);
        if (newProf.length > 0) profId = newProf[0].id;
      }
    }

    // 3. Resolve (or auto-create) Delivery Type
    let dtypeId = dto.dtype_id || dto.dtypeId;
    const dtypeSearch = dto.dtype_code || dto.dtypeCode || dto.dtype_id || dto.dtypeId || 'TH';
    if (dtypeSearch) {
      let dtRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM delivery_types WHERE id::text = $1 OR code ILIKE $1 LIMIT 1`,
        [dtypeSearch],
      ).catch(() => []);
      if (dtRows.length === 0) {
        const inserted = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO delivery_types (code, name, is_active)
           VALUES ($1, $2, true)
           RETURNING id`,
          [dtypeSearch.toUpperCase(), dtypeSearch.toUpperCase() === 'TH' ? 'Theory' : (dtypeSearch.toUpperCase() === 'PR' ? 'Practical' : dtypeSearch)],
        ).catch(() => []);
        if (inserted.length > 0) dtypeId = inserted[0].id;
      } else {
        dtypeId = dtRows[0].id;
      }
    }

    const batchYearVal = dto.batch_year || dto.batchYear || 2024;
    const hoursVal = dto.hours_allotted ?? dto.hoursAllotted ?? 0;
    const academicYearVal = dto.academic_year || dto.academicYear || '2024-2025';
    const semVal = Number(dto.semester) || 1;
    const isElectiveVal = dto.is_elective ?? dto.isElective ?? false;

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM subject_offerings 
       WHERE subject_id = $1 AND prof_id = $2 AND dtype_id = $3 AND batch_year = $4`,
      [subjectId, profId, dtypeId, batchYearVal],
    ).catch(() => []);

    let offeringId: string;
    if (existing && existing.length > 0) {
      offeringId = existing[0].id;
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE subject_offerings SET hours_allotted = $1, academic_year = $2, semester = $3, is_elective = $4, is_active = true WHERE id = $5`,
        [hoursVal, academicYearVal, semVal, isElectiveVal, offeringId],
      );
    } else {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO subject_offerings (subject_id, prof_id, dtype_id, batch_year, academic_year, semester, hours_allotted, is_elective, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING *`,
        [subjectId, profId, dtypeId, batchYearVal, academicYearVal, semVal, hoursVal, isElectiveVal],
      );
      offeringId = rows[0].id;
    }

    // Auto-link any existing unlinked attendance sessions for this subject without modifying marks/dates
    if (subjectId) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE attendance_sessions 
         SET offering_id = $1 
         WHERE subject_id = $2 AND (offering_id IS NULL OR offering_id != $1)`,
        [offeringId, subjectId],
      ).catch(() => {});
    }

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT so.*, 
              s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
              p.name AS prof_name, p.phase_order, p.academic_year,
              dt.name AS dtype_name, dt.code AS dtype_code,
              (SELECT COUNT(*) FROM attendance_sessions ass WHERE ass.offering_id::text = so.id::text OR (ass.subject_id::text = so.subject_id::text AND ass.offering_id IS NULL)) AS attendance_sessions_count
       FROM subject_offerings so
       LEFT JOIN subjects s ON s.id::text = so.subject_id::text
       LEFT JOIN professional_phases p ON p.id::text = so.prof_id::text
       LEFT JOIN delivery_types dt ON dt.id::text = so.dtype_id::text
       WHERE so.id::text = $1::text`,
      [offeringId],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...resultRows[0],
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateSubjectOffering(id: string, dto: UpdateSubjectOfferingDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // 1. Resolve Subject if provided
    let subjectId = dto.subject_id;
    const subjectSearch = dto.subject_code || dto.subject_id;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) subjectId = subRows[0].id;
    }

    // 2. Resolve Professional Phase if provided
    let profId = dto.prof_id;
    const profSearch = dto.phase_order !== undefined ? String(dto.phase_order) : dto.prof_id;
    if (profSearch) {
      const profRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM professional_phases WHERE id::text = $1 OR phase_order::text = $1 LIMIT 1`,
        [profSearch],
      ).catch(() => []);
      if (profRows.length > 0) profId = profRows[0].id;
    }

    // 3. Resolve Delivery Type if provided
    let dtypeId = dto.dtype_id;
    const dtypeSearch = dto.dtype_code || dto.dtype_id;
    if (dtypeSearch) {
      const dtRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM delivery_types WHERE id::text = $1 OR code ILIKE $1 LIMIT 1`,
        [dtypeSearch],
      ).catch(() => []);
      if (dtRows.length > 0) dtypeId = dtRows[0].id;
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE subject_offerings
       SET subject_id = COALESCE($1, subject_id),
           prof_id = COALESCE($2, prof_id),
           dtype_id = COALESCE($3, dtype_id),
           batch_year = COALESCE($4, batch_year),
           hours_allotted = COALESCE($5, hours_allotted),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [subjectId, profId, dtypeId, dto.batch_year, dto.hours_allotted, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Subject offering not found');

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT so.*, 
              s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
              p.name AS prof_name, p.phase_order, p.academic_year,
              dt.name AS dtype_name, dt.code AS dtype_code,
              (SELECT COUNT(*) FROM attendance_sessions ass WHERE ass.offering_id::text = so.id::text OR (ass.subject_id::text = so.subject_id::text AND ass.offering_id IS NULL)) AS attendance_sessions_count
       FROM subject_offerings so
       LEFT JOIN subjects s ON s.id::text = so.subject_id::text
       LEFT JOIN professional_phases p ON p.id::text = so.prof_id::text
       LEFT JOIN delivery_types dt ON dt.id::text = so.dtype_id::text
       WHERE so.id::text = $1::text`,
      [id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteSubjectOffering(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    // Explicitly nullify offering_id in attendance_sessions so all attendance marks and history remain intact
    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE attendance_sessions SET offering_id = NULL WHERE offering_id = $1`,
      [id],
    ).catch(() => {});

    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM subject_offerings WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Subject offering deleted successfully (Attendance preserved)' };
  }

  /**
   * Intelligently sync subjects and subject offerings from SRMS portal API,
   * keeping all existing attendance sessions/records intact.
   */
  async syncExternalSubjects(
    tenantSlugOrCode?: string,
    targetCourseCd?: string,
    targetBranchCd?: string,
    targetBatchCd?: string,
    targetSemCd?: string,
  ): Promise<any[]> {
    this.logger.log(
      `Starting syncExternalSubjects... target: ${tenantSlugOrCode || 'all'}, course: ${targetCourseCd || 'all'}, branch: ${targetBranchCd || 'all'}, batch: ${targetBatchCd || 'all'}, sem: ${targetSemCd || 'all'}`,
    );

    let collegeRows: any[] = [];
    if (tenantSlugOrCode && tenantSlugOrCode !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlugOrCode);
      collegeRows = await this.ds.query(
        `SELECT id, code, name, slug FROM public.tenants WHERE slug = $1 OR code = $2 OR id::text = $3`,
        [slug, tenantSlugOrCode, tenantSlugOrCode],
      );
    } else {
      collegeRows = await this.ds.query(
        `SELECT id, code, name, slug FROM public.tenants WHERE is_active = true ORDER BY CAST(NULLIF(regexp_replace(code, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, name ASC`,
      );
    }

    if (collegeRows.length === 0) {
      collegeRows = [{ id: 'srms-cet-bareilly', code: '1', name: 'SRMS CET,BAREILLY', slug: 'srms-cet-bareilly' }];
    }

    const syncedResults: any[] = [];

    for (const col of collegeRows) {
      const cd = String(col.code || '1').trim();
      const slug = col.slug;
      const schema = `tenant_${slug}`;

      await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
      await this.ds.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});

      // Ensure required columns
      await this.ds.query(`
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(50);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS sub_addinfo VARCHAR(100);
        ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS mst_sub_name VARCHAR(200);
        ALTER TABLE "${schema}".attendance_sessions ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES "${schema}".subject_offerings(id) ON DELETE SET NULL;
      `).catch(() => {});

      // Query active courses for this tenant
      let courseList: any[] = [];
      if (targetCourseCd) {
        courseList = [{ course_cd: String(targetCourseCd).trim(), name: '' }];
      } else {
        const dbCourses = await this.ds.query(
          `SELECT course_cd, name FROM "${schema}".courses WHERE course_cd IS NOT NULL ORDER BY course_cd ASC`,
        ).catch(() => []);
        courseList = dbCourses.length > 0 ? dbCourses : [{ course_cd: '13', name: 'BCA' }, { course_cd: '1', name: 'B.Tech (CS)' }];
      }

      // Query active branches/departments
      let branchList: any[] = [];
      if (targetBranchCd) {
        branchList = [{ branch_cd: String(targetBranchCd).trim(), name: '' }];
      } else {
        const dbDepts = await this.ds.query(
          `SELECT COALESCE(branch_cd, code) as branch_cd, name FROM "${schema}".departments ORDER BY branch_cd ASC`,
        ).catch(() => []);
        branchList = dbDepts.length > 0 ? dbDepts : [{ branch_cd: '1', name: 'Computer Science' }];
      }

      // Query active batches
      let batchList: any[] = [];
      if (targetBatchCd) {
        batchList = [{ batch_cd: String(targetBatchCd).trim(), year: 2025 }];
      } else {
        const dbBatches = await this.ds.query(
          `SELECT COALESCE(batch_cd, code) as batch_cd, year FROM "${schema}".batches ORDER BY year DESC`,
        ).catch(() => []);
        batchList = dbBatches.length > 0 ? dbBatches : [{ batch_cd: '2', year: 2025 }];
      }

      const semestersToQuery = targetSemCd ? [targetSemCd] : ['1', '2', '3', '4', '5', '6', '7', '8'];

      for (const crs of courseList.slice(0, 10)) {
        const courseCd = String(crs.course_cd).trim();
        const courseName = crs.name || `Course ${courseCd}`;

        for (const br of branchList.slice(0, 5)) {
          const branchCd = String(br.branch_cd).trim();
          const deptName = br.name || `Department ${branchCd}`;

          for (const bat of batchList.slice(0, 3)) {
            const batchCd = String(bat.batch_cd).trim();
            const batchYear = parseInt(bat.year, 10) || 2025;

            for (const sem of semestersToQuery) {
              const semCd = String(sem).trim();
              let externalSubjects: any[] = [];

              try {
                const payload = {
                  colgcd: cd,
                  coursecd: courseCd,
                  branchcd: branchCd,
                  batchcd: batchCd,
                  semcd: semCd,
                };
                const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/AdminAttendance/GetAllSubjectDetail', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  const data = await res.json();
                  if (Array.isArray(data) && data.length > 0) {
                    externalSubjects = data;
                  }
                }
              } catch (e) {
                // Live portal error handled gracefully
              }

              for (const sub of externalSubjects) {
                const subCd = String(sub.sub_cd || sub.code || '').trim();
                const subName = String(sub.sub_name || sub.name || '').trim();
                if (!subCd && !subName) continue;

                const finalCode = subCd || (subName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase());
                const subType = (sub.SubTyp || sub.type || 'THEORY').toUpperCase();
                const isPractical = subType.includes('PRAC') || subType.includes('LAB');
                const isTutorial = subType.includes('TUT');
                const subAddInfo = sub.sub_addinfo || finalCode;
                const mstSubName = sub.mst_sub_name || `${subName} ${subType}`;

                // 1. Resolve / Create Department
                let deptId: string | null = null;
                const deptRows = await this.ds.query(
                  `SELECT id FROM "${schema}".departments WHERE branch_cd = $1 OR code = $1 LIMIT 1`,
                  [branchCd],
                ).catch(() => []);
                if (deptRows.length > 0) {
                  deptId = deptRows[0].id;
                } else {
                  const newDept = await this.ds.query(
                    `INSERT INTO "${schema}".departments (code, branch_cd, name, type, course_cd, course_name, colg_cd, is_active)
                     VALUES ($1, $1, $2, 'Academic', $3, $4, $5, true)
                     RETURNING id`,
                    [branchCd, deptName, courseCd, courseName, cd],
                  ).catch(() => []);
                  if (newDept && newDept.length > 0) deptId = newDept[0].id;
                }

                // 2. Resolve / Create Batch
                let batchId: string | null = null;
                const batchRows = await this.ds.query(
                  `SELECT id FROM "${schema}".batches WHERE batch_cd = $1 OR year = $2 OR code = $1 LIMIT 1`,
                  [batchCd, batchYear],
                ).catch(() => []);
                if (batchRows.length > 0) {
                  batchId = batchRows[0].id;
                }

                // 3. Upsert Subject in subjects table
                let subjectId: string;
                const existingSub = await this.ds.query(
                  `SELECT id FROM "${schema}".subjects WHERE code = $1 OR (name = $2 AND course_cd = $3) LIMIT 1`,
                  [finalCode, subName, courseCd],
                ).catch(() => []);

                if (existingSub && existingSub.length > 0) {
                  subjectId = existingSub[0].id;
                  await this.ds.query(
                    `UPDATE "${schema}".subjects
                     SET name = $1,
                         department_id = COALESCE($2, department_id),
                         batch_id = COALESCE($3, batch_id),
                         course_cd = COALESCE($4, course_cd),
                         course_name = COALESCE($5, course_name),
                         branch_cd = COALESCE($6, branch_cd),
                         batch_cd = COALESCE($7, batch_cd),
                         sem_cd = COALESCE($8, sem_cd),
                         semester = COALESCE($9, semester),
                         sub_addinfo = COALESCE($10, sub_addinfo),
                         mst_sub_name = COALESCE($11, mst_sub_name),
                         type = $12,
                         is_active = true
                     WHERE id = $13`,
                    [
                      subName, deptId, batchId, courseCd, courseName,
                      branchCd, batchCd, semCd, `Semester ${semCd}`,
                      subAddInfo, mstSubName, subType, subjectId,
                    ],
                  );
                } else {
                  const insertedSub = await this.ds.query(
                    `INSERT INTO "${schema}".subjects (
                       code, name, department_id, batch_id, credits, type, is_longitudinal, is_active,
                       course_cd, course_name, branch_cd, batch_cd, sem_cd, semester, sub_addinfo, mst_sub_name
                     ) VALUES ($1, $2, $3, $4, 4, $5, false, true, $6, $7, $8, $9, $10, $11, $12, $13)
                     RETURNING id`,
                    [
                      finalCode, subName, deptId, batchId, subType,
                      courseCd, courseName, branchCd, batchCd, semCd,
                      `Semester ${semCd}`, subAddInfo, mstSubName,
                    ],
                  );
                  subjectId = insertedSub[0].id;
                }

                // 4. Resolve / Create Delivery Type
                const dtCode = isPractical ? 'PR' : (isTutorial ? 'TUT' : 'TH');
                const dtName = isPractical ? 'Practical' : (isTutorial ? 'Tutorial' : 'Theory');
                let dtypeId: string;
                const dtRows = await this.ds.query(
                  `SELECT id FROM "${schema}".delivery_types WHERE code = $1 LIMIT 1`,
                  [dtCode],
                ).catch(() => []);
                if (dtRows && dtRows.length > 0) {
                  dtypeId = dtRows[0].id;
                } else {
                  const insertedDt = await this.ds.query(
                    `INSERT INTO "${schema}".delivery_types (code, name, is_active) VALUES ($1, $2, true) RETURNING id`,
                    [dtCode, dtName],
                  );
                  dtypeId = insertedDt[0].id;
                }

                // 5. Resolve / Create Professional Phase / Semester
                const phaseOrder = parseInt(semCd, 10) || 1;
                const phaseYear = Math.ceil(phaseOrder / 2) || 1;
                const phaseName = `Semester ${phaseOrder}`;
                let profId: string;
                const profRows = await this.ds.query(
                  `SELECT id FROM "${schema}".professional_phases 
                   WHERE course_cd = $1 AND (phase_order = $2 OR name = $3) 
                   LIMIT 1`,
                  [courseCd, phaseOrder, phaseName],
                ).catch(() => []);
                if (profRows && profRows.length > 0) {
                  profId = profRows[0].id;
                } else {
                  const insertedProf = await this.ds.query(
                    `INSERT INTO "${schema}".professional_phases (name, phase_order, course_cd, branch_cd, academic_year, academic_system, is_active)
                     VALUES ($1, $2, $3, $4, $5, 'semester', true)
                     RETURNING id`,
                    [phaseName, phaseOrder, courseCd, branchCd, phaseYear],
                  );
                  profId = insertedProf[0].id;
                }

                // 6. Intelligently Create / Upsert Subject Offering
                let offeringId: string;
                const existingOffering = await this.ds.query(
                  `SELECT id FROM "${schema}".subject_offerings
                   WHERE subject_id = $1 AND prof_id = $2 AND dtype_id = $3 AND batch_year = $4
                   LIMIT 1`,
                  [subjectId, profId, dtypeId, batchYear],
                ).catch(() => []);

                if (existingOffering && existingOffering.length > 0) {
                  offeringId = existingOffering[0].id;
                  await this.ds.query(
                    `UPDATE "${schema}".subject_offerings SET is_active = true WHERE id = $1`,
                    [offeringId],
                  );
                } else {
                  const insertedOff = await this.ds.query(
                    `INSERT INTO "${schema}".subject_offerings (subject_id, prof_id, dtype_id, batch_year, hours_allotted, is_active)
                     VALUES ($1, $2, $3, $4, 120, true)
                     RETURNING id`,
                    [subjectId, profId, dtypeId, batchYear],
                  );
                  offeringId = insertedOff[0].id;
                }

                // 7. Intelligently Link Existing Attendance Sessions (KEEP ATTENDANCE AS IT IS)
                await this.ds.query(
                  `UPDATE "${schema}".attendance_sessions
                   SET offering_id = $1
                   WHERE subject_id = $2
                     AND (offering_id IS NULL OR offering_id != $1)`,
                  [offeringId, subjectId],
                ).catch(() => {});

                syncedResults.push({
                  subjectId,
                  subjectCode: finalCode,
                  subjectName: subName,
                  offeringId,
                  dtypeCode: dtCode,
                  courseCd,
                  branchCd,
                  batchYear,
                  semester: semCd,
                  tenantSlug: slug,
                });
              }
            }
          }
        }
      }
    }

    this.logger.log(`syncExternalSubjects completed. Synced ${syncedResults.length} subjects/offerings with attendance linked.`);
    return this.listSubjectOfferings(tenantSlugOrCode);
  }

  // ─── 8. FACULTY SUBJECT LINKER ─────────────────────────────────────────────
  async listFacultySubjects(query: { facultyId?: string; subjectId?: string; departmentId?: string }, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);

    if (slug === 'all') {
      const allLinks: any[] = [];
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(
            `SELECT DISTINCT ON (fs.id) fs.id, fs.faculty_id, fs.subject_id, fs.is_active, fs.created_at,
                    f.name AS faculty_name, f.emp_id AS faculty_code, f.designation AS faculty_designation,
                    fd.name AS faculty_department_name, fd.code AS faculty_department_code,
                    s.name AS subject_name, s.code AS subject_code,
                    sd.name AS subject_department_name, sd.code AS subject_department_code
             FROM "${s}".faculty_subjects fs
             JOIN "${s}".faculty f ON f.id::text = fs.faculty_id::text
             LEFT JOIN "${s}".departments fd ON (fd.id::text = f.department_id::text OR fd.code::text = f.department_id::text)
             JOIN "${s}".subjects s ON s.id::text = fs.subject_id::text
             LEFT JOIN "${s}".departments sd ON (sd.id::text = s.department_id::text OR sd.code::text = s.department_id::text)
             WHERE fs.is_active = true
             ORDER BY fs.id, fs.created_at DESC`
          );
          rows.forEach((r: any) => {
            allLinks.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (e) {}
      }
      return allLinks;
    }

    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === slug || c.code === slug);
    const targetSlug = currentCollege?.slug || slug;
    const s = `tenant_${targetSlug}`;

    const params: any[] = [];
    let sql = `
      SELECT DISTINCT ON (fs.id) fs.id, fs.faculty_id, fs.subject_id, fs.is_active, fs.created_at,
             f.name AS faculty_name, f.emp_id AS faculty_code, f.designation AS faculty_designation,
             fd.name AS faculty_department_name, fd.code AS faculty_department_code,
             s.name AS subject_name, s.code AS subject_code,
             sd.name AS subject_department_name, sd.code AS subject_department_code
      FROM "${s}".faculty_subjects fs
      JOIN "${s}".faculty f ON f.id::text = fs.faculty_id::text
      LEFT JOIN "${s}".departments fd ON (fd.id::text = f.department_id::text OR fd.code::text = f.department_id::text)
      JOIN "${s}".subjects s ON s.id::text = fs.subject_id::text
      LEFT JOIN "${s}".departments sd ON (sd.id::text = s.department_id::text OR sd.code::text = s.department_id::text)
      WHERE fs.is_active = true
    `;
    if (query?.facultyId) {
      params.push(query.facultyId);
      sql += ` AND fs.faculty_id::text = $${params.length}::text`;
    }
    if (query?.subjectId) {
      params.push(query.subjectId);
      sql += ` AND fs.subject_id::text = $${params.length}::text`;
    }
    if (query?.departmentId) {
      params.push(query.departmentId);
      sql += ` AND (f.department_id::text = $${params.length}::text OR s.department_id::text = $${params.length}::text OR fd.code::text = $${params.length}::text OR sd.code::text = $${params.length}::text)`;
    }
    sql += ` ORDER BY fs.id, fs.created_at DESC`;
    const rows = await this.ds.query(sql, params).catch(() => []);
    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: currentCollege?.slug || targetSlug,
    }));
  }

  async linkFacultySubject(dto: LinkFacultySubjectDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === slug || c.code === slug);
    const targetSlug = currentCollege?.slug || (slug === 'all' ? 'srms-cet-bareilly' : slug);
    const schema = `tenant_${targetSlug}`;

    // Resolve Faculty UUID
    let facId = dto.facultyId;
    if (!this.isUUID(facId)) {
      const fRows = await this.ds.query(
        `SELECT id FROM "${schema}".faculty WHERE emp_id = $1 OR id::text = $1 LIMIT 1`,
        [dto.facultyId],
      ).catch(() => []);
      if (fRows.length) facId = fRows[0].id;
    }

    // Resolve Subject UUID
    let subId = dto.subjectId;
    if (!this.isUUID(subId)) {
      const sRows = await this.ds.query(
        `SELECT id FROM "${schema}".subjects WHERE code = $1 OR id::text = $1 LIMIT 1`,
        [dto.subjectId],
      ).catch(() => []);
      if (sRows.length) subId = sRows[0].id;
    }

    const rows = await this.ds.query(
      `INSERT INTO "${schema}".faculty_subjects (faculty_id, subject_id, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (faculty_id, subject_id) DO UPDATE SET is_active = true
       RETURNING *`,
      [facId, subId]
    );
    return rows[0];
  }

  async updateFacultySubject(id: string, dto: LinkFacultySubjectDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === slug || c.code === slug);
    const targetSlug = currentCollege?.slug || (slug === 'all' ? 'srms-cet-bareilly' : slug);
    const schema = `tenant_${targetSlug}`;

    // Resolve Faculty UUID
    let facId = dto.facultyId;
    if (!this.isUUID(facId)) {
      const fRows = await this.ds.query(
        `SELECT id FROM "${schema}".faculty WHERE emp_id = $1 OR id::text = $1 LIMIT 1`,
        [dto.facultyId],
      ).catch(() => []);
      if (fRows.length) facId = fRows[0].id;
    }

    // Resolve Subject UUID
    let subId = dto.subjectId;
    if (!this.isUUID(subId)) {
      const sRows = await this.ds.query(
        `SELECT id FROM "${schema}".subjects WHERE code = $1 OR id::text = $1 LIMIT 1`,
        [dto.subjectId],
      ).catch(() => []);
      if (sRows.length) subId = sRows[0].id;
    }

    const rows = await this.ds.query(
      `UPDATE "${schema}".faculty_subjects
       SET faculty_id = $1, subject_id = $2, is_active = true
       WHERE id = $3
       RETURNING *`,
      [facId, subId, id]
    );
    return rows[0];
  }

  async unlinkFacultySubject(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);

    if (slug === 'all' || !slug) {
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const res = await this.ds.query(`DELETE FROM "${s}".faculty_subjects WHERE id = $1 RETURNING id`, [id]);
          if (res.length > 0) {
            return { success: true, message: 'Faculty subject link removed successfully' };
          }
        } catch (e) {}
      }
      return { success: true, message: 'Faculty subject link removed successfully' };
    }

    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === slug || c.code === slug);
    const targetSlug = currentCollege?.slug || slug;
    const schema = `tenant_${targetSlug}`;

    await this.ds.query(
      `DELETE FROM "${schema}".faculty_subjects WHERE id = $1`,
      [id],
    ).catch(() => {});
    return { success: true, message: 'Faculty subject link removed successfully' };
  }

  // ─── 9. UNIT MASTER ─────────────────────────────────────────────────────────
  async listUnits(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      await this.ensureAdminMasterTables(slug);
      const targetCollege = colleges.find((c: any) => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT u.*, 
                s.name AS subject_name, s.code AS subject_code,
                COALESCE(u.course_cd, s.course_cd) AS course_cd,
                COALESCE(u.course_name, s.course_name) AS course_name,
                COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
         FROM units u
         LEFT JOIN subjects s ON s.id::text = u.subject_id::text
         ORDER BY u.unit_order ASC, u.code ASC`,
      ).catch(() => []);

      return rows.map((r: any) => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    const allUnits: any[] = [];
    for (const col of colleges) {
      try {
        await this.ensureAdminMasterTables(col.slug);
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT u.*, 
                  s.name AS subject_name, s.code AS subject_code,
                  COALESCE(u.course_cd, s.course_cd) AS course_cd,
                  COALESCE(u.course_name, s.course_name) AS course_name,
                  COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
           FROM units u
           LEFT JOIN subjects s ON s.id::text = u.subject_id::text
           ORDER BY u.unit_order ASC, u.code ASC`,
        ).catch(() => []);

        allUnits.push(
          ...rows.map((r: any) => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allUnits;
  }

  async createUnit(dto: CreateUnitMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.collegeSlug || dto.college_id || dto.collegeId);
    await this.ensureAdminMasterTables(slug);

    // 1. Resolve Subject
    let subjectId = dto.subject_id || dto.subjectId;
    let courseCd = dto.course_cd || dto.courseCd;
    let courseName = dto.course_name || dto.courseName;
    let branchCd = dto.branch_cd || dto.branchCd;
    const subjectSearch = dto.subject_code || dto.subjectCode || dto.subject_id || dto.subjectId;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, course_name, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        courseCd = courseCd || subRows[0].course_cd;
        courseName = courseName || subRows[0].course_name;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // 2. Resolve Batch
    let batchId = dto.batch_id || dto.batchId;
    let batchYear = dto.batch_year || dto.batchYear;
    if (batchId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId)) {
      const bRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, year, batch_cd FROM batches WHERE id::text = $1 OR batch_cd = $1 OR code = $1 OR year::text = $1 LIMIT 1`,
        [batchId],
      ).catch(() => []);
      if (bRows.length > 0) {
        batchId = bRows[0].id;
        batchYear = batchYear || bRows[0].year;
      }
    }

    const bloomLevel = dto.bloom_level || dto.bloomLevel || 'KL-2 (Understand)';
    const unitOrder = dto.unit_order || dto.unitOrder || 1;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO units (code, name, description, subject_id, subject_code, course_cd, course_name, branch_cd, batch_id, batch_year, bloom_level, unit_order, hours, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
       RETURNING *`,
      [
        dto.code.trim().toUpperCase(),
        dto.name?.trim() || dto.code.trim(),
        dto.description?.trim() || dto.name?.trim() || '',
        subjectId || null,
        dto.subject_code || null,
        courseCd || null,
        courseName || null,
        branchCd || null,
        batchId || null,
        batchYear || null,
        dto.bloom_level || 'KL-2 (Understand)',
        dto.unit_order || 1,
        dto.hours || 0,
      ],
    );

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT u.*, 
              s.name AS subject_name, s.code AS subject_code,
              COALESCE(u.course_cd, s.course_cd) AS course_cd,
              COALESCE(u.course_name, s.course_name) AS course_name,
              COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
       FROM units u
       LEFT JOIN subjects s ON u.subject_id = s.id
       WHERE u.id = $1`,
      [rows[0].id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateUnit(id: string, dto: UpdateUnitMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    let subjectId = dto.subject_id;
    let courseCd = dto.course_cd;
    let courseName = dto.course_name;
    let branchCd = dto.branch_cd;
    const subjectSearch = dto.subject_code || dto.subject_id;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, course_name, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        courseCd = courseCd || subRows[0].course_cd;
        courseName = courseName || subRows[0].course_name;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE units
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           subject_id = COALESCE($4, subject_id),
           subject_code = COALESCE($5, subject_code),
           course_cd = COALESCE($6, course_cd),
           course_name = COALESCE($7, course_name),
           branch_cd = COALESCE($8, branch_cd),
           batch_year = COALESCE($9, batch_year),
           bloom_level = COALESCE($10, bloom_level),
           unit_order = COALESCE($11, unit_order),
           hours = COALESCE($12, hours),
           is_active = COALESCE($13, is_active),
           updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        dto.code ? dto.code.trim().toUpperCase() : null,
        dto.name ? dto.name.trim() : null,
        dto.description ? dto.description.trim() : null,
        subjectId || null,
        dto.subject_code || null,
        courseCd || null,
        courseName || null,
        branchCd || null,
        dto.batch_year || null,
        dto.bloom_level || null,
        dto.unit_order || null,
        dto.hours || null,
        dto.is_active,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Unit not found');

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT u.*, 
              s.name AS subject_name, s.code AS subject_code,
              COALESCE(u.course_cd, s.course_cd) AS course_cd,
              COALESCE(u.course_name, s.course_name) AS course_name,
              COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
       FROM units u
       LEFT JOIN subjects s ON u.subject_id = s.id
       WHERE u.id = $1`,
      [id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteUnit(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM units WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Unit deleted successfully' };
  }
}
