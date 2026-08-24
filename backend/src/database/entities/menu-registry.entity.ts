import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

export enum MenuRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  CLERK = 'CLERK',
  FACULTY = 'FACULTY',
  WARDEN = 'WARDEN',
  STUDENT = 'STUDENT',
}

export enum ApplicableFirmMode {
  MED = 'MED',
  NONMED = 'NONMED',
  BOTH = 'BOTH',
}

@Entity({ name: 'menu_registry', schema: 'public' })
@Unique('uq_menu_registry_role_key', ['role', 'menu_key'])
export class MenuRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MenuRole,
  })
  role: MenuRole;

  @Column({ type: 'varchar', length: 150 })
  menu_key: string;

  @Column({ type: 'varchar', length: 150 })
  menu_label: string;

  @Column({ type: 'varchar', length: 255 })
  route_path: string;

  @Index('idx_menu_registry_parent')
  @Column({ type: 'varchar', length: 150, nullable: true })
  parent_menu_key: string | null;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Index('idx_menu_registry_role_mode')
  @Column({
    type: 'enum',
    enum: ApplicableFirmMode,
    default: ApplicableFirmMode.BOTH,
  })
  applicable_firm_mode: ApplicableFirmMode;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
