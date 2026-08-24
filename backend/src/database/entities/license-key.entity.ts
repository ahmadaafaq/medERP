import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FirmEntity } from './firm.entity';

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity({ name: 'license_keys', schema: 'public' })
export class LicenseKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_license_keys_firm_id')
  @Column({ type: 'uuid' })
  firm_id: string;

  @ManyToOne(() => FirmEntity, (firm) => firm.license_keys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'firm_id' })
  firm: FirmEntity;

  @Column({ type: 'varchar', length: 255 })
  key_hash: string;

  @Column({ type: 'varchar', length: 20 })
  key_prefix: string;

  @Column({ type: 'int' })
  duration_days: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  issued_at: Date;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Index('idx_license_keys_status')
  @Column({
    type: 'enum',
    enum: LicenseStatus,
    default: LicenseStatus.ACTIVE,
  })
  status: LicenseStatus;

  @Column({ type: 'boolean', default: false })
  is_renewal: boolean;

  @Column({ type: 'uuid', nullable: true })
  renewed_from_key_id: string | null;

  @ManyToOne(() => LicenseKeyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'renewed_from_key_id' })
  renewed_from: LicenseKeyEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
