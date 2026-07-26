import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'subjects' })
export class SubjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string;

  @Column({ type: 'int', default: 0 })
  credits: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  type: string; // THEORY, PRACTICAL

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
