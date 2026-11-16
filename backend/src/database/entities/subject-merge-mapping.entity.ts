import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'subject_merge_mappings' })
@Index(['phase_id'])
@Index(['major_subject_id'])
@Index(['child_subject_id'])
@Index(['colg_cd'])
@Index(['course_cd'])
@Index(['branch_cd'])
@Index(['batch_cd'])
@Index(['semester_cd'])
@Index(['phase_cd'])
export class SubjectMergeMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  phase_id?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  colg_cd?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  course_cd?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  branch_cd?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  batch_cd?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  semester_cd?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phase_cd?: string;

  @Column({ type: 'uuid' })
  major_subject_id: string;

  @Column({ type: 'uuid' })
  child_subject_id: string;

  @Column({ type: 'varchar', length: 20, default: 'COMBINE' })
  merge_mode: string; // COMBINE or SEPARATE

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

