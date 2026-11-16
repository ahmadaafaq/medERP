import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'attendance_policies' })
@Index(['course_cd'])
@Index(['course_cd', 'academic_system'], { unique: true })
export class AttendancePolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  college_id: string;

  @Column({ type: 'varchar', length: 50 })
  course_cd: string;

  @Column({ type: 'varchar', length: 50, default: 'semester' })
  academic_system: string;

  @Column({ type: 'varchar', length: 50, default: 'AICTE' })
  regulator: string; // AICTE, NMC, PCI, UGC, NBA

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 75.00 })
  min_theory_pct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 80.00 })
  min_practical_pct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 80.00 })
  min_clinical_pct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 75.00 })
  min_aggregate_pct: number;

  @Column({ type: 'varchar', length: 30, default: 'SEPARATE' })
  eval_mode: string; // SEPARATE or AGGREGATE

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 65.00 })
  condonation_floor_pct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 75.00 })
  condonation_max_pct: number;

  @Column({ type: 'varchar', length: 30, default: 'EXCLUDE_DENOMINATOR' })
  excuse_leaves_mode: string; // EXCLUDE_DENOMINATOR, COUNT_AS_PRESENT, NONE

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

