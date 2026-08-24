import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetableSlotDto, UpdateTimetableSlotDto } from './dto/timetable.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantSlug } from '../common/decorators/tenant.decorator';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all timetable slots with filters' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'dayOfWeek', required: false })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'sessionId', required: false })
  async listSlots(
    @TenantSlug() tenantSlug: string,
    @Query('departmentId') departmentId?: string,
    @Query('batchId') batchId?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('facultyId') facultyId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('courseId') courseId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const day = dayOfWeek !== undefined && dayOfWeek !== '' ? parseInt(dayOfWeek, 10) : undefined;
    const data = await this.timetableService.listSlots(tenantSlug, { departmentId, batchId, dayOfWeek: day, facultyId, subjectId, courseId, sessionId });
    return { success: true, data };
  }

  @Public()
  @Get('student-schedule')
  @ApiOperation({ summary: 'Get current active lecture and weekly schedule for student portal' })
  @ApiQuery({ name: 'batchId', required: false })
  async getStudentSchedule(
    @TenantSlug() tenantSlug: string,
    @Query('batchId') batchId?: string,
  ) {
    const data = await this.timetableService.getStudentSchedule(tenantSlug, batchId);
    return { success: true, data };
  }

  @Public()
  @Get('relevant-faculties')
  @ApiOperation({ summary: 'List relevant faculties (department + linked via Subject Linker)' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  async getRelevantFaculties(
    @TenantSlug() tenantSlug: string,
    @Query('subjectId') subjectId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const data = await this.timetableService.getRelevantFaculties(tenantSlug, subjectId, departmentId);
    return { success: true, data };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new timetable slot' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async createSlot(
    @TenantSlug() tenantSlug: string,
    @Body() dto: CreateTimetableSlotDto,
  ) {
    const data = await this.timetableService.createSlot(tenantSlug, dto);
    return { success: true, data, message: 'Timetable slot created successfully' };
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Update a timetable slot' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async updateSlot(
    @TenantSlug() tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateTimetableSlotDto,
  ) {
    const data = await this.timetableService.updateSlot(tenantSlug, id, dto);
    return { success: true, data, message: 'Timetable slot updated successfully' };
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a timetable slot' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLEGE_ADMIN)
  async deleteSlot(
    @TenantSlug() tenantSlug: string,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteSlot(tenantSlug, id);
  }
}
