import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'sections' })
@Index(['batch_id'])
export class SectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  college_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  course_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @Column({ type: 'uuid' })
  batch_id: string;

  @Column({ type: 'uuid', nullable: true })
  phase_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  semester: string | null;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 60 })
  capacity: number;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
