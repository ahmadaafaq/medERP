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
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT r.*, fs.fee_type, fs.amount as total_amount, s.name as student_name
       FROM student_fee_records r
       JOIN students s ON r.student_id = s.id
       JOIN fees_structure fs ON r.fee_structure_id = fs.id
       WHERE s.rollno = $1
       ORDER BY r.created_at DESC`,
      [rollno],
    );
  }
}
