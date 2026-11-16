import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { MenuRegistryService } from './menu-registry.service';
import { FirmsService } from './firms.service';
import { QueryMenuRegistryDto, SeedMenuRegistryDto } from './dto/menu-registry.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';

@Controller('menu-registry')
export class MenuRegistryController {
  constructor(
    private readonly menuRegistryService: MenuRegistryService,
    private readonly firmsService: FirmsService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Public() // Can be queried by UI wizard and setup flows
  async getMenuRegistry(@Query() query: QueryMenuRegistryDto) {
    return await this.menuRegistryService.getRegistry(query.role, query.firm_mode);
  }

  @Post('seed')
  @Public()
  @HttpCode(HttpStatus.OK)
  async seedMenuRegistry(@Body() dto?: SeedMenuRegistryDto) {
    const result = dto?.items && dto.items.length > 0
      ? await this.menuRegistryService.seedManifest(dto.items)
      : await this.menuRegistryService.seedFromFile();
    this.firmsService.clearPermissionsCache();
    return result;
  }
}
