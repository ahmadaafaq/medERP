import { Injectable, Logger } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateFeeStructureDto, RecordFeePaymentDto } from './dto/fees.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async createStructure(tenantSlug: string, dto: CreateFeeStructureDto) {
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO fees_structure (course_cd, batch_id, fee_type, amount, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.courseCd || null, dto.batchId || null, dto.feeType, dto.amount, dto.dueDate || null],
    );
    return res[0];
  }

  async getStructureByBatch(tenantSlug: string, batchId: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM fees_structure WHERE batch_id = $1 AND is_active = true`,
      [batchId],
    );
  }

  async recordPayment(tenantSlug: string, dto: RecordFeePaymentDto) {
    const receiptNo = dto.receiptNo || `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO student_fee_records (student_id, fee_structure_id, amount_paid, payment_date, payment_mode, receipt_no)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5) RETURNING *`,
      [dto.studentId, dto.feeStructureId, dto.amountPaid, dto.paymentMode || 'ONLINE', receiptNo],
    );
    return res[0];
  }

  async getStudentFees(tenantSlug: string, rollno: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    // 1. Try student_fees summary table
    const summary = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT sf.paid_fees, sf.pending_fees, sf.total_fees, s.name as student_name, s.rollno, s.registration_no
       FROM student_fees sf
       JOIN students s ON sf.student_id::text = s.id::text
       WHERE s.rollno = $1 OR s.registration_no = $1 OR s.id::text = $1
       ORDER BY sf.paid_fees DESC
       LIMIT 1`,
      [rollno],
    ).catch(() => []);

    // 2. Try student_fee_records
    const records = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT r.*, fs.fee_type, fs.amount as total_amount, s.name as student_name
       FROM student_fee_records r
       JOIN students s ON r.student_id::text = s.id::text
       JOIN fees_structure fs ON r.fee_structure_id::text = fs.id::text
       WHERE s.rollno = $1 OR s.registration_no = $1 OR s.id::text = $1
       ORDER BY r.created_at DESC`,
      [rollno],
    ).catch(() => []);

    return {
      summary: summary && summary.length > 0 ? summary[0] : null,
      records: records || [],
    };
  }
}
