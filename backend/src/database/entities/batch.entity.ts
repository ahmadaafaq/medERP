import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'batches' })
export class BatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'varchar', length: 20 })
  course_cd: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
