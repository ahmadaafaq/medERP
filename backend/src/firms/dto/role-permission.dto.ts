import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MenuRole } from '../../database/entities/menu-registry.entity';

export class UpdateRolePermissionsDto {
  @IsEnum(MenuRole)
  @IsNotEmpty()
  role: MenuRole;

  @IsArray()
  @IsString({ each: true })
  menu_keys: string[];
}
