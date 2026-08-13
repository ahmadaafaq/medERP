import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  UserQueryDto,
  CreateUserDto,
} from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantSlug } from '../common/decorators/tenant.decorator';
import { UserRole } from '../common/enums/role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email, username, emp ID, or registration number' })
  @ApiResponse({ status: 200, description: 'User authenticated successfully, JWT tokens issued.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked.' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const tenantSlug = req.tenant?.slug;
    return this.authService.login(dto, tenantSlug);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token and refresh token generated.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Reset password link dispatched if email exists.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, req.tenant?.slug);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using email token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, req.tenant?.slug);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password (requires current password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Incorrect current password or weak new password.' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, user.tenantSlug, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user payload and profile details.' })
  async getMe(
    @CurrentUser() user: JwtPayload,
    @TenantSlug() tenantSlug: string,
  ) {
    return this.authService.getMe(user, tenantSlug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN, UserRole.HOD)
  @Get('users')
  @ApiOperation({ summary: 'Get paginated, searchable, sorted list of system users' })
  @ApiResponse({ status: 200, description: 'Returns paginated user list.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires Admin or HOD role.' })
  async getUsers(
    @Query() query: UserQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.getUsers(query, user.tenantSlug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN)
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user with role profile (Transactional)' })
  @ApiResponse({ status: 201, description: 'User and linked profile created successfully.' })
  @ApiResponse({ status: 400, description: 'User with email already exists or invalid data.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires Admin role.' })
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.createUser(dto, user.tenantSlug);
  }
}

