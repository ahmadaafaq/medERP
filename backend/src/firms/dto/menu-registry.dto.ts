import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicableFirmMode, MenuRole } from '../../database/entities/menu-registry.entity';

export class QueryMenuRegistryDto {
  @IsEnum(MenuRole)
  @IsOptional()
  role?: MenuRole;

  @IsEnum(ApplicableFirmMode)
  @IsOptional()
  firm_mode?: ApplicableFirmMode;
}

export class MenuManifestItemDto {
  @IsEnum(MenuRole)
  @IsNotEmpty()
  role: MenuRole;

  @IsString()
  @IsNotEmpty()
  menu_key: string;

  @IsString()
  @IsNotEmpty()
  menu_label: string;

  @IsString()
  @IsNotEmpty()
  route_path: string;

  @IsString()
  @IsOptional()
  parent_menu_key?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsEnum(ApplicableFirmMode)
  @IsOptional()
  applicable_firm_mode?: ApplicableFirmMode;
}

export class SeedMenuRegistryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuManifestItemDto)
  items: MenuManifestItemDto[];
}
