import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CollegeSetupDto, CompleteProfileDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async getStatus(tenantSlug: string, userId: string) {
    const users = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id, email, role, onboarding_completed, onboarding_step FROM users WHERE id = $1`,
      [userId],
    );

    if (!users.length) {
      throw new NotFoundException('User not found');
    }

    const user = users[0];
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      completed: user.onboarding_completed,
      step: user.onboarding_step,
    };
  }

  async setupCollege(dto: CollegeSetupDto) {
    this.logger.log(`Setting up college tenant: ${dto.slug}`);
    await this.tenantSchemaService.provisionSchema(dto.slug);
    return {
      message: 'College setup and schema provisioned successfully',
      slug: dto.slug,
    };
  }

  async completeProfile(tenantSlug: string, userId: string, dto: CompleteProfileDto) {
    const users = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id, role FROM users WHERE id = $1`,
      [userId],
    );

    if (!users.length) {
      throw new NotFoundException('User not found');
    }

    const role = users[0].role;

    if (role === 'STUDENT') {
      await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `UPDATE students SET phone = COALESCE($1, phone), photo_url = COALESCE($2, photo_url), address = COALESCE($3, address), emergency_contact = COALESCE($4, emergency_contact), updated_at = NOW() WHERE user_id = $5`,
        [dto.phone, dto.photoUrl, dto.address, dto.emergencyContact, userId],
      );
    } else if (role === 'FACULTY' || role === 'HOD') {
      await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `UPDATE faculty SET phone = COALESCE($1, phone), photo_url = COALESCE($2, photo_url), designation = COALESCE($3, designation), specialization = COALESCE($4, specialization), updated_at = NOW() WHERE user_id = $5`,
        [dto.phone, dto.photoUrl, dto.designation, dto.specialization, userId],
      );
    }

    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE users SET onboarding_step = onboarding_step + 1, updated_at = NOW() WHERE id = $1`,
      [userId],
    );

    return { message: 'Profile updated successfully' };
  }

  async markComplete(tenantSlug: string, userId: string) {
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE users SET onboarding_completed = true, onboarding_step = 5, updated_at = NOW() WHERE id = $1`,
      [userId],
    );
    return { message: 'Onboarding completed successfully' };
  }
}
