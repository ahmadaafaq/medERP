import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LogbookService } from './logbook.service';
import { CreateLogbookEntryDto, VerifyLogbookEntryDto } from './dto/logbook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('logbook')
@UseGuards(JwtAuthGuard)
export class LogbookController {
  constructor(private readonly logbookService: LogbookService) {}

  @Post('entry')
  async createEntry(@Tenant() tenantSlug: string, @Body() dto: CreateLogbookEntryDto) {
    return this.logbookService.createEntry(tenantSlug, dto);
  }

  @Get('activity-types')
  async getActivityTypes(@Tenant() tenantSlug: string) {
    return this.logbookService.getActivityTypes(tenantSlug);
  }

  @Get('student/:rollno')
  async getStudentEntries(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.logbookService.getStudentEntries(tenantSlug, rollno);
  }

  @Put('entry/:entryId/verify/faculty')
  async verifyFaculty(
    @Tenant() tenantSlug: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: any,
    @Body() dto: VerifyLogbookEntryDto,
  ) {
    return this.logbookService.verifyEntry(tenantSlug, entryId, user.userId, user.role, dto);
  }

  @Get('monthly/department')
  async getMonthlyPgAudit(@Tenant() tenantSlug: string, @Query('rollno') rollno?: string) {
    return this.logbookService.getMonthlyPgAudit(tenantSlug, rollno);
  }
}
