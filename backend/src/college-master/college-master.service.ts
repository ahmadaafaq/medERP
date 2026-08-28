import {
  Injectable, NotFoundException, BadRequestException, Logger, OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as https from 'https';
import * as bcrypt from 'bcrypt';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateCollegeDto, UpdateCollegeDto,
  CreateCourseDto, UpdateCourseDto,
  CreateBatchDto, UpdateBatchDto,
  CreateBranchDto, UpdateBranchDto,
  CreateSessionDto, UpdateSessionDto,
  CreateProfessionalDto, UpdateProfessionalDto,
  CreateGroupDto, UpdateGroupDto,
  CreateResidencyDto, UpdateResidencyDto,
} from './dto/college-master.dto';
import { UserRole } from '../common/enums/role.enum';

export const SRMS_FIRM_LOCATIONS = [
  { locid: '1', name: 'SRMS IMS, BAREILLY', code: '1', slug: 'srms-ims' },
  { locid: '2', name: 'SRMS FIMC, LUCKNOW', code: '2', slug: 'srms-fimc' },
  { locid: '3', name: 'SRMS CET, UNNAO', code: '3', slug: 'srms-cet-unnao' },
  { locid: '4', name: 'SRMS IBS, LUCKNOW', code: '4', slug: 'srms-ibs-lucknow' },
  { locid: '5', name: 'SRMS LRT, UNNAO', code: '5', slug: 'srms-lrt-unnao' },
  { locid: '6', name: 'SRMS UNNAO HOSPITAL', code: '6', slug: 'srms-unnao-hospital' },
  { locid: '7', name: 'SRMS CET, BAREILLY', code: '1', slug: 'srms-cet-bareilly' },
  { locid: '8', name: 'SRMS CETR, BAREILLY', code: '2', slug: 'srms-cetr-bareilly' },
  { locid: '9', name: 'SRMS TRUST, BAREILLY', code: '9', slug: 'srms-trust-bareilly' },
  { locid: '10', name: 'UTOPIAN TECHNOLOGIES LTD.', code: '10', slug: 'utopian-technologies' },
  { locid: '11', name: 'SRMS STEP2LIFE', code: '11', slug: 'srms-step2life' },
  { locid: '12', name: 'SRMS COLLEGE OF PHARMACY', code: '12', slug: 'srms-pharmacy' },
  { locid: '14', name: 'SRMS NURSING UNNAO', code: '14', slug: 'srms-college-of-nursing-paramedical-sciences-unnao' },
  { locid: '15', name: 'SRMS COLLEGE OF LAW', code: '4', slug: 'srms-college-of-law' },
  { locid: '16', name: 'SRMS RIDDHIMA', code: '10', slug: 'srms-riddhima-bareilly' },
  { locid: '17', name: 'SRMS IAHS,BAREILLY', code: '6', slug: 'srms-iahs-bareilly' },
  { locid: '18', name: 'SRMS NURSING COLG., BLY', code: '9', slug: 'srms-nursing-college' },
  { locid: '19', name: 'SWF', code: '19', slug: 'swf' },
  { locid: '20', name: 'SRMS CRICKET ACADEMY', code: '14', slug: 'srms-cricket-academy' },
  { locid: '21', name: 'SHREE CONSTRUCTIONS', code: '21', slug: 'shree-constructions' },
  { locid: '22', name: 'SHREE CONSTRUCT-STIPEND', code: '22', slug: 'shree-construct-stipend' },
  { locid: '99', name: 'OTHERS', code: '99', slug: 'others' },
  { locid: '9999', name: '--Select--', code: '9999', slug: 'select' },
];

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

/**
 * SRMS portal (myportal.srms.ac.in) uses an expired SSL certificate.
 * srmsFetch() wraps the Node global fetch with an https.Agent that
 * bypasses certificate expiry for this specific external host only.
 */
const _srmsAgent = new https.Agent({ rejectUnauthorized: false });
async function srmsFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, ...((_srmsAgent as any) ? { dispatcher: undefined } : {}), } as any).catch(() => {
    // Fallback: use node https module directly to handle expired cert
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

function parseDotNetDate(dateStr: any): string | null {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return null;
  const str = dateStr.trim();
  if (!str || str === 'null' || str === 'undefined' || str === '01/01/1900') return null;

  // 1. Handle /Date(123456789)/
  const match = str.match(/\/Date\((\-?\d+)\)\//);
  if (match) {
    const timestamp = parseInt(match[1], 10);
    if (timestamp < 0) return null;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }

  // 2. Handle DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

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
        await this.syncExternalSessions();
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
      const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/Home/GetCollege', {
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
    const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/Home/GetCollege', {
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
    const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse', {
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
    const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch', {
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

  async fetchLiveBatches(colgcd: string, coursecd: string): Promise<any[]> {
    const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/OnlineAttend/GetBatch', {
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

  async fetchLiveSubjects(colgcd: string, coursecd: string, branchcd: string, batchcd: string, semcd: string): Promise<any[]> {
    const payload = {
      colgcd: String(colgcd || '1').trim(),
      coursecd: String(coursecd || '13').trim(),
      branchcd: String(branchcd || '1').trim(),
      batchcd: String(batchcd || '2').trim(),
      semcd: String(semcd || '3').trim(),
    };
    const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/AdminAttendance/GetAllSubjectDetail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`SRMS Portal API error (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch live employees / staff from SRMS HR API:
   * URL: https://myportal.srms.ac.in/HR/HR/GETEMPPROFILEDTL
   * Payload: { locid: "7" } (e.g. locid 7 = SRMS CET, BAREILLY)
   */
  async fetchLiveEmployees(locid: string): Promise<any[]> {
    const payload = { locid: String(locid || '7').trim() };
    const res = await srmsFetch('https://myportal.srms.ac.in/HR/HR/GETEMPPROFILEDTL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`SRMS HR Portal API error (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Helper: Convert raw ALL-CAPS or irregular text to clean Title Case with double-space trimming
   */
  private toTitleCase(str?: string | null): string {
    if (!str) return '';
    const clean = str.replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const minorWords = new Set(['and', 'or', 'of', 'in', 'at', 'the', 'for', 'to', '&']);
    return clean
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (!word) return '';
        if (/^(dr|prof|mr|ms|mrs|phd|er|adv)\.?$/i.test(word)) {
          const base = word.replace(/\./g, '');
          return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + '.';
        }
        if (index > 0 && minorWords.has(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Helper: Normalize legacy free-text designation into standard title
   */
  private normalizeDesignation(raw?: string | null): string {
    if (!raw) return 'Assistant Professor';
    const clean = raw.replace(/\s+/g, ' ').trim().toUpperCase();
    if (clean.includes('ASST') || clean.includes('ASSISTANT')) {
      return 'Assistant Professor';
    }
    if (clean.includes('ASSO') || clean.includes('ASSOCIATE')) {
      return 'Associate Professor';
    }
    if (clean.includes('HOD') || clean.includes('HEAD OF')) {
      return 'Head of Department (HOD)';
    }
    if (clean.includes('DEAN') || clean.includes('DIRECTOR') || clean.includes('PRINCIPAL')) {
      return 'Dean / Director / Principal';
    }
    if (clean === 'PROFESSOR' || clean.includes('PROF')) {
      return 'Professor';
    }
    if (clean.includes('LECTURER')) {
      return 'Lecturer';
    }
    if (clean.includes('SR. RESIDENT') || clean.includes('SENIOR RESIDENT')) {
      return 'Senior Resident';
    }
    if (clean.includes('JR. RESIDENT') || clean.includes('JUNIOR RESIDENT')) {
      return 'Junior Resident';
    }
    if (clean.includes('TUTOR') || clean.includes('DEMONSTRATOR')) {
      return 'Tutor / Demonstrator';
    }
    if (clean.includes('LAB') || clean.includes('TECH')) {
      return 'Lab Instructor / Technician';
    }
    if (clean.includes('CLERK') || clean.includes('OFFICE ASST') || clean.includes('OFFICE ASSISTANT')) {
      return 'Junior Clerk / Office Assistant';
    }
    if (clean.includes('ACCOUNTANT')) {
      return 'Accountant';
    }
    if (clean.includes('SYSTEM') || clean.includes('ADMIN') || clean.includes('IT IN-CHARGE')) {
      return 'System Administrator / IT In-charge';
    }
    return this.toTitleCase(raw);
  }

  /**
   * Helper: Normalize department name
   */
  private normalizeDepartmentName(raw?: string | null): string {
    if (!raw) return 'General';
    const clean = raw.replace(/\s+/g, ' ').trim().toUpperCase();
    if (clean.includes('COMP') || clean.includes('CSE') || clean.includes('CS & ENGG') || clean.includes('COMPUTER SCI')) {
      return 'Computer Science & Engineering';
    }
    if (clean.includes('INFO') || clean.includes('IT')) {
      return 'Information Technology';
    }
    if (clean.includes('MECH') || clean.includes('ME')) {
      return 'Mechanical Engineering';
    }
    if (clean.includes('ELECTR') && (clean.includes('COMM') || clean.includes('EC'))) {
      return 'Electronics & Communication Engineering';
    }
    if (clean.includes('ELECTR') && (clean.includes('EE') || clean.includes('EEE'))) {
      return 'Electrical & Electronics Engineering';
    }
    if (clean.includes('PHARM')) {
      return 'Pharmacy';
    }
    if (clean.includes('MBA') || clean.includes('BUSINESS')) {
      return 'Master of Business Administration (MBA)';
    }
    if (clean.includes('MCA')) {
      return 'Master of Computer Applications (MCA)';
    }
    if (clean.includes('BASIC') || clean.includes('SCIENCE')) {
      return 'Basic Science & Humanities';
    }
    if (clean.includes('CIVIL')) {
      return 'Civil Engineering';
    }
    if (clean.includes('ANAT')) {
      return 'Anatomy';
    }
    if (clean.includes('PHYSIO')) {
      return 'Physiology';
    }
    if (clean.includes('BIOCHEM')) {
      return 'Biochemistry';
    }
    if (clean.includes('PATH')) {
      return 'Pathology';
    }
    if (clean.includes('MICRO')) {
      return 'Microbiology';
    }
    if (clean.includes('PHARMACOL')) {
      return 'Pharmacology';
    }
    if (clean.includes('MEDICINE') || clean.includes('GENERAL MED')) {
      return 'General Medicine';
    }
    if (clean.includes('SURGERY') || clean.includes('GENERAL SURG')) {
      return 'General Surgery';
    }
    if (clean.includes('PEDIA') || clean.includes('PAED')) {
      return 'Pediatrics';
    }
    return this.toTitleCase(raw);
  }

  /**
   * Helper: Calculate experience string from Date of Joining
   */
  private calculateExperience(dojStr?: string | null): string {
    if (!dojStr) return '2 Years';
    const dojDate = new Date(dojStr);
    if (isNaN(dojDate.getTime())) return '2 Years';
    const diffMs = Date.now() - dojDate.getTime();
    if (diffMs < 0) return 'Less than 1 Year';
    const diffYears = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    const diffMonths = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    if (diffYears <= 0) {
      return diffMonths > 0 ? `${diffMonths} Months` : 'Less than 1 Year';
    }
    return `${diffYears} Year${diffYears > 1 ? 's' : ''}${diffMonths > 0 ? ` ${diffMonths} Mo` : ''}`;
  }

  /**
   * Helper: Resolve full photo URL from imgpath or EmpID
   */
  private resolvePhotoUrl(empId: string, rawImgPath?: string | null): string {
    if (rawImgPath && typeof rawImgPath === 'string') {
      const trimmed = rawImgPath.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      if (trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined') {
        return `https://myportal.srms.ac.in/HR/HR/${trimmed.replace(/^[\\\/]+/, '').replace(/\\/g, '/')}`;
      }
    }
    return `https://myportal.srms.ac.in/HR/HR/${empId}/${empId}.jpg`;
  }

  /**
   * Helper: Infer gender from coded fields or employee names
   */
  private inferGender(sexCd?: string | number, name?: string): string {
    if (sexCd === '2' || sexCd === 2 || String(sexCd).toUpperCase() === 'F' || String(sexCd).toUpperCase() === 'FEMALE') return 'Female';
    if (sexCd === '1' || sexCd === 1 || String(sexCd).toUpperCase() === 'M' || String(sexCd).toUpperCase() === 'MALE') return 'Male';
    if (name) {
      const n = name.toUpperCase();
      if (
        n.startsWith('MS.') || n.startsWith('MRS.') || n.includes('KUMARI') ||
        n.includes('DEVI') || n.includes('MEENAKSHI') || n.includes('PRIYA') ||
        n.includes('PREETI') || n.includes('POOJA') || n.includes('NEHA') ||
        n.includes('ANITA') || n.includes('SUNITA') || n.includes('SWATI') ||
        n.includes('SHWETA') || n.includes('RASHMI') || n.includes('DIVYA')
      ) {
        return 'Female';
      }
    }
    return 'Male';
  }

  /**
   * Synchronize employees from SRMS HR API into tenant PostgreSQL database
   * Sets default password '12345678' for all synced staff accounts.
   */
  async syncExternalEmployees(locidOrTenantSlug?: string): Promise<any[]> {
    this.logger.log(`Starting syncExternalEmployees for ${locidOrTenantSlug || 'all'} with default password '12345678'...`);

    // Precompute bcrypt hash for default password '12345678'
    const defaultPasswordHash = await bcrypt.hash('12345678', 10);

    // Resolve location mapping
    let targets: Array<{ locid: string; name: string; slug: string; code: string }> = [];

    if (locidOrTenantSlug && locidOrTenantSlug !== 'all') {
      const locIds = locidOrTenantSlug.split(',').map((s) => s.trim());
      for (const singleLoc of locIds) {
        const locMatch = SRMS_FIRM_LOCATIONS.find(
          (l) => l.locid === singleLoc || l.slug === singleLoc || l.code === singleLoc,
        );
        if (locMatch) {
          targets.push(locMatch);
        } else if (singleLoc === '7') {
          targets.push({ locid: '7', name: 'SRMS CET, BAREILLY', slug: 'srms-cet-bareilly', code: '1' });
        } else if (singleLoc === '8') {
          targets.push({ locid: '8', name: 'SRMS CETR, BAREILLY', slug: 'srms-cetr-bareilly', code: '2' });
        } else {
          targets.push({ locid: singleLoc, name: `Location ${singleLoc}`, slug: singleLoc, code: singleLoc });
        }
      }
    } else {
      targets = SRMS_FIRM_LOCATIONS.filter((l) => l.locid !== '9999');
    }

    const allSyncedEmployees: any[] = [];

    for (const target of targets) {
      const slug = target.slug;
      const schema = `tenant_${slug}`;

      await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
      await this.ds.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});

      // Ensure faculty table and all necessary columns exist in tenant schema
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".faculty (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          emp_id VARCHAR(50) UNIQUE,
          name VARCHAR(200) NOT NULL,
          email VARCHAR(200),
          phone VARCHAR(50),
          department_id VARCHAR(100),
          designation VARCHAR(100),
          qualification VARCHAR(200),
          specialization VARCHAR(200),
          experience VARCHAR(50),
          gender VARCHAR(20),
          date_of_joining DATE,
          joining_date DATE,
          date_of_birth DATE,
          date_of_leaving DATE,
          employment_status VARCHAR(50) DEFAULT 'ACTIVE',
          photo_url TEXT,
          staff_type VARCHAR(50) DEFAULT 'Faculty',
          is_active BOOLEAN DEFAULT true,
          blood_group VARCHAR(20),
          caste VARCHAR(50),
          pan_no VARCHAR(50),
          aadhaar_no VARCHAR(50),
          uan VARCHAR(50),
          bank_ac_no VARCHAR(50),
          current_basic NUMERIC(14,2),
          device_cd VARCHAR(50),
          salgrade VARCHAR(50),
          father_name VARCHAR(200),
          spouse_name VARCHAR(200),
          address TEXT,
          perm_addr TEXT,
          city VARCHAR(100),
          state VARCHAR(100),
          perm_city VARCHAR(100),
          perm_state VARCHAR(100),
          homephone VARCHAR(50),
          permanent_tel_no VARCHAR(50),
          highest_education VARCHAR(200),
          category VARCHAR(100),
          payroll_category VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `).catch(() => {});

      // Apply migrations for any existing columns
      const schemaAlterQueries = [
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS email VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS name VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS designation VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS qualification VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS specialization VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS experience VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS photo_url TEXT;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS date_of_joining DATE;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS joining_date DATE;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS date_of_birth DATE;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS date_of_leaving DATE;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS caste VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS aadhaar_no VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS uan VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS bank_ac_no VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS current_basic NUMERIC(14,2);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS device_cd VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS salgrade VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS father_name VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS address TEXT;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS perm_addr TEXT;`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS city VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS state VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS perm_city VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS perm_state VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS homephone VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS permanent_tel_no VARCHAR(50);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS highest_education VARCHAR(200);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS category VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS payroll_category VARCHAR(100);`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'ACTIVE';`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS staff_type VARCHAR(50) DEFAULT 'Faculty';`,
        `ALTER TABLE "${schema}".faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
      ];
      for (const q of schemaAlterQueries) {
        await this.ds.query(q).catch(() => {});
      }

      let liveEmployees: any[] = [];
      try {
        liveEmployees = await this.fetchLiveEmployees(target.locid);
      } catch (err: any) {
        this.logger.warn(`Could not fetch live employees for locid ${target.locid} (${target.name}): ${err.message}`);
      }

      for (const emp of liveEmployees) {
        const empId = String(emp.EmpID || emp.emp_id || '').trim();
        const rawEmpName = String(emp.EmpName || emp.name || '').trim();
        if (!empId || !rawEmpName) continue;

        // 1. Transform Name: Double space removal + Title Casing
        const empName = this.toTitleCase(rawEmpName);

        // 2. Email fallback
        const email = emp.email && String(emp.email).trim()
          ? String(emp.email).trim().toLowerCase()
          : `${empId.toLowerCase()}@srms.ac.in`;

        // 3. Contact & Phone
        const phone = emp.homephone || emp.PermanentTelNo || null;

        // 4. Department & Designation Normalization
        const departmentRaw = emp.Department ? String(emp.Department).trim() : 'General';
        const department = this.normalizeDepartmentName(departmentRaw);
        const designation = this.normalizeDesignation(emp.Designation);

        // 5. Qualifications & Education
        const qualification = emp.HIGHEST_EDUCATION ? String(emp.HIGHEST_EDUCATION).trim().toUpperCase() : null;

        // 6. Demographics
        const bloodGroup = emp.bloodgroup ? String(emp.bloodgroup).trim().toUpperCase() : null;
        const caste = emp.CASTE ? String(emp.CASTE).trim().toUpperCase() : null;
        const panNo = emp.PANNo ? String(emp.PANNo).trim() : null;
        const aadhaarNo = emp.aadharno ? String(emp.aadharno).trim() : null;
        const uan = emp.UAN ? String(emp.UAN).trim() : null;
        const bankAcNo = emp.BankAcNo ? String(emp.BankAcNo).trim() : null;
        const basicPay = emp.EmpCurrBasic ? parseFloat(emp.EmpCurrBasic) : null;
        const deviceCd = emp.DEVICECD ? String(emp.DEVICECD).trim() : null;
        const salgrade = emp.salgrade ? String(emp.salgrade).trim() : null;
        const fatherName = emp.FatherNm ? this.toTitleCase(emp.FatherNm) : null;
        const spouseName = emp.SpouseNm ? this.toTitleCase(emp.SpouseNm) : null;
        const address = emp.Addr1 ? emp.Addr1.replace(/\s+/g, ' ').trim() : (emp.perm_addr ? emp.perm_addr.replace(/\s+/g, ' ').trim() : null);
        const permAddr = emp.perm_addr ? emp.perm_addr.replace(/\s+/g, ' ').trim() : null;
        const city = emp.city ? this.toTitleCase(emp.city) : 'Bareilly';
        const state = emp.state ? this.toTitleCase(emp.state) : 'Uttar Pradesh';
        const permCity = emp.perm_city ? this.toTitleCase(emp.perm_city) : null;
        const permState = emp.perm_state ? this.toTitleCase(emp.perm_state) : null;
        const homephone = emp.homephone || null;
        const permanentTelNo = emp.PermanentTelNo || null;
        const category = emp.category || null;
        const payrollCategory = emp.payroll_category || null;

        // 7. Staff Type & Status
        const majCat = (emp.category || emp.payroll_category || emp.maj_cat || 'TEACHING').toUpperCase();
        let staffType = 'Faculty';
        let userRole = 'FACULTY';
        if (majCat.includes('TEACH')) {
          staffType = 'Faculty';
          userRole = designation.includes('HOD') ? 'HOD' : 'FACULTY';
        } else if (majCat.includes('ADMIN')) {
          staffType = 'Admin';
          userRole = 'COLLEGE_ADMIN';
        } else {
          staffType = 'Staff';
          userRole = 'CLERK';
        }

        const status = (emp.EmpStsCd || 'ACTIVE').toUpperCase();
        const isActive = status === 'ACTIVE';

        // 8. Profile Photo Resolution
        const photoUrl = this.resolvePhotoUrl(empId, emp.imgpath);

        // 9. Dates & Experience
        const dob = parseDotNetDate(emp.dob);
        const doj = parseDotNetDate(emp.DOJ);
        const dol = parseDotNetDate(emp.dol);
        const experience = this.calculateExperience(doj);
        const gender = this.inferGender(emp.SexCd, rawEmpName);

        // 10. Resolve / Create Department
        let deptId: string | null = null;
        const deptRows = await this.ds.query(
          `SELECT id FROM "${schema}".departments WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1`,
          [department],
        ).catch(() => []);
        if (deptRows.length > 0) {
          deptId = deptRows[0].id;
        } else {
          const deptCode = department.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase() || 'GEN';
          const newDept = await this.ds.query(
            `INSERT INTO "${schema}".departments (code, name, type, colg_cd, is_active)
             VALUES ($1, $2, 'Academic', $3, true)
             RETURNING id`,
            [deptCode, department, target.code],
          ).catch(() => []);
          if (newDept && newDept.length > 0) deptId = newDept[0].id;
        }

        // 11. Resolve / Create User Account in tenant schema & Set password '12345678'
        let userId: string | null = null;
        const userRows = await this.ds.query(
          `SELECT id FROM "${schema}".users WHERE email = $1 LIMIT 1`,
          [email],
        ).catch(() => []);
        if (userRows.length > 0) {
          userId = userRows[0].id;
          // Update password to 12345678 and refresh active status
          await this.ds.query(
            `UPDATE "${schema}".users 
             SET password_hash = $1, is_active = $2, role = COALESCE($3, role), updated_at = NOW() 
             WHERE id = $4`,
            [defaultPasswordHash, isActive, userRole, userId],
          ).catch(() => {});
        } else {
          const newUser = await this.ds.query(
            `INSERT INTO "${schema}".users (email, password_hash, role, is_active, must_change_password)
             VALUES ($1, $2, $3, $4, false)
             RETURNING id`,
            [email, defaultPasswordHash, userRole, isActive],
          ).catch(() => []);
          if (newUser && newUser.length > 0) userId = newUser[0].id;
        }

        // 12. Upsert into faculty table
        const validDeptId = this.isUUID(deptId) ? deptId : null;
        const validUserId = this.isUUID(userId) ? userId : null;

        const existingFaculty = await this.ds.query(
          `SELECT id FROM "${schema}".faculty WHERE emp_id = $1 LIMIT 1`,
          [empId],
        ).catch(() => []);

        let facultyId: string;
        if (existingFaculty.length > 0) {
          facultyId = existingFaculty[0].id;
          await this.ds.query(
            `UPDATE "${schema}".faculty
             SET name = $1,
                 email = COALESCE($2, email),
                 phone = COALESCE($3, phone),
                 department_id = COALESCE($4, department_id),
                 designation = $5,
                 qualification = COALESCE($6, qualification),
                 blood_group = COALESCE($7, blood_group),
                 caste = COALESCE($8, caste),
                 pan_no = COALESCE($9, pan_no),
                 aadhaar_no = COALESCE($10, aadhaar_no),
                 uan = COALESCE($11, uan),
                 bank_ac_no = COALESCE($12, bank_ac_no),
                 current_basic = COALESCE($13, current_basic),
                 device_cd = COALESCE($14, device_cd),
                 salgrade = COALESCE($15, salgrade),
                 father_name = COALESCE($16, father_name),
                 spouse_name = COALESCE($17, spouse_name),
                 address = COALESCE($18, address),
                 city = COALESCE($19, city),
                 state = COALESCE($20, state),
                 perm_addr = COALESCE($21, perm_addr),
                 perm_city = COALESCE($22, perm_city),
                 perm_state = COALESCE($23, perm_state),
                 homephone = COALESCE($24, homephone),
                 permanent_tel_no = COALESCE($25, permanent_tel_no),
                 highest_education = COALESCE($26, highest_education),
                 category = COALESCE($27, category),
                 payroll_category = COALESCE($28, payroll_category),
                 date_of_birth = COALESCE($29, date_of_birth),
                 date_of_joining = COALESCE($30, date_of_joining),
                 joining_date = COALESCE($30, joining_date),
                 date_of_leaving = COALESCE($31, date_of_leaving),
                 photo_url = $32,
                 staff_type = $33,
                 employment_status = $34,
                 experience = $35,
                 gender = $36,
                 is_active = $37,
                 user_id = COALESCE($38, user_id),
                 updated_at = NOW()
             WHERE id = $39`,
            [
              empName, email, phone, validDeptId, designation, qualification,
              bloodGroup, caste, panNo, aadhaarNo, uan, bankAcNo, basicPay, deviceCd,
              salgrade, fatherName, spouseName, address, city, state, permAddr,
              permCity, permState, homephone, permanentTelNo, qualification, category,
              payrollCategory, dob, doj, dol, photoUrl, staffType, status,
              experience, gender, isActive, validUserId, facultyId,
            ],
          );
        } else {
          const inserted = await this.ds.query(
            `INSERT INTO "${schema}".faculty (
               emp_id, name, email, phone, department_id, designation, qualification,
               blood_group, caste, pan_no, aadhaar_no, uan, bank_ac_no, current_basic,
               device_cd, salgrade, father_name, spouse_name, address, city, state,
               perm_addr, perm_city, perm_state, homephone, permanent_tel_no,
               highest_education, category, payroll_category, date_of_birth,
               date_of_joining, joining_date, date_of_leaving, photo_url, staff_type,
               employment_status, experience, gender, is_active, user_id
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7,
               $8, $9, $10, $11, $12, $13, $14,
               $15, $16, $17, $18, $19, $20, $21,
               $22, $23, $24, $25, $26,
               $27, $28, $29, $30,
               $31, $31, $32, $33, $34,
               $35, $36, $37, $38, $39
             ) RETURNING id`,
            [
              empId, empName, email, phone, validDeptId, designation, qualification,
              bloodGroup, caste, panNo, aadhaarNo, uan, bankAcNo, basicPay,
              deviceCd, salgrade, fatherName, spouseName, address, city, state,
              permAddr, permCity, permState, homephone, permanentTelNo,
              qualification, category, payrollCategory, dob,
              doj, dol, photoUrl, staffType,
              status, experience, gender, isActive, validUserId,
            ],
          );
          facultyId = inserted[0]?.id;
        }

        allSyncedEmployees.push({
          facultyId,
          empId,
          empName,
          email,
          designation,
          department,
          staffType,
          photoUrl,
          experience,
          gender,
          isActive,
          locid: target.locid,
          collegeName: target.name,
          tenantSlug: slug,
        });
      }
    }

    this.logger.log(`syncExternalEmployees complete. Synced ${allSyncedEmployees.length} employees/faculty across targets. Password set to '12345678'.`);
    return allSyncedEmployees;
  }

  async listColleges(user?: any): Promise<any[]> {
    await this.ds.query(`ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(50);`).catch(() => {});
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      const rows = await this.ds.query(
        `SELECT id, code, name, slug, domain, plan, primary_color, is_active, schema_provisioned, created_at
         FROM public.tenants
         WHERE LOWER(slug) = LOWER($1) OR code = $2
         LIMIT 1`,
        [user.tenantSlug, user.colgCd || '1'],
      );
      if (rows.length > 0) return rows;
    }
    const rows = await this.ds.query(
      `SELECT DISTINCT ON (code) id, code, name, slug, domain, plan, primary_color, is_active, schema_provisioned, created_at
       FROM public.tenants
       ORDER BY code, CAST(NULLIF(regexp_replace(code, '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, name ASC`,
    );
    if (rows.length === 0) {
      return this.syncExternalColleges();
    }
    return rows.sort((a: any, b: any) => (parseInt(a.code, 10) || 0) - (parseInt(b.code, 10) || 0));
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
          const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse', {
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
          const numericCode = String(ext.course_cd || `${cleanAbbr}-${cd}`);
          const meta = inferCourseMetadata(rawName, isIms);
          const isActive = String(ext.active_flg) === '1' || ext.ACTIVESTS === 'ACTIVE';

          targetCourses.push({
            code: numericCode,
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

  async listCourses(tenantSlug?: string, user?: any): Promise<any[]> {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
    const colleges = await this.listColleges(user);

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || await this.getCollegeIdBySlug(slug);
      const collegeName = targetCollege?.name || '';
      const collegeCode = targetCollege?.code || '';

      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, degree_level, duration_years, professional_phase,
                  COALESCE(academic_system, CASE WHEN '${slug}' = 'srms-ims' THEN 'professional' ELSE 'semester' END) AS academic_system,
                  course_cd, course_type, is_active, created_at
           FROM courses
           ORDER BY created_at ASC, code ASC`,
        );

        if (rows && rows.length > 0) {
          return rows.map(r => ({
            ...r,
            college_id: collegeId,
            college_name: collegeName,
            college_code: collegeCode,
            college_slug: slug,
          }));
        }

        const isSrms = SRMS_FIRM_LOCATIONS.some(l => l.slug === slug || l.locid === slug || l.code === slug);
        if (isSrms) {
          await this.syncExternalCourses(slug).catch(() => []);
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
        return [];
      } catch (err: any) {
        return [];
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
    const rawDuration = dto.durationYears ?? (dto as any).duration_years;
    const duration = rawDuration !== undefined && rawDuration !== null && !isNaN(Number(rawDuration))
      ? Number(rawDuration)
      : (isIms ? 5.5 : 4.0);
    const phase = dto.professionalPhase || (isIms ? '1st Professional (Phase I)' : 'Semester 1 (1st Year)');

    await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
    await this.ds.query(`
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS academic_system VARCHAR(50) DEFAULT '${academicSystem}';
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(50);
      ALTER TABLE "${schema}".courses ALTER COLUMN duration_years TYPE NUMERIC(4,1);
    `).catch(() => {});

    const courseCdVal = dto.courseCd || (dto as any).course_cd || dto.code || '1';
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO courses (code, name, degree_level, duration_years, professional_phase, academic_system, course_cd, course_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [courseCdVal, dto.name, dto.degreeLevel || 'UG', duration, phase, academicSystem, courseCdVal, dto.courseType || null],
    );
    const collegeId = await this.getCollegeIdBySlug(slug);
    return { ...rows[0], college_id: collegeId, college_slug: slug };
  }

  async updateCourse(id: string, dto: UpdateCourseDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.collegeId);
    const schema = `tenant_${slug}`;
    const isIms = (slug === 'srms-ims');
    const academicSystem = dto.academicSystem || dto.academic_system;
    const courseCdVal = dto.courseCd || (dto as any).course_cd || dto.code;
    const rawDuration = dto.durationYears ?? (dto as any).duration_years;
    const durationVal = rawDuration !== undefined && rawDuration !== null && !isNaN(Number(rawDuration))
      ? Number(rawDuration)
      : null;

    await this.ds.query(`
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS academic_system VARCHAR(50);
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(50);
      ALTER TABLE "${schema}".courses ALTER COLUMN duration_years TYPE NUMERIC(4,1);
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
           is_active = COALESCE($8, is_active),
           code = COALESCE($9, code)
       WHERE id = $10
       RETURNING *`,
      [dto.name, dto.degreeLevel, durationVal, dto.professionalPhase, academicSystem, courseCdVal, dto.courseType, dto.isActive ?? dto.is_active, courseCdVal, id],
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
  async syncExternalBatches(tenantSlugOrCode?: string, targetCourseCd?: string): Promise<any[]> {
    this.logger.log(`Starting syncExternalBatches from SRMS GetBatch API... target: ${tenantSlugOrCode || 'all'}, course: ${targetCourseCd || 'all'}`);
    const syncedBatches: any[] = [];

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
      const schema = `tenant_${slug}`;

      await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
      await this.ds.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});

      // Ensure batches table exists with all required columns
      await this.ds.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".batches (
          id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code           VARCHAR(50) NOT NULL,
          name           VARCHAR(200),
          year           INT         NOT NULL,
          batch_cd       VARCHAR(50),
          course_cd      VARCHAR(50),
          course_name    VARCHAR(200),
          colg_cd        VARCHAR(50),
          department_id  UUID,
          start_date     DATE,
          end_date       DATE,
          curr_bat_cd    VARCHAR(50),
          is_active      BOOLEAN     DEFAULT true,
          created_at     TIMESTAMPTZ DEFAULT NOW()
        );
      `).catch(() => {});

      await this.ds.query(`
        ALTER TABLE "${schema}".batches ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
        ALTER TABLE "${schema}".batches ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".batches ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
        ALTER TABLE "${schema}".batches ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        ALTER TABLE "${schema}".batches ADD COLUMN IF NOT EXISTS curr_bat_cd VARCHAR(50);
        ALTER TABLE "${schema}".batches ADD COLUMN IF NOT EXISTS name VARCHAR(200);
      `).catch(() => {});

      // 2. Fetch courses for this college
      let courseCds: Array<{ course_cd: string; course_name: string }> = [];
      if (targetCourseCd) {
        courseCds = [{ course_cd: String(targetCourseCd).trim(), course_name: '' }];
      } else {
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

      // 3. For each course, fetch batches from GetBatch API
      for (const crs of courseCds) {
        if (!crs.course_cd) continue;
        let extBatches: any[] = [];
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/OnlineAttend/GetBatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colgcd: cd, coursecd: crs.course_cd }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              extBatches = data;
            }
          }
        } catch (err: any) {
          this.logger.warn(`Failed to fetch GetBatch for colg ${cd}, course ${crs.course_cd}: ${err?.message}`);
        }

        // 4. Upsert batches into batches table
        for (const ext of extBatches) {
          try {
            const rawBatchName = String(ext.batch_name || '').trim();
            const batchCd = String(ext.batch_cd || '').trim();
            const courseCd = String(ext.course_cd || crs.course_cd || '').trim();
            const courseName = String(ext.course_name || crs.course_name || '').trim();
            const yearNum = parseInt(rawBatchName, 10) || new Date().getFullYear();
            const startDate = parseDotNetDate(ext.startdt);
            const endDate = parseDotNetDate(ext.enddt);
            const currBatCd = ext.curr_bat_Cd ? String(ext.curr_bat_Cd) : null;
            const isActive = String(ext.active_flg) === '1';

            // Numeric code matching SRMS API batch_cd
            const numericCode = String(ext.batch_cd || ext.curr_bat_Cd || yearNum).trim();
            const displayName = rawBatchName ? `Batch ${rawBatchName}` : `Batch ${numericCode}`;

            const existing = await this.ds.query(
              `SELECT id FROM "${schema}".batches
               WHERE (batch_cd = $1 AND course_cd = $2)
                  OR (code = $3 AND course_cd = $2)
               LIMIT 1`,
              [batchCd, courseCd, numericCode],
            ).catch(() => []);

            if (existing && existing.length > 0) {
              const updated = await this.ds.query(
                `UPDATE "${schema}".batches
                 SET code = $1,
                     name = $2,
                     year = $3,
                     batch_cd = COALESCE($4, batch_cd),
                     course_cd = COALESCE($5, course_cd),
                     course_name = COALESCE($6, course_name),
                     colg_cd = COALESCE($7, colg_cd),
                     start_date = COALESCE($8, start_date),
                     end_date = COALESCE($9, end_date),
                     curr_bat_cd = COALESCE($10, curr_bat_cd),
                     is_active = $11
                 WHERE id = $12
                 RETURNING *`,
                [numericCode, displayName, yearNum, batchCd, courseCd, courseName, cd, startDate, endDate, currBatCd, isActive, existing[0].id],
              );
              const row = (updated && updated[0]) ? (updated[0]['0'] || (Array.isArray(updated[0]) ? updated[0][0] : updated[0])) : {};
              syncedBatches.push({ ...row, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug, course_code: courseCd });
            } else {
              const inserted = await this.ds.query(
                `INSERT INTO "${schema}".batches (code, name, year, batch_cd, course_cd, course_name, colg_cd, start_date, end_date, curr_bat_cd, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [numericCode, displayName, yearNum, batchCd, courseCd, courseName, cd, startDate, endDate, currBatCd, isActive],
              );
              const row = (inserted && inserted[0]) ? (inserted[0]['0'] || (Array.isArray(inserted[0]) ? inserted[0][0] : inserted[0])) : {};
              syncedBatches.push({ ...row, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug, course_code: courseCd });
            }
          } catch (upsertErr: any) {
            this.logger.warn(`Failed to upsert batch for ${cd} course ${crs.course_cd}: ${upsertErr?.message}`);
          }
        }
      }
    }

    this.logger.log(`Batch sync complete. Total batches synced to PostgreSQL: ${syncedBatches.length}`);
    return syncedBatches;
  }

  async listBatches(tenantSlug?: string, courseCd?: string, user?: any): Promise<any[]> {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
    const colleges = await this.listColleges(user);

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || await this.getCollegeIdBySlug(slug);
      const collegeName = targetCollege?.name || '';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
        let querySql = `
          SELECT b.*, COALESCE(c.name, b.course_name, 'Course ' || b.course_cd) AS course_name,
                 b.course_cd AS course_code
          FROM batches b
          LEFT JOIN courses c ON c.course_cd = b.course_cd OR c.code = b.course_cd
        `;
        const queryParams: any[] = [];
        if (courseCd && courseCd !== 'all') {
          queryParams.push(courseCd);
          querySql += ` WHERE (b.course_cd = $1 OR c.code = $1 OR c.course_cd = $1 OR b.course_name ILIKE $1)`;
        }
        querySql += ` ORDER BY b.year DESC, b.code ASC`;

        let rows = await this.tenantSchemaService.queryInTenant(
          slug,
          querySql,
          queryParams,
        ).catch(() => []);

        if (rows.length === 0 && (!courseCd || courseCd === 'all')) {
          await this.syncExternalBatches(slug);
          rows = await this.tenantSchemaService.queryInTenant(
            slug,
            querySql,
            queryParams,
          ).catch(() => []);
        }

        return rows.map((r: any) => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to list batches for ${slug}: ${err?.message}`);
        return [];
      }
    }

    // List batches across all colleges
    const allBatches: any[] = [];
    for (const col of colleges) {
      try {
        let querySql = `
          SELECT b.*, COALESCE(c.name, b.course_name, 'Course ' || b.course_cd) AS course_name,
                 b.course_cd AS course_code
          FROM batches b
          LEFT JOIN courses c ON c.course_cd = b.course_cd OR c.code = b.course_cd
        `;
        const queryParams: any[] = [];
        if (courseCd && courseCd !== 'all') {
          queryParams.push(courseCd);
          querySql += ` WHERE (b.course_cd = $1 OR c.code = $1 OR c.course_cd = $1 OR b.course_name ILIKE $1)`;
        }
        querySql += ` ORDER BY b.year DESC, b.code ASC`;

        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          querySql,
          queryParams,
        ).catch(() => []);

        allBatches.push(
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
    return allBatches;
  }

  async createBatch(dto: CreateBatchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.collegeId || dto.college_id || dto.collegeSlug || tenantSlug);
    const batchCdVal = String(dto.code || dto.year || '').trim();
    const displayName = dto.name || (dto.year ? `Batch ${dto.year}` : `Batch ${batchCdVal}`);
    const finalCourseCd = dto.courseCd || dto.course_cd || dto.courseId || '1';
    const validDeptId = this.isUUID(dto.departmentId) ? dto.departmentId : null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO batches (code, batch_cd, name, year, course_cd, department_id, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [batchCdVal, batchCdVal, displayName, dto.year || 2026, finalCourseCd, validDeptId, dto.startDate || null, dto.endDate || null],
    );
    return rows[0];
  }

  async updateBatch(id: string, dto: UpdateBatchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.collegeId || tenantSlug);
    const batchCdVal = dto.code ? String(dto.code).trim() : undefined;
    const displayName = dto.year ? `Batch ${dto.year}` : undefined;
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE batches
       SET code = COALESCE($1, code),
           batch_cd = COALESCE($1, batch_cd),
           name = COALESCE($2, name),
           year = COALESCE($3, year),
           course_cd = COALESCE($4, course_cd),
           department_id = COALESCE($5, department_id),
           start_date = COALESCE($6, start_date),
           end_date = COALESCE($7, end_date),
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [batchCdVal, displayName, dto.year, dto.courseCd, dto.departmentId, dto.startDate, dto.endDate, dto.isActive, id],
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
          const res = await srmsFetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch', {
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
            const branchCd = String(ext.branch_cd || '').trim() || '1';
            const courseCd = String(ext.course_cd || crs.course_cd || '').trim();
            const courseName = String(ext.course_name || crs.course_name || '').trim();
            const isActive = String(ext.active_flg) === '1' || ext.BRANCHSTS === 'ACTIVE';

            // Clean display name
            let displayName = rawBranchName;
            if (!displayName || displayName === '-') {
              displayName = courseName ? `${courseName} Department` : `Branch ${branchCd}`;
            }

            // Numeric branch code matching SRMS API branch_cd
            const numericCode = branchCd;

            // Infer department/branch type
            let deptType = 'General';
            if (isIms) {
              deptType = displayName.toLowerCase().includes('anat') || displayName.toLowerCase().includes('physio')
                ? 'Pre-Clinical'
                : displayName.toLowerCase().includes('path') || displayName.toLowerCase().includes('pharm')
                ? 'Para-Clinical'
                : 'Clinical';
            } else if (courseName.toUpperCase().includes('TECH') || courseName.toUpperCase().includes('ENG') || displayName.includes('CSE') || displayName.includes('IT') || displayName.includes('ME') || displayName.includes('ECE')) {
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
                  OR (code = $3 AND course_cd = $2)
                  OR (name = $4 AND course_cd = $2)
               LIMIT 1`,
              [branchCd, courseCd, numericCode, displayName],
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
                [displayName, numericCode, deptType, branchCd, courseCd, courseName, cd, isActive, existing[0].id],
              );
              const row = (updated && updated[0]) ? (updated[0]['0'] || (Array.isArray(updated[0]) ? updated[0][0] : updated[0])) : {};
              syncedBranches.push({ ...row, college_id: col.id, college_name: col.name, college_code: col.code, college_slug: slug });
            } else {
              const inserted = await this.ds.query(
                `INSERT INTO "${schema}".departments (code, name, type, branch_cd, course_cd, course_name, colg_cd, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [numericCode, displayName, deptType, branchCd, courseCd, courseName, cd, isActive],
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

  async listBranches(tenantSlug?: string, courseCd?: string, user?: any): Promise<any[]> {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
    const colleges = await this.listColleges(user);

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || await this.getCollegeIdBySlug(slug);
      const collegeName = targetCollege?.name || '';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
        let rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT d.*,
                  COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                  d.course_cd AS course_code,
                  COALESCE(d.branch_cd, d.code) AS branch_cd
           FROM departments d
           LEFT JOIN courses c ON c.course_cd = d.course_cd OR c.code = d.course_cd
           ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
        ).catch(() => []);

        if (rows.length === 0) {
          await this.syncExternalBranches(slug);
          rows = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT d.*,
                    COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                    d.course_cd AS course_code,
                    COALESCE(d.branch_cd, d.code) AS branch_cd
             FROM departments d
             LEFT JOIN courses c ON c.course_cd = d.course_cd OR c.code = d.course_cd
             ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
          ).catch(() => []);
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
          `SELECT d.*,
                  COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                  d.course_cd AS course_code,
                  COALESCE(d.branch_cd, d.code) AS branch_cd
           FROM departments d
           LEFT JOIN courses c ON c.course_cd = d.course_cd OR c.code = d.course_cd
           ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
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
    const slug = await this.resolveTenantSlug(dto.collegeId || tenantSlug);
    const branchCdVal = String(dto.branchCd || dto.code || '').trim() || '1';
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO departments (code, branch_cd, name, type, course_cd, course_name, colg_cd, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [branchCdVal, branchCdVal, dto.name, dto.type || 'General', dto.courseCd || null, dto.courseName || null, dto.colgCd || null],
    );
    return rows[0];
  }

  async updateBranch(id: string, dto: UpdateBranchDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.collegeId || tenantSlug);
    const branchCdVal = dto.code || dto.branchCd ? String(dto.code || dto.branchCd).trim() : undefined;
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           branch_cd = COALESCE($1, branch_cd),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           course_cd = COALESCE($4, course_cd),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [branchCdVal, dto.name, dto.type, dto.courseCd, dto.isActive, id],
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
  async listSessions(tenantSlug?: string, user?: any) {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
    const slug = await this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM academic_sessions ORDER BY start_date DESC`,
    );
    if (rows.length === 0) {
      await this.syncExternalSessions(slug);
      const synced = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM academic_sessions ORDER BY start_date DESC`,
      );
      return synced.map(r => ({
        ...r,
        session_cd: r.session_cd || r.code || '',
        session_name: r.name,
        code: r.session_cd || r.code || r.name,
        colg_cd: r.colg_cd || '1',
        college_id: collegeId,
      }));
    }
    return rows.map(r => ({
      ...r,
      session_cd: r.session_cd || r.code || '',
      session_name: r.name,
      code: r.session_cd || r.code || r.name,
      colg_cd: r.colg_cd || '1',
      college_id: collegeId,
    }));
  }

  async syncExternalSessions(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const officialSessions = [
      { colg_cd: '1', session_cd: '16', session_name: '2026-2027', active_flg: '1', current_flg: '1', start_date: '2026-07-01', end_date: '2027-06-30' },
      { colg_cd: '1', session_cd: '15', session_name: '2025-2026', active_flg: '1', current_flg: '1', start_date: '2025-07-01', end_date: '2026-06-30' },
      { colg_cd: '1', session_cd: '14', session_name: '2024-2025', active_flg: '1', current_flg: '1', start_date: '2024-07-01', end_date: '2025-06-30' },
      { colg_cd: '1', session_cd: '13', session_name: '2023-2024', active_flg: '1', current_flg: '0', start_date: '2023-07-01', end_date: '2024-06-30' },
      { colg_cd: '1', session_cd: '12', session_name: '2022-2023', active_flg: '1', current_flg: '0', start_date: '2022-07-01', end_date: '2023-06-30' },
      { colg_cd: '1', session_cd: '11', session_name: '2021-2022', active_flg: '1', current_flg: '0', start_date: '2021-07-01', end_date: '2022-06-30' },
      { colg_cd: '1', session_cd: '10', session_name: '2020-2021', active_flg: '1', current_flg: '0', start_date: '2020-07-01', end_date: '2021-06-30' },
    ];

    for (const sess of officialSessions) {
      const isCurrent = sess.current_flg === '1';
      const isActive = sess.active_flg === '1';
      // Upsert by session_cd or name in tenant schema
      const existing = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM academic_sessions WHERE session_cd = $1 OR name = $2 OR name LIKE $3 LIMIT 1`,
        [sess.session_cd, sess.session_name, `%${sess.session_name}%`],
      );

      if (existing.length > 0) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE academic_sessions 
           SET name = $1, session_cd = $2, code = $2, colg_cd = $3, start_date = $4, end_date = $5, is_current = $6, is_active = $7
           WHERE id = $8`,
          [sess.session_name, sess.session_cd, sess.colg_cd, sess.start_date, sess.end_date, isCurrent, isActive, existing[0].id],
        );
      } else {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO academic_sessions (name, code, session_cd, colg_cd, start_date, end_date, is_current, is_active)
           VALUES ($1, $2, $2, $3, $4, $5, $6, $7)`,
          [sess.session_name, sess.session_cd, sess.colg_cd, sess.start_date, sess.end_date, isCurrent, isActive],
        );
      }
    }

    return this.listSessions(slug);
  }

  async createSession(dto: CreateSessionDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const sessionCd = dto.session_cd || dto.code || '';
    const colgCd = dto.colg_cd || '1';

    // If this session is marked as current, unset any previous current session first
    if (dto.isCurrent) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE academic_sessions SET is_current = false WHERE is_current = true`,
      );
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO academic_sessions (name, code, session_cd, colg_cd, start_date, end_date, is_current, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [dto.name, sessionCd, sessionCd, colgCd, dto.startDate, dto.endDate, dto.isCurrent ?? false],
    );
    return rows[0];
  }

  async updateSession(id: string, dto: UpdateSessionDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const sessionCd = dto.session_cd || dto.code;
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE academic_sessions
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           is_current = COALESCE($4, is_current),
           is_active = COALESCE($5, is_active),
           session_cd = COALESCE($6, session_cd),
           code = COALESCE($6, code),
           colg_cd = COALESCE($7, colg_cd)
       WHERE id = $8
       RETURNING *`,
      [dto.name, dto.startDate, dto.endDate, dto.isCurrent, dto.isActive, sessionCd, dto.colg_cd, id],
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

  // ─── 6. PROFESSIONAL PHASES / ACADEMIC YEAR ───────────────────────────────
  private async ensureProperPhasesForSchema(schema: string, slug: string) {
    try {
      await this.ds.query(`
        ALTER TABLE "${schema}".professional_phases ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".professional_phases ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);
        ALTER TABLE "${schema}".professional_phases ADD COLUMN IF NOT EXISTS branch_name VARCHAR(200);
        ALTER TABLE "${schema}".professional_phases ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 1;
      `).catch(() => {});
    } catch (err: any) {
      // Schema may not have table yet
    }
  }

  async listProfessionals(tenantSlug?: string, user?: any) {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
    const colleges = await this.listColleges(user);

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || await this.getCollegeIdBySlug(slug);
      const collegeName = targetCollege?.name || '';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;
      await this.tenantSchemaService.ensureLatestSchema(slug);
      await this.ensureProperPhasesForSchema(schema, slug);

      try {
        const rows = await this.ds.query(
          `SELECT DISTINCT ON (p.id)
                  p.id, p.name, p.phase_order, p.course_cd, p.academic_system, p.is_active, p.created_at,
                  p.branch_cd, p.branch_id, p.branch_name, p.academic_year,
                  COALESCE(c.name, 'Course ' || p.course_cd) AS course_name,
                  COALESCE(c.code, p.course_cd) AS course_code,
                  COALESCE(NULLIF(p.branch_name, ''), 'General Branch') AS branch_display_name,
                  1 AS duration_years
           FROM "${schema}".professional_phases p
           LEFT JOIN "${schema}".courses c ON c.course_cd = p.course_cd OR c.code = p.course_cd
           ORDER BY p.id, p.phase_order ASC`,
        );
        return rows
          .map((r: any) => ({
            ...r,
            phase_name: r.name,
            academic_year: r.academic_year || (r.academic_system === 'semester' ? Math.ceil((r.phase_order || 1) / 2) : (r.phase_order || 1)),
            college_id: collegeId,
            college_name: collegeName,
            college_code: collegeCode,
            college_slug: slug,
          }))
          .sort((a: any, b: any) => (a.academic_year - b.academic_year) || (a.phase_order - b.phase_order));
      } catch (err: any) {
        return [];
      }
    }

    // Return aggregated professional phases across all active colleges
    const allProfessionals: any[] = [];
    for (const col of colleges) {
      const slug = col.slug;
      const schema = `tenant_${slug}`;
      try {
        await this.ensureProperPhasesForSchema(schema, slug);
        const rows = await this.ds.query(
          `SELECT DISTINCT ON (p.id)
                  p.id, p.name, p.phase_order, p.course_cd, p.academic_system, p.is_active, p.created_at,
                  p.branch_cd, p.branch_id, p.branch_name, p.academic_year,
                  COALESCE(c.name, 'Course ' || p.course_cd) AS course_name,
                  COALESCE(c.code, p.course_cd) AS course_code,
                  COALESCE(NULLIF(p.branch_name, ''), 'General Branch') AS branch_display_name,
                  1 AS duration_years
           FROM "${schema}".professional_phases p
           LEFT JOIN "${schema}".courses c ON c.course_cd = p.course_cd OR c.code = p.course_cd
           ORDER BY p.id, p.phase_order ASC`,
        );
        for (const row of rows) {
          allProfessionals.push({
            ...row,
            phase_name: row.name,
            academic_year: row.academic_year || (row.academic_system === 'semester' ? Math.ceil((row.phase_order || 1) / 2) : (row.phase_order || 1)),
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: slug,
          });
        }
      } catch (err: any) {
        // Schema not provisioned yet or table empty
      }
    }
    return allProfessionals.sort((a: any, b: any) => (a.academic_year - b.academic_year) || (a.phase_order - b.phase_order));
  }

  async createProfessional(dto: CreateProfessionalDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.collegeId || dto.college_id || tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const schema = `tenant_${slug}`;
    await this.ensureProperPhasesForSchema(schema, slug);

    const finalName = dto.name || dto.phaseName || `Semester ${dto.phaseOrder || 1}`;
    const finalCourseCd = dto.courseCd || dto.course_cd || dto.courseId || '1';
    const validBranchId = this.isUUID(dto.branchId) ? dto.branchId : null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO professional_phases (name, phase_order, course_cd, branch_cd, branch_id, branch_name, academic_year, academic_system, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [
        finalName,
        dto.phaseOrder || 1,
        finalCourseCd,
        dto.branchCd || null,
        validBranchId,
        dto.branchName || null,
        dto.academicYear || 1,
        dto.academicSystem || (slug === 'srms-ims' ? 'professional' : 'semester'),
      ],
    );
    return rows[0];
  }

  async updateProfessional(id: string, dto: UpdateProfessionalDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.collegeId || tenantSlug);
    const schema = `tenant_${slug}`;
    await this.ensureProperPhasesForSchema(schema, slug);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE professional_phases
       SET name = COALESCE($1, name),
           phase_order = COALESCE($2, phase_order),
           course_cd = COALESCE($3, course_cd),
           branch_cd = COALESCE($4, branch_cd),
           branch_id = COALESCE($5, branch_id),
           branch_name = COALESCE($6, branch_name),
           academic_year = COALESCE($7, academic_year),
           academic_system = COALESCE($8, academic_system),
           is_active = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [
        dto.name,
        dto.phaseOrder,
        dto.courseCd,
        dto.branchCd,
        dto.branchId,
        dto.branchName,
        dto.academicYear,
        dto.academicSystem,
        dto.isActive,
        id,
      ],
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
    return { success: true, message: 'Academic Year / Professional phase deleted successfully' };
  }

  // ─── 8. GROUPS MASTER (BATCH SUB-GROUPS: A, B, C, D) ─────────────────────
  private isUUID(str?: string | null): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async listGroups(tenantSlug?: string, batchId?: string, departmentId?: string, user?: any) {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
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

  // ─── 9. RESIDENCIES MASTER (HOSTEL / RESIDENCY CATEGORIES) ────────────────
  private async ensureResidencyTable(slug: string) {
    await this.tenantSchemaService.queryInTenant(
      slug,
      `CREATE TABLE IF NOT EXISTS residency_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id VARCHAR(100),
        college_code VARCHAR(50),
        college_slug VARCHAR(100),
        course_id VARCHAR(100),
        course_code VARCHAR(50),
        course_name VARCHAR(255),
        residency_type VARCHAR(100) DEFAULT 'Hosteller',
        category_name VARCHAR(255) NOT NULL,
        block_wing VARCHAR(100),
        total_capacity INT DEFAULT 100,
        allocated_count INT DEFAULT 0,
        monthly_fee NUMERIC(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
    );
  }

  async listResidencies(tenantSlug?: string, user?: any) {
    if (user && user.role && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      tenantSlug = user.tenantSlug;
    }
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.ensureResidencyTable(slug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM residency_categories ORDER BY category_name ASC`,
    );
    return rows.map(r => ({
      ...r,
      college_id: r.college_id || collegeId,
      college_slug: slug,
    }));
  }

  async createResidency(dto: CreateResidencyDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.ensureResidencyTable(slug);
    const collegeId = await this.getCollegeIdBySlug(slug);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO residency_categories (college_id, college_slug, course_id, residency_type, category_name, block_wing, total_capacity, allocated_count, monthly_fee, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [
        dto.collegeId || collegeId,
        slug,
        dto.courseId || null,
        dto.residencyType || 'Hosteller',
        dto.categoryName,
        dto.blockWing || null,
        dto.totalCapacity || 100,
        dto.allocatedCount || 0,
        dto.monthlyFee || 0,
      ],
    );
    return rows[0];
  }

  async updateResidency(id: string, dto: UpdateResidencyDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.ensureResidencyTable(slug);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE residency_categories
       SET residency_type = COALESCE($1, residency_type),
           category_name = COALESCE($2, category_name),
           block_wing = COALESCE($3, block_wing),
           total_capacity = COALESCE($4, total_capacity),
           allocated_count = COALESCE($5, allocated_count),
           monthly_fee = COALESCE($6, monthly_fee),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        dto.residencyType,
        dto.categoryName,
        dto.blockWing,
        dto.totalCapacity,
        dto.allocatedCount,
        dto.monthlyFee,
        dto.isActive,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Residency Category not found');
    return rows[0];
  }

  async deleteResidency(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.ensureResidencyTable(slug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM residency_categories WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Residency Category deleted successfully' };
  }
}

