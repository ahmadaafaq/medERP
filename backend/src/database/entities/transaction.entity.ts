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
import { LicenseKeyEntity } from './license-key.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'transactions', schema: 'public' })
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_transactions_firm_id')
  @Column({ type: 'uuid' })
  firm_id: string;

  @ManyToOne(() => FirmEntity, (firm) => firm.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'firm_id' })
  firm: FirmEntity;

  @Column({ type: 'uuid', nullable: true })
  license_key_id: string | null;

  @ManyToOne(() => LicenseKeyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'license_key_id' })
  license_key: LicenseKeyEntity | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 100 })
  payment_method: string;

  @Index('idx_transactions_ref')
  @Column({ type: 'varchar', length: 255 })
  transaction_ref: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
