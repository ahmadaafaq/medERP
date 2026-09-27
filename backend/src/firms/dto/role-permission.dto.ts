import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { MenuRole } from '../../database/entities/menu-registry.entity';

export class UpdateRolePermissionsDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  @IsEnum(MenuRole)
  @IsNotEmpty()
  role: MenuRole;

  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
          .filter((v: any) => typeof v === 'string')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0)
      : []
  )
  @IsArray()
  @IsString({ each: true })
  menu_keys: string[];
}
