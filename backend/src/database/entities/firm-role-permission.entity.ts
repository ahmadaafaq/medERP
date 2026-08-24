import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { FirmEntity } from './firm.entity';
import { MenuRole } from './menu-registry.entity';

@Entity({ name: 'firm_role_permissions', schema: 'public' })
@Unique('uq_firm_role_permissions', ['firm_id', 'role', 'menu_key'])
export class FirmRolePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_firm_role_perm_firm_id')
  @Column({ type: 'uuid' })
  firm_id: string;

  @ManyToOne(() => FirmEntity, (firm) => firm.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'firm_id' })
  firm: FirmEntity;

  @Column({
    type: 'enum',
    enum: MenuRole,
  })
  role: MenuRole;

  @Column({ type: 'varchar', length: 150 })
  menu_key: string;

  @Column({ type: 'boolean', default: false })
  is_enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
