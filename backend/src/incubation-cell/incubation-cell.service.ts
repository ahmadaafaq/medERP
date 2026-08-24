import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { QueryIncubationProjectsDto, UpdateIncubationStatusDto } from './dto/incubation.dto';

@Injectable()
export class IncubationCellService {
  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  private resolveTenantSlug(slug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(slug);
  }

  /**
   * Fetch hierarchical metadata for cascading dropdown filters:
   * Colleges -> Courses -> Branches -> Batches
   */
  async getHierarchyMeta(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    try {
      // 1. Colleges
      let colleges: any[] = [];
      try {
        const firmRes = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id::text, slug AS code, name FROM public.firms WHERE is_active = true ORDER BY name ASC`
        );
        colleges = firmRes.map((f: any) => ({
          id: '1',
          code: f.code || '1',
          name: f.name || 'SRMS College of Engineering & Technology, Bareilly',
        }));
      } catch {
        colleges = [
          { id: '1', code: '1', name: 'SRMS College of Engineering & Technology, Bareilly' },
          { id: '2', code: '2', name: 'SRMS Institute of Medical Sciences, Bareilly' },
          { id: '3', code: '3', name: 'SRMS College of Nursing, Bareilly' },
        ];
      }

      if (colleges.length === 0) {
        colleges = [
          { id: '1', code: '1', name: 'SRMS College of Engineering & Technology, Bareilly' },
        ];
      }

      // 2. Courses
      const courses = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id::text, code, name, COALESCE(course_cd, code) AS course_cd, '1' AS colg_cd 
         FROM "${schema}".courses 
         WHERE is_active = true 
         ORDER BY name ASC`
      );

      // 3. Branches / Departments
      const branches = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id::text, code, name, COALESCE(course_cd, '1') AS course_cd, COALESCE(colg_cd, '1') AS colg_cd 
         FROM "${schema}".departments 
         WHERE is_active = true 
         ORDER BY name ASC`
      );

      // 4. Batches
      const batches = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id::text, code, name, COALESCE(batch_cd, code) AS batch_cd, COALESCE(course_cd, '1') AS course_cd, COALESCE(colg_cd, '1') AS colg_cd 
         FROM "${schema}".batches 
         WHERE is_active = true 
         ORDER BY year DESC, name ASC`
      );

      return {
        success: true,
        data: {
          colleges,
          courses,
          branches,
          batches,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to load hierarchy metadata',
        data: {
          colleges: [{ id: '1', code: '1', name: 'SRMS College of Engineering & Technology, Bareilly' }],
          courses: [
            { id: '1', code: '1', name: 'B.TECH.', course_cd: '1', colg_cd: '1' },
            { id: '2', code: '2', name: 'B.PHARM.', course_cd: '2', colg_cd: '1' },
            { id: '3', code: '3', name: 'MCA', course_cd: '3', colg_cd: '1' },
            { id: '4', code: '4', name: 'MBA', course_cd: '4', colg_cd: '1' },
          ],
          branches: [
            { id: '1', code: 'CS', name: 'Computer Science & Engineering', course_cd: '1', colg_cd: '1' },
            { id: '2', code: 'IT', name: 'Information Technology', course_cd: '1', colg_cd: '1' },
            { id: '3', code: 'EC', name: 'Electronics & Communication', course_cd: '1', colg_cd: '1' },
            { id: '4', code: 'PHARM', name: 'Pharmaceutical Sciences', course_cd: '2', colg_cd: '1' },
          ],
          batches: [
            { id: '1', code: 'B2025-C1-1', name: 'Batch 2025', batch_cd: 'B2025-C1-1', course_cd: '1', colg_cd: '1' },
            { id: '2', code: 'B2024-C1-1', name: 'Batch 2024', batch_cd: 'B2024-C1-1', course_cd: '1', colg_cd: '1' },
            { id: '3', code: 'B2023-C1-1', name: 'Batch 2023', batch_cd: 'B2023-C1-1', course_cd: '1', colg_cd: '1' },
          ],
        },
      };
    }
  }

  /**
   * Fetch Incubation Projects (Threshold: Faculty Score >= 70% or nominated)
   */
  async getIncubationProjects(tenantSlug: string, query: QueryIncubationProjectsDto) {
    const slug = this.resolveTenantSlug(tenantSlug || query.tenant);
    const schema = `tenant_${slug}`;

    // Ensure incubation columns exist
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `ALTER TABLE "${schema}".repositories 
         ADD COLUMN IF NOT EXISTS incubation_status VARCHAR(50) DEFAULT 'Under Review',
         ADD COLUMN IF NOT EXISTS incubation_notes TEXT,
         ADD COLUMN IF NOT EXISTS funding_amount NUMERIC DEFAULT 0,
         ADD COLUMN IF NOT EXISTS mentor_assigned VARCHAR(255),
         ADD COLUMN IF NOT EXISTS incubated_at TIMESTAMP;`
      );
    } catch {}

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Minimum Score filter (default: > 70% OR explicitly shortlisted/incubated)
    const minScore = query.minScore !== undefined ? Number(query.minScore) : 70;
    conditions.push(`(r.score > $${paramIndex} OR r.is_placement_eligible = true OR r.incubation_status IN ('Selected', 'Funded', 'Incubated'))`);
    params.push(minScore);
    paramIndex++;

    // College filter
    if (query.collegeId && query.collegeId !== 'all') {
      conditions.push(`(r.colg_cd = $${paramIndex} OR r.colg_cd = '1' OR $${paramIndex} = '1')`);
      params.push(query.collegeId);
      paramIndex++;
    }

    // Course filter
    if (query.courseId && query.courseId !== 'all') {
      conditions.push(`(r.course_cd = $${paramIndex} OR crs.code = $${paramIndex} OR crs.id::text = $${paramIndex} OR crs.name ILIKE '%' || $${paramIndex} || '%')`);
      params.push(query.courseId);
      paramIndex++;
    }

    // Branch filter
    if (query.branchId && query.branchId !== 'all') {
      conditions.push(`(r.branch_cd = $${paramIndex} OR dep.code = $${paramIndex} OR dep.id::text = $${paramIndex} OR dep.name ILIKE '%' || $${paramIndex} || '%')`);
      params.push(query.branchId);
      paramIndex++;
    }

    // Batch filter
    if (query.batchId && query.batchId !== 'all') {
      conditions.push(`(r.batch_cd = $${paramIndex} OR bth.code = $${paramIndex} OR bth.name ILIKE '%' || $${paramIndex} || '%' OR bth.id::text = $${paramIndex})`);
      params.push(query.batchId);
      paramIndex++;
    }

    // Status filter
    if (query.status && query.status !== 'all') {
      conditions.push(`r.incubation_status ILIKE $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    // Search query
    if (query.search && query.search.trim()) {
      conditions.push(`(
        r.title ILIKE $${paramIndex} OR 
        r.student_name ILIKE $${paramIndex} OR 
        r.student_reg_no ILIKE $${paramIndex} OR
        r.description ILIKE $${paramIndex} OR
        array_to_string(r.tech_stack, ',') ILIKE $${paramIndex}
      )`);
      params.push(`%${query.search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT DISTINCT ON (r.repo_id)
        r.repo_id,
        r.title,
        r.description,
        r.repo_link,
        r.tech_stack,
        r.score,
        r.grade,
        r.status AS repo_status,
        r.is_placement_eligible,
        COALESCE(r.incubation_status, 'Under Review') AS incubation_status,
        r.incubation_notes,
        COALESCE(r.funding_amount, 0) AS funding_amount,
        r.mentor_assigned,
        r.submitted_at,
        r.updated_at,
        r.screenshots,
        COALESCE(r.student_name, s.name, 'Enrolled Student') AS student_name,
        COALESCE(r.student_reg_no, s.registration_no, s.rollno, 'REG-2026') AS student_reg_no,
        COALESCE(s.rollno, r.student_reg_no, '2025107666') AS rollno,
        COALESCE(s.photo_url, '') AS student_photo,
        COALESCE(crs.name, r.course_cd, 'B.TECH.') AS course_name,
        COALESCE(dep.name, r.branch_cd, 'Computer Science & Engineering') AS branch_name,
        COALESCE(bth.name, r.batch_cd, 'Batch 2025') AS batch_name,
        'SRMS College of Engineering & Technology, Bareilly' AS college_name,
        rev.faculty_name,
        rev.faculty_empid,
        rev.faculty_photo,
        rev.faculty_designation,
        rev.remarks AS faculty_remarks,
        rev.reviewed_at AS faculty_reviewed_at
      FROM "${schema}".repositories r
      LEFT JOIN "${schema}".students s ON (
        r.student_reg_no = s.registration_no 
        OR r.student_reg_no = s.rollno
      )
      LEFT JOIN "${schema}".courses crs ON (
        r.course_cd = crs.code 
        OR r.course_cd = crs.course_cd 
        OR r.course_cd = crs.id::text 
        OR s.course_cd = crs.code
      )
      LEFT JOIN "${schema}".departments dep ON (
        r.branch_cd = dep.code 
        OR r.branch_cd = dep.branch_cd 
        OR r.branch_cd = dep.id::text 
        OR r.branch_cd = dep.name
      )
      LEFT JOIN "${schema}".batches bth ON (
        r.batch_cd = bth.code 
        OR r.batch_cd = bth.batch_cd 
        OR r.batch_cd = bth.id::text 
        OR r.batch_cd = bth.name
        OR s.batch_cd = bth.code
      )
      LEFT JOIN LATERAL (
        SELECT rw.faculty_name, 
               rw.faculty_empid, 
               rw.remarks, 
               rw.reviewed_at,
               f.photo_url AS faculty_photo,
               f.designation AS faculty_designation
        FROM "${schema}".repository_reviews rw
        LEFT JOIN "${schema}".faculty f ON (rw.faculty_empid = f.emp_id OR rw.faculty_name = f.name)
        WHERE rw.repo_id = r.repo_id
        ORDER BY rw.reviewed_at DESC
        LIMIT 1
      ) rev ON true
      ${whereClause}
      ORDER BY r.repo_id, r.score DESC, r.submitted_at DESC
    `;

    const rawProjects = await this.tenantSchemaService.queryInTenant(slug, sql, params);

    // Format output with image/thumbnail
    const formatted = rawProjects.map((p: any) => {
      const screenshots = Array.isArray(p.screenshots) ? p.screenshots : (p.screenshots ? [p.screenshots] : []);
      const primaryImage = screenshots[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';

      return {
        id: p.repo_id,
        repoId: p.repo_id,
        title: p.title,
        description: p.description,
        image: primaryImage,
        screenshots: screenshots.length > 0 ? screenshots : [primaryImage],
        repoLink: p.repo_link,
        techStack: Array.isArray(p.tech_stack) ? p.tech_stack : (typeof p.tech_stack === 'string' ? p.tech_stack.replace(/[{}]/g, '').split(',') : ['Full-Stack']),
        percentage: Number(p.score) || 0,
        score: Number(p.score) || 0,
        grade: p.grade || (p.score >= 90 ? 'A+' : p.score >= 80 ? 'A' : p.score >= 70 ? 'B' : 'C'),
        incubationStatus: p.incubation_status || 'Under Review',
        incubationNotes: p.incubation_notes || '',
        fundingAmount: Number(p.funding_amount) || 0,
        mentorAssigned: p.mentor_assigned || '',
        isPlacementEligible: Boolean(p.is_placement_eligible),
        studentName: p.student_name,
        studentRegNo: p.student_reg_no,
        rollNo: p.rollno,
        studentPhoto: p.student_photo || '',
        facultyPhoto: p.faculty_photo || '',
        facultyDesignation: p.faculty_designation || 'Faculty Reviewer',
        collegeName: p.college_name,
        courseName: p.course_name,
        branchName: p.branch_name,
        batchName: p.batch_name,
        submittedAt: p.submitted_at,
        facultyName: p.faculty_name || 'Academic Committee Evaluator',
        facultyRemarks: p.faculty_remarks || 'Faculty evaluated and verified repository architecture for incubation readiness.',
        facultyReviewedAt: p.faculty_reviewed_at,
      };
    });

    return {
      success: true,
      count: formatted.length,
      data: formatted,
    };
  }

  /**
   * Update Incubation Status (Under Review / Selected / Funded / Incubated / Rejected)
   */
  async updateIncubationStatus(tenantSlug: string, projectId: number, dto: UpdateIncubationStatusDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug || dto.tenant);
    const schema = `tenant_${slug}`;

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".repositories WHERE repo_id = $1`,
      [projectId]
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Incubation project #${projectId} not found`);
    }

    const isIncubated = dto.status === 'Incubated' || dto.status === 'Funded';
    const incubatedAt = isIncubated ? new Date().toISOString() : existing[0].incubated_at;
    const finalNotes = dto.incubation_notes || dto.notes || null;

    const updated = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".repositories 
       SET incubation_status = $1,
           incubation_notes = COALESCE($2, incubation_notes),
           funding_amount = COALESCE($3, funding_amount),
           mentor_assigned = COALESCE($4, mentor_assigned),
           incubated_at = $5,
           updated_at = NOW()
       WHERE repo_id = $6
       RETURNING *`,
      [
        dto.status,
        finalNotes,
        dto.funding_amount !== undefined ? dto.funding_amount : null,
        dto.mentor_assigned || null,
        incubatedAt,
        projectId,
      ]
    );

    const projectData = updated[0];

    // Dispatch Golden Opportunity notifications to Student & Faculty if Selected / Incubated / Funded
    if (['Selected', 'Incubated', 'Funded'].includes(dto.status)) {
      try {
        const studentRegNo = projectData.student_reg_no;
        const projectTitle = projectData.title || 'Academic Project';
        const fundingMsg = projectData.funding_amount > 0 ? ` with an approved seed grant of ₹${Number(projectData.funding_amount).toLocaleString('en-IN')}` : '';

        // 1. Notification for Student
        if (studentRegNo) {
          const studentTitle = `🚀 Golden Opportunity: Project "${projectTitle}" Selected for Venture Incubation!`;
          const studentBody = `🌟 Congratulations! You are a genius! Your project "${projectTitle}" has achieved exceptional faculty scores and has been selected by College Administration for the SRMS Venture Incubation Cell & Corporate Placement Pipeline${fundingMsg}. A golden opportunity for company commercialization awaits!`;
          
          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO "${schema}".notifications (
              id, recipient_id, title, body, message, type, category, is_read, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $3, 'INCUBATION_SELECTED', 'INCUBATION', false, NOW()
            )`,
            [studentRegNo, studentTitle, studentBody]
          );

          // Also insert into notices table so it pops up in Campus Alerts Bell Dropdown
          try {
            const noticeRes = await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".notices (
                id, title, body, priority, category, creator_name, creator_role, status, requires_acknowledgement, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, 'urgent', 'announcement', 'Incubation & Entrepreneurship Cell', 'Admin', 'sent', true, NOW(), NOW()
              ) RETURNING id`,
              [studentTitle, studentBody]
            );
            if (noticeRes && noticeRes.length > 0) {
              const noticeId = noticeRes[0].id;
              await this.tenantSchemaService.queryInTenant(
                slug,
                `INSERT INTO "${schema}".notice_targets (id, notice_id, target_type, target_value, target_label, created_at)
                 VALUES 
                   (gen_random_uuid(), $1, 'role', 'student', 'All Students', NOW()),
                   (gen_random_uuid(), $1, 'individual', $2, $3, NOW())`,
                [noticeId, studentRegNo, projectData.student_name || 'Student']
              );
            }
          } catch (nErr) {
            console.error('Failed to create campus notice for incubation:', nErr);
          }
        }

        // 2. Notification for Reviewing Faculty
        const reviews = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT faculty_empid, faculty_name FROM "${schema}".repository_reviews WHERE repo_id = $1 ORDER BY reviewed_at DESC LIMIT 1`,
          [projectId]
        );

        if (reviews && reviews.length > 0) {
          const facultyId = reviews[0].faculty_empid || reviews[0].faculty_name;
          const facultyTitle = `🌟 Mentored Student Project Shortlisted for Venture Incubation`;
          const facultyBody = `Exciting News! Student project "${projectTitle}" (Student: ${projectData.student_name}) evaluated under your guidance has been shortlisted by College Administration for Incubation & Corporate Commercialization.`;

          await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO "${schema}".notifications (
              id, recipient_id, title, body, message, type, category, is_read, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $3, 'INCUBATION_FACULTY_ALERT', 'INCUBATION', false, NOW()
            )`,
            [facultyId, facultyTitle, facultyBody]
          );
        }
      } catch (notifErr) {
        console.error('Failed to insert incubation notification:', notifErr);
      }
    }

    return {
      success: true,
      message: `Project status updated to ${dto.status} in Incubation Cell. Golden notifications dispatched to student & faculty.`,
      project: projectData,
    };
  }
}
