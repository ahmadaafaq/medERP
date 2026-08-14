import {
  Injectable, NotFoundException, BadRequestException, Logger, OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateCollegeDto, UpdateCollegeDto,
  CreateCourseDto, UpdateCourseDto,
  CreateBatchDto, UpdateBatchDto,
  CreateBranchDto, UpdateBranchDto,
  CreateSessionDto, UpdateSessionDto,
  CreateProfessionalDto, UpdateProfessionalDto,
  CreateGroupDto, UpdateGroupDto,
} from './dto/college-master.dto';

const FALLBACK_SRMS_COLLEGES = [
  { colg_cd: '1', colg_name: 'SRMS CET,BAREILLY' },
  { colg_cd: '2', colg_name: 'SRMS CETR,BAREILLY' },
  { colg_cd: '3', colg_name: 'SRMS CET, UNNAO' },
  { colg_cd: '4', colg_name: 'SRMS COLLEGE OF LAW' },
  { colg_cd: '5', colg_name: 'SRMS IBS, LUCKNOW' },
  { colg_cd: '6', colg_name: 'SRMS IAHS,BAREILLY' },
  { colg_cd: '7', colg_name: 'SRMS TRUST, BAREILLY' },
  { colg_cd: '8', colg_name: 'SRMS NURSING SCHOOL' },
  { colg_cd: '9', colg_name: 'SRMS NURSING COLLEGE' },
  { colg_cd: '10', colg_name: 'SRMS RIDDHIMA,BAREILLY' },
  { colg_cd: '11', colg_name: 'SRMS IMS,BAREILLY' },
  { colg_cd: '12', colg_name: 'SRMS COLLEGE OF NURSING & PARAMEDICAL SCIENCES,UNNAO' },
  { colg_cd: '13', colg_name: 'SRMS QUIZ PANEL' },
  { colg_cd: '14', colg_name: 'SRMS CRICKET ACADEMY' },
];

const DEFAULT_COLLEGE_COURSES: Record<string, Array<{
  code: string;
  name: string;
  degree_level: string;
  duration_years: number;
  course_cd?: string;
  course_type?: string;
}>> = {
  '1': [ // SRMS CET, BAREILLY
    { code: 'BTECH-CS', name: 'B.Tech in Computer Science & Engineering', degree_level: 'UG', duration_years: 4, course_cd: '1', course_type: 'UG' },
    { code: 'BTECH-IT', name: 'B.Tech in Information Technology', degree_level: 'UG', duration_years: 4, course_cd: '2', course_type: 'UG' },
    { code: 'BTECH-ME', name: 'B.Tech in Mechanical Engineering', degree_level: 'UG', duration_years: 4, course_cd: '3', course_type: 'UG' },
    { code: 'BTECH-EE', name: 'B.Tech in Electrical & Electronics Engineering', degree_level: 'UG', duration_years: 4, course_cd: '4', course_type: 'UG' },
    { code: 'BTECH-EC', name: 'B.Tech in Electronics & Communication Engineering', degree_level: 'UG', duration_years: 4, course_cd: '5', course_type: 'UG' },
    { code: 'BPHARM', name: 'Bachelor of Pharmacy (B.Pharm)', degree_level: 'UG', duration_years: 4, course_cd: '6', course_type: 'UG' },
    { code: 'MBA', name: 'Master of Business Administration (MBA)', degree_level: 'PG', duration_years: 2, course_cd: '7', course_type: 'PG' },
    { code: 'MCA', name: 'Master of Computer Applications (MCA)', degree_level: 'PG', duration_years: 2, course_cd: '8', course_type: 'PG' },
    { code: 'MTECH-CS', name: 'M.Tech in Computer Science & Engineering', degree_level: 'PG', duration_years: 2, course_cd: '9', course_type: 'PG' },
  ],
  '2': [ // SRMS CETR, BAREILLY
    { code: 'BTECH-CSE', name: 'B.Tech in Computer Science & Engineering', degree_level: 'UG', duration_years: 4, course_cd: '1', course_type: 'UG' },
    { code: 'BTECH-AIML', name: 'B.Tech Artificial Intelligence & Machine Learning', degree_level: 'UG', duration_years: 4, course_cd: '2', course_type: 'UG' },
  ],
  '3': [ // SRMS CET, UNNAO
    { code: 'BTECH-CS-UNN', name: 'B.Tech Computer Science & Engineering (Unnao)', degree_level: 'UG', duration_years: 4, course_cd: '1', course_type: 'UG' },
    { code: 'BTECH-AIML-UNN', name: 'B.Tech AI & Data Science (Unnao)', degree_level: 'UG', duration_years: 4, course_cd: '2', course_type: 'UG' },
  ],
  '4': [ // SRMS COLLEGE OF LAW
    { code: 'BA-LLB', name: 'B.A. LL.B. (Integrated 5 Years Honours)', degree_level: 'UG', duration_years: 5, course_cd: '1', course_type: 'UG' },
    { code: 'LLB', name: 'Bachelor of Laws (LL.B. 3 Years)', degree_level: 'UG', duration_years: 3, course_cd: '2', course_type: 'UG' },
  ],
  '5': [ // SRMS IBS, LUCKNOW
    { code: 'PGDM', name: 'Post Graduate Diploma in Management (PGDM)', degree_level: 'PG', duration_years: 2, course_cd: '1', course_type: 'PG' },
    { code: 'BBA', name: 'Bachelor of Business Administration (BBA)', degree_level: 'UG', duration_years: 3, course_cd: '2', course_type: 'UG' },
    { code: 'BCOM-HONS', name: 'Bachelor of Commerce (B.Com Honours)', degree_level: 'UG', duration_years: 3, course_cd: '3', course_type: 'UG' },
  ],
  '6': [ // SRMS IAHS, BAREILLY
    { code: 'BPT', name: 'Bachelor of Physiotherapy (BPT)', degree_level: 'UG', duration_years: 4.5, course_cd: '1', course_type: 'UG' },
    { code: 'BMLT', name: 'B.Sc. in Medical Laboratory Technology (BMLT)', degree_level: 'UG', duration_years: 3, course_cd: '2', course_type: 'UG' },
    { code: 'BOPTOM', name: 'Bachelor of Clinical Optometry (B.Optom)', degree_level: 'UG', duration_years: 4, course_cd: '3', course_type: 'UG' },
    { code: 'BRIT', name: 'B.Sc. in Radio-Imaging & Radiology (BRIT)', degree_level: 'UG', duration_years: 3, course_cd: '4', course_type: 'UG' },
    { code: 'BOTT', name: 'B.Sc. in Operation Theatre Technology (BOTT)', degree_level: 'UG', duration_years: 3, course_cd: '5', course_type: 'UG' },
  ],
  '7': [ // SRMS TRUST, BAREILLY
    { code: 'TRUST-RES', name: 'Trust Academic Research & Foundation', degree_level: 'UG', duration_years: 1, course_cd: '1', course_type: 'UG' },
  ],
  '8': [ // SRMS NURSING SCHOOL
    { code: 'GNM', name: 'General Nursing and Midwifery (GNM)', degree_level: 'Diploma', duration_years: 3, course_cd: '1', course_type: 'UG' },
    { code: 'ANM', name: 'Auxiliary Nurse Midwife (ANM)', degree_level: 'Diploma', duration_years: 2, course_cd: '2', course_type: 'UG' },
  ],
  '9': [ // SRMS NURSING COLLEGE
    { code: 'BSC-NURSING', name: 'B.Sc. Nursing (Basic 4 Years Degree)', degree_level: 'UG', duration_years: 4, course_cd: '1', course_type: 'UG' },
    { code: 'PB-BSC-NURSING', name: 'Post Basic B.Sc. Nursing', degree_level: 'UG', duration_years: 2, course_cd: '2', course_type: 'UG' },
    { code: 'MSC-NURSING', name: 'M.Sc. Nursing (Medical Surgical / Obstetrics)', degree_level: 'PG', duration_years: 2, course_cd: '3', course_type: 'PG' },
  ],
  '10': [ // SRMS RIDDHIMA, BAREILLY
    { code: 'DIP-DANCE', name: 'Diploma in Classical Dance (Kathak & Folk)', degree_level: 'Diploma', duration_years: 2, course_cd: '1', course_type: 'UG' },
    { code: 'DIP-VOCAL', name: 'Diploma in Classical Music & Vocal Arts', degree_level: 'Diploma', duration_years: 2, course_cd: '2', course_type: 'UG' },
    { code: 'CERT-FINEARTS', name: 'Certificate in Fine Arts & Visual Design', degree_level: 'Diploma', duration_years: 1, course_cd: '3', course_type: 'UG' },
  ],
  '11': [ // SRMS IMS, BAREILLY (NMC Medical College -> Professional phase based!)
    { code: 'MBBS', name: 'M.B.B.S.', degree_level: 'UG', duration_years: 5.5, course_cd: '1', course_type: 'UG' },
    { code: 'MD-MED', name: 'M.D. (General Medicine)', degree_level: 'PG', duration_years: 3, course_cd: '2', course_type: 'PG' },
    { code: 'MS-SURG', name: 'M.S. (General Surgery)', degree_level: 'PG', duration_years: 3, course_cd: '3', course_type: 'PG' },
    { code: 'MD-PATH', name: 'M.D. (Pathology)', degree_level: 'PG', duration_years: 3, course_cd: '4', course_type: 'PG' },
    { code: 'MD-RADIO', name: 'M.D. (Radio-Diagnosis)', degree_level: 'PG', duration_years: 3, course_cd: '5', course_type: 'PG' },
    { code: 'MD-PED', name: 'M.D. (Pediatrics)', degree_level: 'PG', duration_years: 3, course_cd: '6', course_type: 'PG' },
  ],
  '12': [ // SRMS COLLEGE OF NURSING & PARAMEDICAL SCIENCES, UNNAO
    { code: 'BSC-NUR-UNN', name: 'B.Sc. Nursing (Unnao Campus)', degree_level: 'UG', duration_years: 4, course_cd: '1', course_type: 'UG' },
    { code: 'BMLT-UNN', name: 'B.Sc. in Medical Laboratory Technology (Unnao)', degree_level: 'UG', duration_years: 3, course_cd: '2', course_type: 'UG' },
    { code: 'DMLT-UNN', name: 'Diploma in Medical Laboratory Technology', degree_level: 'Diploma', duration_years: 2, course_cd: '3', course_type: 'UG' },
  ],
  '13': [ // SRMS QUIZ PANEL
    { code: 'QUIZ-PANEL', name: 'Inter-Collegiate Quiz & Scientific Competitions', degree_level: 'Certificate', duration_years: 1, course_cd: '1', course_type: 'UG' },
  ],
  '14': [ // SRMS CRICKET ACADEMY
    { code: 'CRICKET-ACAD', name: 'Cricket Excellence Training & Athletics Development', degree_level: 'Certificate', duration_years: 1, course_cd: '1', course_type: 'UG' },
  ],
};

function generateCollegeSlug(colgCd: string, colgName: string): string {
  if (colgCd === '11' || colgName.includes('IMS') || colgName.includes('Medical')) {
    return 'srms-ims';
  }
  const clean = colgName
    .toLowerCase()
    .replace(/[&,]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean || `srms-college-${colgCd}`;
}

@Injectable()
export class CollegeMasterService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CollegeMasterService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  async onApplicationBootstrap() {
    // Run sync asynchronously in background to ensure instant HTTP server start
    setTimeout(async () => {
      try {
        await this.syncExternalColleges();
        await this.syncExternalCourses();
      } catch (err: any) {
        this.logger.error('Error during initial sync:', err?.message || err);
      }
    }, 1000);
  }

  private async resolveTenantSlug(collegeIdOrSlug?: string): Promise<string> {
    if (!collegeIdOrSlug || collegeIdOrSlug === 'all') return 'srms-ims';
    const clean = String(collegeIdOrSlug).trim();
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
    } catch (e) {
      // Fallback
    }
    return clean.toLowerCase();
  }

  private async getCollegeIdBySlug(slug: string): Promise<string | null> {
    const rows = await this.ds.query(`SELECT id FROM public.tenants WHERE slug = $1`, [slug]);
    return rows.length > 0 ? rows[0].id : null;
  }

  // ─── 1. COLLEGES (PUBLIC.TENANTS) ─────────────────────────────────────────
  async syncExternalColleges(): Promise<any[]> {
    this.logger.log('Syncing colleges from external SRMS ERP API (https://myportal.srms.ac.in/SRMSERP/Home/GetCollege)...');

    // 1. Ensure column 'code' exists on public.tenants
    await this.ds.query(`
      ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(50);
    `).catch(() => {});

    // 2. Fetch external colleges
    let externalList: Array<{ colg_cd: string; colg_name: string }> = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetCollege', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        externalList = await res.json();
      }
    } catch (err: any) {
      this.logger.warn(`External GetCollege fetch failed: ${err.message}. Using fallback SRMS colleges list.`);
    }

    if (!Array.isArray(externalList) || externalList.length === 0) {
      externalList = FALLBACK_SRMS_COLLEGES;
    }

    // 3. Upsert each college into public.tenants
    for (const item of externalList) {
      const cd = String(item.colg_cd).trim();
      const name = String(item.colg_name).trim();
      const slug = generateCollegeSlug(cd, name);
      const domain = slug === 'srms-ims' ? 'srms.mederp.app' : `${slug}.mederp.app`;
      const isPrimary = slug === 'srms-ims';

      const existing = await this.ds.query(
        `SELECT id, slug, code, schema_provisioned FROM public.tenants WHERE code = $1 OR slug = $2 LIMIT 1`,
        [cd, slug],
      );

      if (existing.length > 0) {
        await this.ds.query(
          `UPDATE public.tenants
           SET name = $1,
               code = $2,
               slug = $3,
               domain = COALESCE(domain, $4),
               plan = COALESCE(plan, 'enterprise'),
               primary_color = COALESCE(primary_color, '#6366F1'),
               is_active = true,
               schema_provisioned = CASE WHEN $5 = true THEN true ELSE schema_provisioned END,
               updated_at = NOW()
           WHERE id = $6`,
          [name, cd, slug, domain, isPrimary, existing[0].id],
        );
      } else {
        await this.ds.query(
          `INSERT INTO public.tenants (name, code, slug, domain, plan, primary_color, is_active, schema_provisioned)
           VALUES ($1, $2, $3, $4, 'enterprise', '#6366F1', true, $5)`,
          [name, cd, slug, domain, isPrimary],
        );
      }
    }

    // 4. Remove any stale dummy tenants without code (except srms-ims)
    await this.ds.query(`
      DELETE FROM public.tenants WHERE (code IS NULL OR code = '') AND slug NOT IN ('srms-ims', 'srms');
    `).catch(() => {});

    this.logger.log(`Successfully synced ${externalList.length} SRMS colleges into public.tenants.`);
    return this.listColleges();
  }

  async fetchLiveColleges(): Promise<any[]> {
    const res = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetCollege', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      throw new Error(`SRMS Portal API error (${res.status})`);
    }
    return await res.json();
  }

  async fetchLiveCourses(colgcd: string): Promise<any[]> {
    const res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colgcd: String(colgcd).trim() }),
    });
    if (!res.ok) {
      throw new Error(`SRMS Portal API error (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async fetchLiveBranches(colgcd: string, coursecd: string): Promise<any[]> {
    const res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colgcd: String(colgcd).trim(), coursecd: String(coursecd).trim() }),
    });
    if (!res.ok) {
      throw new Error(`SRMS Portal API error (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async listColleges(): Promise<any[]> {
    await this.ds.query(`ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(50);`).catch(() => {});
    const rows = await this.ds.query(
      `SELECT id, code, name, slug, domain, plan, primary_color, is_active, schema_provisioned, created_at
       FROM public.tenants
       ORDER BY CAST(NULLIF(regexp_replace(code, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, name ASC`,
    );
    if (rows.length === 0) {
      return this.syncExternalColleges();
    }
    return rows;
  }

  async createCollege(dto: CreateCollegeDto) {
    await this.ds.query(`ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(50);`).catch(() => {});
    const existing = await this.ds.query(
      `SELECT id FROM public.tenants WHERE slug = $1 OR (code IS NOT NULL AND code = $2)`,
      [dto.slug.toLowerCase(), dto.code || ''],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`College with slug '${dto.slug}' or code '${dto.code}' already exists.`);
    }

    const rows = await this.ds.query(
      `INSERT INTO public.tenants (code, name, slug, domain, plan, primary_color, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code || null, dto.name, dto.slug.toLowerCase(), dto.domain || null, dto.plan || 'standard', dto.primaryColor || '#6366F1'],
    );

    // Auto-provision schema for new college if needed
    await this.tenantSchemaService.provisionSchema(dto.slug.toLowerCase()).catch(() => {});

    return rows[0];
  }

  async updateCollege(idOrSlug: string, dto: UpdateCollegeDto) {
    await this.ds.query(`ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(50);`).catch(() => {});
    const rows = await this.ds.query(
      `SELECT * FROM public.tenants WHERE id::text = $1 OR slug = $1 OR code = $1`,
      [idOrSlug],
    );
    if (rows.length === 0) throw new NotFoundException('College not found');

    const targetId = rows[0].id;

    const updated = await this.ds.query(
      `UPDATE public.tenants
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           domain = COALESCE($3, domain),
           plan = COALESCE($4, plan),
           primary_color = COALESCE($5, primary_color),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [dto.code, dto.name, dto.domain, dto.plan, dto.primaryColor || dto.primary_color, dto.isActive ?? dto.is_active, targetId],
    );

    return updated[0];
  }

  async deleteCollege(idOrSlug: string) {
    const rows = await this.ds.query(
      `SELECT id, slug FROM public.tenants WHERE id::text = $1 OR slug = $1 OR code = $1`,
      [idOrSlug],
    );
    if (rows.length === 0) throw new NotFoundException('College not found');

    await this.ds.query(`DELETE FROM public.tenants WHERE id = $1`, [rows[0].id]);
    return { success: true, message: `College deleted successfully.` };
  }

  // ─── 2. COURSES ────────────────────────────────────────────────────────────
  async syncExternalCourses(tenantSlug?: string): Promise<any[]> {
    this.logger.log('Syncing courses sequentially for colleges from official SRMS ERP API (https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse)...');

    // 1. Fetch colleges list
    let collegeRows = await this.listColleges();
    if (tenantSlug && tenantSlug !== 'all') {
      const resolved = await this.resolveTenantSlug(tenantSlug);
      collegeRows = collegeRows.filter(c => c.slug === resolved || c.code === resolved || c.id === resolved);
    }

    const syncedCourses: any[] = [];

    // Helper to determine degree level, duration, and starting phase
    const inferCourseMetadata = (name: string, isIms: boolean) => {
      const upper = name.toUpperCase();
      if (isIms) {
        if (upper.includes('M.B.B.S') || upper.includes('MBBS')) {
          return { degree_level: 'UG', duration_years: 5.5, professional_phase: '1st Professional (Phase I)' };
        }
        if (upper.includes('P.G') || upper.includes('SUPER SPECIALITY') || upper.includes('DM') || upper.includes('MCH')) {
          return { degree_level: 'PG', duration_years: 3.0, professional_phase: '1st Year Resident (Junior Resident)' };
        }
        if (upper.includes('INTERNSHIP')) {
          return { degree_level: 'Internship', duration_years: 1.0, professional_phase: 'Compulsory Rotatory Medical Internship' };
        }
        if (upper.includes('ISCCM') || upper.includes('BDTC') || upper.includes('PDCC')) {
          return { degree_level: 'Fellowship', duration_years: 1.0, professional_phase: 'Post-Doctoral Phase I' };
        }
        return { degree_level: 'Medical', duration_years: 3.0, professional_phase: '1st Professional (Phase I)' };
      }

      // Non-IMS Institutions (Semester System)
      if (upper.includes('BA.LL.B') || upper.includes('B.A. LL.B') || upper.includes('BA LLB')) {
        return { degree_level: 'UG', duration_years: 5.0, professional_phase: 'Semester 1 (1st Year)' };
      }
      if (upper.includes('B.TECH') || upper.includes('BTECH') || upper.includes('B.PHARM') || upper.includes('BPHARM') || upper.includes('BHMCT') || upper.includes('B.SC NURSING') || upper.includes('B.OPTOM')) {
        return { degree_level: 'UG', duration_years: 4.0, professional_phase: 'Semester 1 (1st Year)' };
      }
      if (upper.includes('BBA') || upper.includes('B.B.A') || upper.includes('BCA') || upper.includes('B.COM') || upper.includes('LL.B') || upper.includes('LLB') || upper.includes('GNM') || upper.includes('B.SC') || upper.includes('BSC') || upper.includes('DIPLOMA (3 YEARS)') || upper.includes('ADVANCE DIPLOMA (3 YEARS)')) {
        return { degree_level: upper.includes('GNM') ? 'Diploma' : 'UG', duration_years: 3.0, professional_phase: 'Semester 1 (1st Year)' };
      }
      if (upper.includes('MBA') || upper.includes('M.B.A') || upper.includes('MCA') || upper.includes('M.TECH') || upper.includes('M. PHARM') || upper.includes('MPHARM') || upper.includes('M.SC') || upper.includes('MSC') || upper.includes('PGDM') || upper.includes('ANM') || upper.includes('DIPLOMA (2 YEARS)')) {
        return { degree_level: upper.includes('ANM') ? 'Diploma' : 'PG', duration_years: 2.0, professional_phase: 'Semester 1 (1st Year)' };
      }
      if (upper.includes('CERTIFICATE') || upper.includes('HOBBY') || upper.includes('THEATRE') || upper.includes('WORKSHOP') || upper.includes('PHOTOGRAPHY') || upper.includes('TEST') || upper.includes('ACADEMY') || upper.includes('SAMUDAYIK')) {
        return { degree_level: 'Certificate', duration_years: 1.0, professional_phase: 'Semester 1 (1st Year)' };
      }
      return { degree_level: 'UG', duration_years: 3.0, professional_phase: 'Semester 1 (1st Year)' };
    };

    // 2. Loop sequentially through each college
    for (const col of collegeRows) {
      const cd = String(col.code || '').trim();
      const slug = col.slug;
      const isIms = (cd === '11' || slug === 'srms-ims' || col.name?.includes('IMS'));
      const academicSystem = isIms ? 'professional' : 'semester';

      // Auto-provision schema for this college if needed
      await this.tenantSchemaService.provisionSchema(slug).catch(() => {});

      const schema = `tenant_${slug}`;
      await this.ds.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});

      // Ensure courses table exists
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".courses (
          id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code               VARCHAR(50) UNIQUE NOT NULL,
          name               VARCHAR(200) NOT NULL,
          degree_level       VARCHAR(50) DEFAULT 'UG',
          duration_years     NUMERIC(4,1) DEFAULT 4.0,
          professional_phase VARCHAR(100) DEFAULT 'Semester 1 (1st Year)',
          academic_system    VARCHAR(50) DEFAULT 'semester',
          course_cd          VARCHAR(50),
          course_type        VARCHAR(50),
          is_active          BOOLEAN     DEFAULT true,
          created_at         TIMESTAMPTZ DEFAULT NOW()
        );
      `).catch(() => {});

      await this.ds.query(`
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS academic_system VARCHAR(50) DEFAULT '${academicSystem}';
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(50);
        ALTER TABLE "${schema}".courses ALTER COLUMN duration_years TYPE NUMERIC(4,1);
      `).catch(() => {});

      // 3. Sequentially query official external API: POST https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse
      let externalCourseList: any[] = [];
      if (cd) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colgcd: cd }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const items = await res.json();
            if (Array.isArray(items)) {
              // Keep all courses returned by the official SRMS GetCourse API
              externalCourseList = items;
            }
          }
        } catch (err: any) {
          this.logger.warn(`Failed to fetch GetCourse for colgcd ${cd}: ${err?.message}`);
        }
      }

      // Build target courses list to upsert for this college
      const targetCourses: Array<{
        code: string;
        name: string;
        degree_level: string;
        duration_years: number;
        academic_system: string;
        professional_phase: string;
        course_cd?: string;
        course_type?: string;
        is_active: boolean;
      }> = [];

      if (externalCourseList.length > 0) {
        for (const ext of externalCourseList) {
          const rawName = String(ext.course_name || '').trim();
          const cleanAbbr = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || `CRS${ext.course_cd}`;
          const uniqueCode = `${cleanAbbr}-${cd}`;
          const meta = inferCourseMetadata(rawName, isIms);
          const isActive = String(ext.active_flg) === '1' || ext.ACTIVESTS === 'ACTIVE';

          targetCourses.push({
            code: uniqueCode,
            name: rawName,
            degree_level: meta.degree_level,
            duration_years: meta.duration_years,
            academic_system: academicSystem,
            professional_phase: meta.professional_phase,
            course_cd: String(ext.course_cd || ''),
            course_type: meta.degree_level,
            is_active: isActive,
          });
        }
      }

      // If portal returned courses, clean up old stale courses not in portal
      if (targetCourses.length > 0) {
        const activeCourseCds = targetCourses.map(t => t.course_cd).filter(Boolean);
        if (activeCourseCds.length > 0) {
          await this.ds.query(
            `DELETE FROM "${schema}".courses WHERE course_cd IS NOT NULL AND course_cd NOT IN (${activeCourseCds.map((_, i) => `$${i + 1}`).join(',')})`,
            activeCourseCds,
          ).catch(() => {});
        }
      }

      // 4. Upsert courses into this college schema
      for (const item of targetCourses) {
        try {
          const existing = await this.ds.query(
            `SELECT id FROM "${schema}".courses WHERE course_cd = $1 OR code = $2 OR name = $3 LIMIT 1`,
            [item.course_cd || null, item.code, item.name],
          ).catch(() => []);

          if (existing && existing.length > 0) {
            const updated = await this.ds.query(
              `UPDATE "${schema}".courses
               SET name = $1,
                   code = $2,
                   degree_level = $3,
                   duration_years = $4,
                   professional_phase = $5,
                   academic_system = $6,
                   course_cd = COALESCE($7, course_cd),
                   course_type = COALESCE($8, course_type),
                   is_active = $9
               WHERE id = $10
               RETURNING *`,
              [item.name, item.code, item.degree_level, item.duration_years, item.professional_phase, item.academic_system, item.course_cd || null, item.course_type || null, item.is_active, existing[0].id],
            );
            const updatedRow = (updated && updated[0]) ? (updated[0]['0'] || (Array.isArray(updated[0]) ? updated[0][0] : updated[0])) : {};
            syncedCourses.push({ ...updatedRow, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug });
          } else {
            const inserted = await this.ds.query(
              `INSERT INTO "${schema}".courses (code, name, degree_level, duration_years, professional_phase, academic_system, course_cd, course_type, is_active)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING *`,
              [item.code, item.name, item.degree_level, item.duration_years, item.professional_phase, item.academic_system, item.course_cd || null, item.course_type || null, item.is_active],
            );
            const insertedRow = (inserted && inserted[0]) ? (inserted[0]['0'] || (Array.isArray(inserted[0]) ? inserted[0][0] : inserted[0])) : {};
            syncedCourses.push({ ...insertedRow, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug });
          }
        } catch (upsertErr: any) {
          this.logger.warn(`Failed to upsert course ${item.code} in ${schema}: ${upsertErr?.message}`);
        }
      }
    }

    this.logger.log(`Sequential course sync complete. Total active courses synced: ${syncedCourses.length}`);
    return syncedCourses;
  }

  async listCourses(tenantSlug?: string): Promise<any[]> {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || await this.getCollegeIdBySlug(slug);
      const collegeName = targetCollege?.name || '';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, degree_level, duration_years, professional_phase,
                  COALESCE(academic_system, CASE WHEN '${slug}' = 'srms-ims' THEN 'professional' ELSE 'semester' END) AS academic_system,
                  course_cd, course_type, is_active, created_at
           FROM courses
           ORDER BY created_at ASC, code ASC`,
        );
        if (rows.length === 0) {
          await this.syncExternalCourses(slug);
          const fresh = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id, code, name, degree_level, duration_years, professional_phase,
                    COALESCE(academic_system, CASE WHEN '${slug}' = 'srms-ims' THEN 'professional' ELSE 'semester' END) AS academic_system,
                    course_cd, course_type, is_active, created_at
             FROM courses
             ORDER BY created_at ASC, code ASC`,
          ).catch(() => []);
          return fresh.map(r => ({
            ...r,
            college_id: collegeId,
            college_name: collegeName,
            college_code: collegeCode,
            college_slug: slug,
          }));
        }
        return rows.map(r => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      } catch (err: any) {
        await this.syncExternalCourses(slug);
        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, degree_level, duration_years, professional_phase,
                  COALESCE(academic_system, CASE WHEN '${slug}' = 'srms-ims' THEN 'professional' ELSE 'semester' END) AS academic_system,
                  course_cd, course_type, is_active, created_at
           FROM courses
           ORDER BY created_at ASC, code ASC`,
        ).catch(() => []);
        return rows.map(r => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      }
    }

    // Return aggregated courses across all colleges
    const allCourses: any[] = [];
    for (const col of colleges) {
      const slug = col.slug;
      const schema = `tenant_${slug}`;
      try {
        const rows = await this.ds.query(
          `SELECT id, code, name, degree_level, duration_years, professional_phase,
                  COALESCE(academic_system, CASE WHEN '${slug}' = 'srms-ims' THEN 'professional' ELSE 'semester' END) AS academic_system,
                  course_cd, course_type, is_active, created_at
           FROM "${schema}".courses
           ORDER BY created_at ASC, code ASC`,
        );
        for (const r of rows) {
          allCourses.push({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: slug,
          });
        }
      } catch (err) {
        // Schema not queried yet or table does not exist
      }
    }

    if (allCourses.length === 0) {
      return this.syncExternalCourses();
    }
    return allCourses;
  }

  async createCourse(dto: CreateCourseDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.collegeId);
    const schema = `tenant_${slug}`;
    const isIms = (slug === 'srms-ims');
    const academicSystem = dto.academicSystem || dto.academic_system || (isIms ? 'professional' : 'semester');
    const duration = dto.durationYears || (isIms ? 5.5 : 4.0);
    const phase = dto.professionalPhase || (isIms ? '1st Professional (Phase I)' : 'Semester 1 (1st Year)');

    await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
    await this.ds.query(`
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS academic_system VARCHAR(50) DEFAULT '${academicSystem}';
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(50);
    `).catch(() => {});

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO courses (code, name, degree_level, duration_years, professional_phase, academic_system, course_cd, course_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.degreeLevel || 'UG', duration, phase, academicSystem, dto.courseCd || null, dto.courseType || null],
    );
    const collegeId = await this.getCollegeIdBySlug(slug);
    return { ...rows[0], college_id: collegeId, college_slug: slug };
  }

  async updateCourse(id: string, dto: UpdateCourseDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.collegeId);
    const schema = `tenant_${slug}`;
    const isIms = (slug === 'srms-ims');
    const academicSystem = dto.academicSystem || dto.academic_system;

    await this.ds.query(`
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS academic_system VARCHAR(50);
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(50);
    `).catch(() => {});

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE courses
       SET name = COALESCE($1, name),
           degree_level = COALESCE($2, degree_level),
           duration_years = COALESCE($3, duration_years),
           professional_phase = COALESCE($4, professional_phase),
           academic_system = COALESCE($5, academic_system),
           course_cd = COALESCE($6, course_cd),
           course_type = COALESCE($7, course_type),
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [dto.name, dto.degreeLevel, dto.durationYears, dto.professionalPhase, academicSystem, dto.courseCd, dto.courseType, dto.isActive ?? dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Course not found');
    const collegeId = await this.getCollegeIdBySlug(slug);
    return { ...rows[0], college_id: collegeId, college_slug: slug };
  }

  async deleteCourse(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM courses WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Course deleted successfully' };
  }

  // ─── 3. BATCHES ────────────────────────────────────────────────────────────
  async listBatches(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT *, course_cd AS course_code FROM batches ORDER BY year DESC, code ASC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createBatch(dto: CreateBatchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO batches (code, year, course_cd, department_id, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code, dto.year, dto.courseCd, dto.departmentId || null, dto.startDate || null, dto.endDate || null],
    );
    return rows[0];
  }

  async updateBatch(id: string, dto: UpdateBatchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE batches
       SET code = COALESCE($1, code),
           year = COALESCE($2, year),
           course_cd = COALESCE($3, course_cd),
           department_id = COALESCE($4, department_id),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [dto.code, dto.year, dto.courseCd, dto.departmentId, dto.startDate, dto.endDate, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Batch not found');
    return rows[0];
  }

  async deleteBatch(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const tablesToNullify = ['students', 'groups_master', 'attendance_sessions', 'timetable_slots'];
    for (const table of tablesToNullify) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET batch_id = NULL WHERE batch_id = $1`,
          [id],
        );
      } catch (e) {}
    }
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM batches WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Batch deleted successfully' };
  }

  // ─── 4. BRANCHES / DEPARTMENTS ─────────────────────────────────────────────
  async syncExternalBranches(tenantSlugOrCode?: string, targetCourseCd?: string): Promise<any[]> {
    this.logger.log(`Starting syncExternalBranches from SRMS GetBranch API... target: ${tenantSlugOrCode || 'all'}, course: ${targetCourseCd || 'all'}`);
    const syncedBranches: any[] = [];

    // 1. Get colleges to process
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
      await this.syncExternalColleges();
      collegeRows = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`);
    }

    for (const col of collegeRows) {
      const cd = String(col.code || '').trim();
      const slug = col.slug;
      const isIms = (cd === '11' || slug === 'srms-ims' || col.name?.includes('IMS'));
      const schema = `tenant_${slug}`;

      await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
      await this.ds.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});

      // Ensure departments table exists with all required columns
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".departments (
          id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code         VARCHAR(50) NOT NULL,
          name         VARCHAR(200) NOT NULL,
          type         VARCHAR(50) DEFAULT 'General',
          branch_cd    VARCHAR(50),
          course_cd    VARCHAR(50),
          course_name  VARCHAR(200),
          colg_cd      VARCHAR(50),
          hod_user_id  UUID,
          is_active    BOOLEAN     DEFAULT true,
          created_at   TIMESTAMPTZ DEFAULT NOW()
        );
      `).catch(() => {});

      await this.ds.query(`
        ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
        ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
      `).catch(() => {});

      // 2. Fetch courses for this college
      let courseCds: Array<{ course_cd: string; course_name: string }> = [];
      if (targetCourseCd) {
        courseCds = [{ course_cd: String(targetCourseCd).trim(), course_name: '' }];
      } else {
        // Query from DB courses or GetCourse API
        const dbCourses = await this.ds.query(
          `SELECT course_cd, name FROM "${schema}".courses WHERE course_cd IS NOT NULL ORDER BY course_cd ASC`,
        ).catch(() => []);

        if (dbCourses.length > 0) {
          courseCds = dbCourses.map((c: any) => ({ course_cd: String(c.course_cd), course_name: c.name }));
        } else if (cd) {
          const apiCourses = await this.fetchLiveCourses(cd).catch(() => []);
          courseCds = apiCourses.map((c: any) => ({ course_cd: String(c.course_cd), course_name: c.course_name }));
        }
      }

      if (courseCds.length === 0 && cd) {
        courseCds = [{ course_cd: '1', course_name: 'Default Course' }];
      }

      // 3. For each course, fetch branches from GetBranch API
      for (const crs of courseCds) {
        if (!crs.course_cd) continue;
        let extBranches: any[] = [];
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colgcd: cd, coursecd: crs.course_cd }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              extBranches = data;
            }
          }
        } catch (err: any) {
          this.logger.warn(`Failed to fetch GetBranch for colg ${cd}, course ${crs.course_cd}: ${err?.message}`);
        }

        // 4. Upsert branches into departments table
        for (const ext of extBranches) {
          try {
            const rawBranchName = String(ext.branch_name || '').trim();
            const branchCd = String(ext.branch_cd || '').trim();
            const courseCd = String(ext.course_cd || crs.course_cd || '').trim();
            const courseName = String(ext.course_name || crs.course_name || '').trim();
            const isActive = String(ext.active_flg) === '1' || ext.BRANCHSTS === 'ACTIVE';

            // Clean display name
            let displayName = rawBranchName;
            if (!displayName || displayName === '-') {
              displayName = courseName ? `${courseName} Department` : `Branch ${branchCd}`;
            }

            // Generate clean unique code
            const cleanAbbr = rawBranchName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || `BR${branchCd}`;
            const uniqueCode = `${cleanAbbr}-C${courseCd}-${cd}`;

            // Infer department/branch type
            let deptType = 'General';
            if (isIms) {
              deptType = displayName.toLowerCase().includes('anat') || displayName.toLowerCase().includes('physio')
                ? 'Pre-Clinical'
                : displayName.toLowerCase().includes('path') || displayName.toLowerCase().includes('pharm')
                ? 'Para-Clinical'
                : 'Clinical';
            } else if (courseName.toUpperCase().includes('TECH') || courseName.toUpperCase().includes('ENG') || cleanAbbr.includes('CSE') || cleanAbbr.includes('IT') || cleanAbbr.includes('ME') || cleanAbbr.includes('ECE')) {
              deptType = 'Engineering';
            } else if (courseName.toUpperCase().includes('PHARM')) {
              deptType = 'Pharmacy';
            } else if (courseName.toUpperCase().includes('MBA') || courseName.toUpperCase().includes('BBA')) {
              deptType = 'Management';
            } else if (courseName.toUpperCase().includes('LAW') || courseName.toUpperCase().includes('LL')) {
              deptType = 'Law';
            }

            const existing = await this.ds.query(
              `SELECT id FROM "${schema}".departments
               WHERE (branch_cd = $1 AND course_cd = $2)
                  OR code = $3
                  OR (name = $4 AND course_cd = $2)
               LIMIT 1`,
              [branchCd, courseCd, uniqueCode, displayName],
            ).catch(() => []);

            if (existing && existing.length > 0) {
              const updated = await this.ds.query(
                `UPDATE "${schema}".departments
                 SET name = $1,
                     code = $2,
                     type = $3,
                     branch_cd = COALESCE($4, branch_cd),
                     course_cd = COALESCE($5, course_cd),
                     course_name = COALESCE($6, course_name),
                     colg_cd = COALESCE($7, colg_cd),
                     is_active = $8
                 WHERE id = $9
                 RETURNING *`,
                [displayName, uniqueCode, deptType, branchCd, courseCd, courseName, cd, isActive, existing[0].id],
              );
              const row = (updated && updated[0]) ? (updated[0]['0'] || (Array.isArray(updated[0]) ? updated[0][0] : updated[0])) : {};
              syncedBranches.push({ ...row, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug });
            } else {
              const inserted = await this.ds.query(
                `INSERT INTO "${schema}".departments (code, name, type, branch_cd, course_cd, course_name, colg_cd, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [uniqueCode, displayName, deptType, branchCd, courseCd, courseName, cd, isActive],
              );
              const row = (inserted && inserted[0]) ? (inserted[0]['0'] || (Array.isArray(inserted[0]) ? inserted[0][0] : inserted[0])) : {};
              syncedBranches.push({ ...row, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug });
            }
          } catch (upsertErr: any) {
            this.logger.warn(`Failed to upsert branch for ${cd} course ${crs.course_cd}: ${upsertErr?.message}`);
          }
        }
      }
    }

    this.logger.log(`Branch sync complete. Total branches synced to PostgreSQL: ${syncedBranches.length}`);
    return syncedBranches;
  }

  async listBranches(tenantSlug?: string): Promise<any[]> {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || await this.getCollegeIdBySlug(slug);
      const collegeName = targetCollege?.name || '';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        await this.ds.query(`
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT * FROM departments ORDER BY code ASC, name ASC`,
        ).catch(() => []);

        if (rows.length === 0) {
          await this.syncExternalBranches(slug);
          const fresh = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT * FROM departments ORDER BY code ASC, name ASC`,
          ).catch(() => []);
          return fresh.map(r => ({
            ...r,
            college_id: collegeId,
            college_name: collegeName,
            college_code: collegeCode,
            college_slug: slug,
          }));
        }

        return rows.map(r => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to list branches for ${slug}: ${err?.message}`);
        return [];
      }
    }

    // List branches across all colleges
    const allBranches: any[] = [];
    for (const col of colleges) {
      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT * FROM departments ORDER BY code ASC, name ASC`,
        ).catch(() => []);

        allBranches.push(
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
    return allBranches;
  }

  async createBranch(dto: CreateBranchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO departments (code, name, type, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.type],
    );
    return rows[0];
  }

  async updateBranch(id: string, dto: UpdateBranchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [dto.code ? dto.code.toUpperCase() : null, dto.name, dto.type, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Branch not found');
    return rows[0];
  }

  async deleteBranch(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    // Safely clear foreign key references in child tables before deleting department/branch
    const tablesToNullify = ['students', 'faculty', 'batches', 'subjects', 'groups_master', 'timetable_slots'];
    for (const table of tablesToNullify) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET department_id = NULL WHERE department_id = $1`,
          [id],
        );
      } catch (e) {
        // Silently skip if table or column doesn't exist
      }
    }

    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM departments WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Branch deleted successfully' };
  }

  // ─── 5. ACADEMIC SESSIONS ──────────────────────────────────────────────────
  async listSessions(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM academic_sessions ORDER BY start_date DESC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createSession(dto: CreateSessionDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);

    // If this session is marked as current, unset any previous current session first
    if (dto.isCurrent) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE academic_sessions SET is_current = false WHERE is_current = true`,
      );
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO academic_sessions (name, start_date, end_date, is_current, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [dto.name, dto.startDate, dto.endDate, dto.isCurrent ?? false],
    );
    return rows[0];
  }

  async updateSession(id: string, dto: UpdateSessionDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE academic_sessions
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           is_current = COALESCE($4, is_current),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.startDate, dto.endDate, dto.isCurrent, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Academic Session not found');
    return rows[0];
  }

  async deleteSession(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM academic_sessions WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Academic session deleted successfully' };
  }

  // ─── 6. PROFESSIONAL PHASES ───────────────────────────────────────────────
  async listProfessionals(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id, name, phase_order, course_cd, academic_system, is_active, created_at
       FROM professional_phases
       ORDER BY phase_order ASC, created_at ASC`,
    );
  }

  async createProfessional(dto: CreateProfessionalDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO professional_phases (name, phase_order, course_cd, academic_system, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [dto.name, dto.phaseOrder || 1, dto.courseCd || 'MBBS', dto.academicSystem || 'professional'],
    );
    return rows[0];
  }

  async updateProfessional(id: string, dto: UpdateProfessionalDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE professional_phases
       SET name = COALESCE($1, name),
           phase_order = COALESCE($2, phase_order),
           course_cd = COALESCE($3, course_cd),
           academic_system = COALESCE($4, academic_system),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.phaseOrder, dto.courseCd, dto.academicSystem, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Professional phase not found');
    return rows[0];
  }

  async deleteProfessional(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM professional_phases WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Professional phase deleted successfully' };
  }

  // ─── 8. GROUPS MASTER (BATCH SUB-GROUPS: A, B, C, D) ─────────────────────
  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async listGroups(tenantSlug?: string, batchId?: string, departmentId?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const params: any[] = [];
    let sql = `
      SELECT g.*, 
             b.code AS batch_code, b.year AS batch_year,
             d.name AS department_name, d.code AS department_code
      FROM groups_master g
      LEFT JOIN batches b ON b.id = g.batch_id
      LEFT JOIN departments d ON d.id = g.department_id
      WHERE 1=1
    `;
    if (batchId && this.isUUID(batchId)) {
      params.push(batchId);
      sql += ` AND g.batch_id = $${params.length}`;
    }
    if (departmentId && this.isUUID(departmentId)) {
      params.push(departmentId);
      sql += ` AND g.department_id = $${params.length}`;
    }
    sql += ` ORDER BY g.code ASC, g.name ASC`;

    const rows = await this.tenantSchemaService.queryInTenant(slug, sql, params);
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createGroup(dto: CreateGroupDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const validBatchId = this.isUUID(dto.batchId) ? dto.batchId : null;
    const validDeptId = this.isUUID(dto.departmentId) ? dto.departmentId : null;
    const validCollegeId = this.isUUID(dto.collegeId) ? dto.collegeId : null;
    const validCourseId = this.isUUID(dto.courseId) ? dto.courseId : null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO groups_master (code, name, college_id, course_id, batch_id, department_id, capacity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, validCollegeId, validCourseId, validBatchId, validDeptId, dto.capacity || 50],
    );
    return rows[0];
  }

  async updateGroup(id: string, dto: UpdateGroupDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const validBatchId = dto.batchId !== undefined ? (this.isUUID(dto.batchId) ? dto.batchId : null) : undefined;
    const validDeptId = dto.departmentId !== undefined ? (this.isUUID(dto.departmentId) ? dto.departmentId : null) : undefined;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE groups_master
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           batch_id = COALESCE($3, batch_id),
           department_id = COALESCE($4, department_id),
           capacity = COALESCE($5, capacity),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [dto.code ? dto.code.toUpperCase() : undefined, dto.name, validBatchId, validDeptId, dto.capacity, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Group not found');
    return rows[0];
  }

  async deleteGroup(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM groups_master WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Group deleted successfully' };
  }
}

