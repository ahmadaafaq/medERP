import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'attendance_record_audits' })
@Index(['record_id'])
@Index(['student_id'])
@Index(['session_id'])
export class AttendanceRecordAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  record_id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'varchar', length: 20 })
  old_status: string;

  @Column({ type: 'varchar', length: 20 })
  new_status: string;

  @Column({ type: 'uuid', nullable: true })
  changed_by: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

