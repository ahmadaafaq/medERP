import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  password_hash: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  onboarding_completed: boolean;

  @Column({ type: 'int', default: 0 })
  onboarding_step: number;

  @Column({ type: 'boolean', default: true })
  must_change_password: boolean;

  @Column({ type: 'int', default: 0 })
  failed_login_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  locked_until: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  password_reset_token: string;

  @Column({ type: 'timestamptz', nullable: true })
  password_reset_expires: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
