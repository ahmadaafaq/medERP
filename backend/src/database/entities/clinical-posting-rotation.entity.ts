import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'clinical_posting_rotations' })
@Index(['batch_id'])
@Index(['phase_id'])
@Index(['group_id'])
@Index(['department_id'])
@Index(['start_date', 'end_date'])
export class ClinicalPostingRotationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batch_id: string;

  @Column({ type: 'uuid', nullable: true })
  phase_id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'uuid' })
  department_id: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  posting_name: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

