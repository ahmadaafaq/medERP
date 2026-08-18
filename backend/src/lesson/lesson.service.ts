import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateLessonDto } from './dto/create-lesson.dto';
import * as path from 'path';
import * as fs from 'fs';

export interface LessonFilterQuery {
  colgCd?: string;
  courseCd?: string;
  branchCd?: string;
  batchCd?: string;
  semCd?: string;
  subjectId?: string;
  empid?: string;
  limit?: number;
}

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);
  private readonly ALLOWED_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit

  constructor(private readonly dataSource: DataSource) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    const slug = (tenantSlug || 'srms-cet-bareilly').toLowerCase().trim();
    return slug.replace(/[^a-z0-9_-]/g, '');
  }

  private getUploadDir(tenantSlug: string, colgCd: string): string {
    const year = new Date().getFullYear();
    const dir = path.join(process.cwd(), 'uploads', 'lessons', tenantSlug, String(colgCd || '1'), String(year));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  async createLesson(
    tenantSlug: string,
    user: any,
    dto: CreateLessonDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Lesson document/file is required');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds the 25MB limit');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File format ${ext} is not allowed. Supported formats: .pdf, .xls, .xlsx, .doc, .docx, .txt, .jpg, .jpeg, .png`);
    }

    // Resolve tenant & user details (JWT enforced for security!)
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const colgCd = (user?.role === 'SUPER_ADMIN' && dto.colgCd) ? dto.colgCd : (user?.colgCd || dto.colgCd || '1');
    const empid = user?.emp_id || user?.empid || user?.sub || 'FAC001';
    const facultyName = user?.name || user?.username || 'Faculty Member';

    // Save physical file
    const uploadDir = this.getUploadDir(slug, colgCd);
    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);

    fs.writeFileSync(filePath, file.buffer);

    // Save metadata in Postgres
    const query = `
      INSERT INTO "${schema}".lessons (
        colg_cd, course_cd, branch_cd, batch_cd, sem_cd,
        subject_id, unit_id, topic_id, subtopic_id,
        empid, faculty_name, title, description,
        file_name, file_type, file_size, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      colgCd,
      dto.courseCd,
      dto.branchCd,
      dto.batchCd,
      dto.semCd,
      dto.subjectId || null,
      dto.unitId || null,
      dto.topicId || null,
      dto.subtopicId || null,
      empid,
      facultyName,
      dto.title,
      dto.description || null,
      file.originalname,
      ext.replace('.', '').toUpperCase(),
      file.size,
      filePath,
    ];

    const result = await this.dataSource.query(query, values);
    this.logger.log(`Created lesson #${result[0]?.id} in ${schema} by ${empid}`);
    return result[0];
  }

  async listLessons(tenantSlug: string, user: any, filters: LessonFilterQuery) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    let whereConditions: string[] = ['is_active = TRUE'];
    let params: any[] = [];
    let paramIdx = 1;

    // Security & Role-based Scoping
    if (user?.role === 'STUDENT') {
      // Student: auto-filtered by course, branch, batch, sem if passed or enrolled
      if (filters.courseCd) { whereConditions.push(`course_cd = $${paramIdx++}`); params.push(filters.courseCd); }
      if (filters.branchCd) { whereConditions.push(`branch_cd = $${paramIdx++}`); params.push(filters.branchCd); }
      if (filters.batchCd) { whereConditions.push(`batch_cd = $${paramIdx++}`); params.push(filters.batchCd); }
      if (filters.semCd) { whereConditions.push(`sem_cd = $${paramIdx++}`); params.push(filters.semCd); }
    } else if (user?.role === 'FACULTY') {
      // Faculty: scoped to their own college or optionally filters
      const userColg = user?.colgCd || '1';
      whereConditions.push(`colg_cd = $${paramIdx++}`);
      params.push(userColg);

      if (filters.empid) {
        whereConditions.push(`empid = $${paramIdx++}`);
        params.push(filters.empid);
      }
    } else if (user?.role !== 'SUPER_ADMIN') {
      // Admin / Clerk: scoped to their college
      const userColg = user?.colgCd || filters.colgCd;
      if (userColg) {
        whereConditions.push(`colg_cd = $${paramIdx++}`);
        params.push(userColg);
      }
    } else {
      // SuperAdmin can filter by college
      if (filters.colgCd) {
        whereConditions.push(`colg_cd = $${paramIdx++}`);
        params.push(filters.colgCd);
      }
    }

    if (filters.courseCd && user?.role !== 'STUDENT') { whereConditions.push(`course_cd = $${paramIdx++}`); params.push(filters.courseCd); }
    if (filters.branchCd && user?.role !== 'STUDENT') { whereConditions.push(`branch_cd = $${paramIdx++}`); params.push(filters.branchCd); }
    if (filters.batchCd && user?.role !== 'STUDENT') { whereConditions.push(`batch_cd = $${paramIdx++}`); params.push(filters.batchCd); }
    if (filters.semCd && user?.role !== 'STUDENT') { whereConditions.push(`sem_cd = $${paramIdx++}`); params.push(filters.semCd); }
    if (filters.subjectId) { whereConditions.push(`subject_id = $${paramIdx++}`); params.push(filters.subjectId); }

    const limit = filters.limit || 100;
    const query = `
      SELECT * FROM "${schema}".lessons
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIdx}
    `;
    params.push(limit);

    return this.dataSource.query(query, params);
  }

  async getRecentLessons(tenantSlug: string, user: any, limit: number = 6) {
    return this.listLessons(tenantSlug, user, { limit });
  }

  async getLessonFileDetails(tenantSlug: string, id: number) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const result = await this.dataSource.query(`SELECT * FROM "${schema}".lessons WHERE id = $1 AND is_active = TRUE`, [id]);
    if (!result || result.length === 0) {
      throw new NotFoundException(`Lesson #${id} not found`);
    }
    return result[0];
  }

  async deleteLesson(tenantSlug: string, user: any, id: number) {
    const lesson = await this.getLessonFileDetails(tenantSlug, id);

    // Permission check: Faculty can delete own lesson; Admin / SuperAdmin can delete any lesson
    const empid = user?.emp_id || user?.empid || user?.sub;
    if (user?.role === 'FACULTY' && lesson.empid !== empid) {
      throw new ForbiddenException('You can only delete your own uploaded lessons');
    }

    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    // Soft delete in Postgres
    await this.dataSource.query(`UPDATE "${schema}".lessons SET is_active = FALSE WHERE id = $1`, [id]);

    // Optionally remove file on disk
    try {
      if (fs.existsSync(lesson.file_path)) {
        fs.unlinkSync(lesson.file_path);
      }
    } catch (e) {
      this.logger.warn(`Could not delete file at ${lesson.file_path}: ${e.message}`);
    }

    return { success: true, message: `Lesson #${id} deleted successfully` };
  }
}
