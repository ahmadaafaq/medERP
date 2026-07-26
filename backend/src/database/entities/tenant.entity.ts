import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'tenants', schema: 'public' })
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  domain: string;

  @Column({ type: 'varchar', length: 50, default: 'standard' })
  plan: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 7, default: '#6366F1' })
  primary_color: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  smtp_host: string;

  @Column({ type: 'int', default: 587 })
  smtp_port: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  smtp_user: string;

  @Column({ type: 'text', nullable: true })
  smtp_pass_encrypted: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  schema_provisioned: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
