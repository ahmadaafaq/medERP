import { Injectable, Logger } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateLogbookEntryDto, VerifyLogbookEntryDto } from './dto/logbook.dto';

@Injectable()
export class LogbookService {
  private readonly logger = new Logger(LogbookService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async createEntry(tenantSlug: string, dto: CreateLogbookEntryDto) {
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO logbook_entries (student_id, activity_type_id, entry_date, description, faculty_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.studentId, dto.activityTypeId, dto.entryDate, dto.description || null, dto.facultyId || null],
    );
    return res[0];
  }

  async getActivityTypes(tenantSlug: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id, code, name, category, max_required, activity_type FROM logbook_activity_types ORDER BY name ASC`,
    );
  }

  async getStudentEntries(tenantSlug: string, identifier: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT e.*, a.name as activity_name, a.code as activity_code, a.category, COALESCE(v.status, 'PENDING') as verification_status, v.remarks
       FROM logbook_entries e
       JOIN students s ON e.student_id = s.id
       LEFT JOIN logbook_activity_types a ON e.activity_type_id = a.id
       LEFT JOIN logbook_verifications v ON e.id = v.entry_id
       WHERE LOWER(COALESCE(s.rollno, '')) = LOWER($1)
          OR LOWER(COALESCE(s.registration_no, '')) = LOWER($1)
          OR s.id::text = $1
       ORDER BY e.entry_date DESC`,
      [identifier],
    );
  }

  async verifyEntry(tenantSlug: string, entryId: string, verifierId: string, verifierRole: string, dto: VerifyLogbookEntryDto) {
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO logbook_verifications (entry_id, verifier_id, verifier_role, status, verified_at, remarks)
       VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *`,
      [entryId, verifierId, verifierRole, dto.status, dto.remarks || null],
    );
    return res[0];
  }

  async getMonthlyPgAudit(tenantSlug: string, rollno?: string) {
    if (rollno) {
      return this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT e.month_number, e.year, COUNT(e.id) as total_entries, 
                COUNT(CASE WHEN v.status = 'VERIFIED' THEN 1 END) as verified_entries
         FROM logbook_entries e
         JOIN students s ON e.student_id = s.id
         LEFT JOIN logbook_verifications v ON e.id = v.entry_id
         WHERE s.rollno = $1
         GROUP BY e.month_number, e.year
         ORDER BY e.year DESC, e.month_number DESC`,
        [rollno],
      );
    }
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT s.rollno, s.name as student_name, COUNT(e.id) as total_entries,
              COUNT(CASE WHEN v.status = 'VERIFIED' THEN 1 END) as verified_entries
       FROM students s
       LEFT JOIN logbook_entries e ON s.id = e.student_id
       LEFT JOIN logbook_verifications v ON e.id = v.entry_id
       GROUP BY s.id, s.rollno, s.name
       ORDER BY s.rollno ASC`,
    );
  }
}
