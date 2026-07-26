import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CollegeSetupDto, CompleteProfileDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Tenant() tenantSlug: string, @CurrentUser() user: any) {
    return this.onboardingService.getStatus(tenantSlug, user.userId);
  }

  @Public()
  @Post('college/setup')
  async setupCollege(@Body() dto: CollegeSetupDto) {
    return this.onboardingService.setupCollege(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async completeProfile(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.onboardingService.completeProfile(tenantSlug, user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete')
  async markComplete(@Tenant() tenantSlug: string, @CurrentUser() user: any) {
    return this.onboardingService.markComplete(tenantSlug, user.userId);
  }
}
