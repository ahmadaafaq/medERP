import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LicenseKeyEntity } from './license-key.entity';
import { TransactionEntity } from './transaction.entity';
import { FirmRolePermissionEntity } from './firm-role-permission.entity';

export enum FirmLevelType {
  STANDARD = 'STANDARD',
  ENTERPRISE = 'ENTERPRISE',
}

export enum FirmMode {
  MED = 'MED',
  NONMED = 'NONMED',
}

export enum FirmStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

@Entity({ name: 'firms', schema: 'public' })
export class FirmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index('idx_firms_slug')
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  tenant_name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  domain: string | null;

  @Column({ type: 'text', nullable: true })
  logo_url: string | null;

  @Column({ type: 'text', nullable: true })
  cover_url: string | null;

  @Column({ type: 'text', nullable: true })
  banner_url: string | null;

  @Column({
    type: 'enum',
    enum: FirmLevelType,
    default: FirmLevelType.STANDARD,
  })
  level_type: FirmLevelType;

  @Column({ type: 'varchar', length: 20, default: '#5B4BFF' })
  theme_color: string;

  @Column({ type: 'jsonb', nullable: true })
  theme_config: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: FirmMode,
    default: FirmMode.MED,
  })
  firm_mode: FirmMode;

  @Index('idx_firms_status')
  @Column({
    type: 'enum',
    enum: FirmStatus,
    default: FirmStatus.TRIAL,
  })
  status: FirmStatus;

  @Column({ type: 'int', nullable: true })
  trial_days: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  trial_started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trial_ends_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => LicenseKeyEntity, (key) => key.firm)
  license_keys: LicenseKeyEntity[];

  @OneToMany(() => TransactionEntity, (tx) => tx.firm)
  transactions: TransactionEntity[];

  @OneToMany(() => FirmRolePermissionEntity, (perm) => perm.firm)
  permissions: FirmRolePermissionEntity[];
}
