import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto, RecordFeePaymentDto } from './dto/fees.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('structure')
  async createStructure(@Tenant() tenantSlug: string, @Body() dto: CreateFeeStructureDto) {
    return this.feesService.createStructure(tenantSlug, dto);
  }

  @Get('structure/:batchId')
  async getStructureByBatch(@Tenant() tenantSlug: string, @Param('batchId') batchId: string) {
    return this.feesService.getStructureByBatch(tenantSlug, batchId);
  }

  @Post('payment')
  async recordPayment(@Tenant() tenantSlug: string, @Body() dto: RecordFeePaymentDto) {
    return this.feesService.recordPayment(tenantSlug, dto);
  }

  @Get(':rollno')
  async getStudentFees(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.feesService.getStudentFees(tenantSlug, rollno);
  }
}
