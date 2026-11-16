import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'student_group_members' })
@Index(['student_id'])
@Index(['group_id'])
@Index(['group_type'])
export class StudentGroupMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'varchar', length: 30, default: 'PRACTICAL' })
  group_type: string; // PRACTICAL, CLINICAL, COMMUNITY, TUTORIAL

  @Column({ type: 'date', nullable: true })
  from_date: Date;

  @Column({ type: 'date', nullable: true })
  to_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

