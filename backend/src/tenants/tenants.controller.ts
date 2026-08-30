import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantSettingsDto } from './dto/tenant.dto';
import { CleanTenantDto } from './dto/clean-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Tenants (Super Admin)')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants (super-admin only)' })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.tenantsService.findAll(pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/stats')
  @ApiOperation({ summary: 'Get tenant stats (students, faculty, departments, timetables, etc.)' })
  getStats(@Param('slug') slug: string) {
    return this.tenantsService.getTenantStats(slug);
  }

  @Public()
  @Post('clean-data')
  @ApiOperation({ summary: 'Purge dummy / test data tenant-wise or modularly (Super Admin only)' })
  cleanData(@Body() dto: CleanTenantDto) {
    return this.tenantsService.cleanTenantData(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant and provision schema' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant details' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Suspend or reactivate a tenant' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.toggleActive(id);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update tenant settings' })
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TenantSettingsDto,
  ) {
    return this.tenantsService.updateSettings(id, dto);
  }
}
