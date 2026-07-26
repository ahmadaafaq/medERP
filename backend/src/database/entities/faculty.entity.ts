import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'faculty' })
@Index(['emp_id'])
@Index(['department_id'])
export class FacultyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  emp_id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation: string;

  @Column({ type: 'text', nullable: true })
  qualification: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  specialization: string;

  @Column({ type: 'date', nullable: true })
  joining_date: Date;

  @Column({ type: 'text', nullable: true })
  photo_url: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
