import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'attendance_condonations' })
@Index(['student_id'])
@Index(['batch_id'])
export class AttendanceCondonationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid', nullable: true })
  academic_period_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  course_cd: string;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string;

  @Column({ type: 'uuid', nullable: true })
  phase_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  shortage_percentage: number;

  @Column({ type: 'uuid', nullable: true })
  requested_by: string;

  @Column({ type: 'boolean', default: false })
  hod_approved: boolean;

  @Column({ type: 'uuid', nullable: true })
  hod_approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  hod_approved_at: Date;

  @Column({ type: 'boolean', default: false })
  principal_approved: boolean;

  @Column({ type: 'uuid', nullable: true })
  principal_approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  principal_approved_at: Date;

  @Column({ type: 'boolean', default: false })
  fee_required: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  fee_amount: number;

  @Column({ type: 'boolean', default: false })
  fee_paid: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fee_receipt_no: string;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string; // PENDING, HOD_APPROVED, APPROVED, REJECTED

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

