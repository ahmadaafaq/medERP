import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'students' })
@Index(['rollno'])
@Index(['department_id'])
@Index(['batch_id'])
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  rollno: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  batch_cd: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  course_cd: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string;

  @Column({ type: 'int', nullable: true })
  admission_year: number;

  @Column({ type: 'text', nullable: true })
  photo_url: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  blood_group: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergency_contact: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
