import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmsController } from './firms.controller';
import { MenuRegistryController } from './menu-registry.controller';
import { TenantsThemeController } from './tenants-theme.controller';
import { ThemeStudioController } from './theme-studio.controller';
import { FirmsService } from './firms.service';
import { LicensingService } from './licensing.service';
import { MenuRegistryService } from './menu-registry.service';
import { ThemeStudioService } from './theme-studio.service';
import { FirmEntity } from '../database/entities/firm.entity';
import { LicenseKeyEntity } from '../database/entities/license-key.entity';
import { TransactionEntity } from '../database/entities/transaction.entity';
import { MenuRegistryEntity } from '../database/entities/menu-registry.entity';
import { FirmRolePermissionEntity } from '../database/entities/firm-role-permission.entity';
import { TenantLicenseGuard } from '../common/guards/tenant-license.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FirmEntity,
      LicenseKeyEntity,
      TransactionEntity,
      MenuRegistryEntity,
      FirmRolePermissionEntity,
    ]),
  ],
  controllers: [
    FirmsController,
    MenuRegistryController,
    TenantsThemeController,
    ThemeStudioController,
  ],
  providers: [
    FirmsService,
    LicensingService,
    MenuRegistryService,
    ThemeStudioService,
    TenantLicenseGuard,
  ],
  exports: [
    FirmsService,
    LicensingService,
    MenuRegistryService,
    ThemeStudioService,
    TenantLicenseGuard,
  ],
})
export class FirmsModule {}
