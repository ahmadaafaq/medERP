import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentCredentialsService } from './student-credentials.service';
import { SubmitCredentialDto, ReviewCredentialDto } from './dto/student-credentials.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Student Credentials')
@ApiBearerAuth()
@Controller('student-credentials')
@UseGuards(JwtAuthGuard)
export class StudentCredentialsController {
  constructor(private readonly credentialsService: StudentCredentialsService) {}

  private extractUser(req: any): any {
    if (req.user && req.user.role) return req.user;

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let tokenUser: any = null;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          tokenUser = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        }
      } catch {}
    }

    const regNo =
      req.headers?.['x-user-reg-no'] ||
      req.headers?.['x-user-id'] ||
      tokenUser?.registration_no ||
      tokenUser?.username ||
      tokenUser?.rollno ||
      '2025107990';
    const role = (req.headers?.['x-user-role'] || tokenUser?.role || 'STUDENT').toUpperCase();
    const name = req.headers?.['x-user-name'] || tokenUser?.name || 'AAFREEN KHAN';

    return {
      id: tokenUser?.id || tokenUser?.sub,
      registration_no: regNo,
      username: regNo,
      rollno: regNo,
      role,
      name,
    };
  }

  @Post('submit')
  @ApiOperation({ summary: 'Student submits a certificate, skill, or extracurricular activity' })
  async submitCredential(
    @TenantSlug() tenantSlug: string,
    @Body() dto: SubmitCredentialDto,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.credentialsService.submitCredential(tenantSlug, dto, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all submitted credentials for logged-in student' })
  async getMyCredentials(
    @TenantSlug() tenantSlug: string,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.credentialsService.getMyCredentials(tenantSlug, user);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Faculty/Admin gets list of pending submissions to review' })
  async getPendingCredentials(
    @TenantSlug() tenantSlug: string,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.credentialsService.getPendingCredentials(tenantSlug, user);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Faculty/Admin approves or rejects a submitted credential' })
  async reviewCredential(
    @TenantSlug() tenantSlug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewCredentialDto,
    @Request() req: any,
  ) {
    const user = this.extractUser(req);
    return this.credentialsService.reviewCredential(tenantSlug, id, dto, user);
  }

  @Public()
  @Get('student/:regNo/approved')
  @ApiOperation({ summary: 'Public/ERP query for approved credentials for a student' })
  async getApprovedCredentials(
    @TenantSlug() tenantSlug: string,
    @Param('regNo') regNo: string,
  ) {
    return this.credentialsService.getApprovedCredentials(tenantSlug, regNo);
  }
}
