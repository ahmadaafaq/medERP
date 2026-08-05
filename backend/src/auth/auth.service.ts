import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '../common/enums/role.enum';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, tenantSlug?: string) {
    let user: any;
    let schema: string;

    if (tenantSlug) {
      // Tenant-scoped login: allow email, registration_no, or rollno
      schema = `tenant_${tenantSlug}`;
      const searchIdentifier = dto.email.toLowerCase().trim();
      const rows = await this.ds.query(
        `SELECT u.id, u.email, u.password_hash, u.role, u.is_active, u.must_change_password,
                u.failed_login_count, u.locked_until, u.last_login_at,
                s.registration_no, s.rollno
         FROM "${schema}".users u
         LEFT JOIN "${schema}".students s ON s.user_id = u.id
         WHERE LOWER(u.email) = $1
            OR LOWER(COALESCE(s.registration_no, '')) = $1
            OR LOWER(COALESCE(s.rollno, '')) = $1
         LIMIT 1`,
        [searchIdentifier],
      );
      user = rows[0];
    } else {
      // Super-admin login (public schema)
      const rows = await this.ds.query(
        `SELECT id, email, password_hash, role, is_active, must_change_password,
                failed_login_count, locked_until, last_login_at
         FROM public.super_admins
         WHERE LOWER(email) = $1 LIMIT 1`,
        [dto.email.toLowerCase().trim()],
      );
      user = rows[0];
      schema = 'public';
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email, registration number, or password');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Your account has been deactivated. Contact admin.');
    }

    // Check account lock
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const unlockAt = new Date(user.locked_until).toLocaleTimeString();
      throw new ForbiddenException(`Account locked. Try again after ${unlockAt}`);
    }

    // Verify password
    let isValid = await bcrypt.compare(dto.password, user.password_hash);

    // Fallback: If student logs in using registration_no or rollno as password and bcrypt hash hasn't updated yet
    if (!isValid && user.role === UserRole.STUDENT) {
      const regNo = (user.registration_no || '').toLowerCase().trim();
      const rollNo = (user.rollno || '').toLowerCase().trim();
      const inputPass = dto.password.toLowerCase().trim();

      if ((regNo && inputPass === regNo) || (rollNo && inputPass === rollNo)) {
        isValid = true;
        // Update user.password_hash to bcrypt hash of reg_no
        const newHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        await this.ds.query(
          `UPDATE "${schema}".users SET password_hash = $1 WHERE id = $2`,
          [newHash, user.id],
        );
      }
    }

    if (!isValid) {
      await this.handleFailedLogin(user.id, schema, user.failed_login_count ?? 0);
      throw new UnauthorizedException('Invalid email, registration number, or password');
    }

    // Reset failed attempts on success
    await this.ds.query(
      schema === 'public'
        ? `UPDATE public.super_admins SET failed_login_count=0, locked_until=NULL, last_login_at=NOW() WHERE id=$1`
        : `UPDATE "${schema}".users SET failed_login_count=0, locked_until=NULL, last_login_at=NOW() WHERE id=$1`,
      [user.id],
    );

    // Fetch tenant context
    let tenantId: string | null = null;
    let tenantName: string | null = null;
    if (tenantSlug) {
      const rows = await this.ds.query(
        `SELECT id, name FROM public.tenants WHERE slug=$1 LIMIT 1`,
        [tenantSlug],
      );
      if (rows[0]) {
        tenantId = rows[0].id;
        tenantName = rows[0].name;
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId,
      tenantSlug: tenantSlug ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: this.config.get<string>('jwt.refreshExpiresIn') },
    );

    this.logger.log(`Login: ${user.email} [${user.role}] tenant=${tenantSlug ?? 'superadmin'}`);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.must_change_password,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId,
        tenantSlug: tenantSlug ?? null,
        tenantName,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────────────────────────────────────────
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify(dto.refreshToken) as any;
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Look up user in correct schema
      const tenantSlug = decoded.tenantSlug;
      let user: any;
      if (tenantSlug) {
        const schema = `tenant_${tenantSlug}`;
        const rows = await this.ds.query(
          `SELECT id, email, role, is_active FROM "${schema}".users WHERE id=$1`,
          [decoded.sub],
        );
        user = rows[0];
      } else {
        const rows = await this.ds.query(
          `SELECT id, email, role, is_active FROM public.super_admins WHERE id=$1`,
          [decoded.sub],
        );
        user = rows[0];
      }

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: decoded.tenantId ?? null,
        tenantSlug: tenantSlug ?? null,
      };

      return {
        accessToken: this.jwtService.sign(payload, {
          expiresIn: this.config.get<string>('jwt.expiresIn'),
        }),
        refreshToken: this.jwtService.sign(
          { sub: user.id, type: 'refresh', tenantSlug, tenantId: decoded.tenantId },
          { expiresIn: this.config.get<string>('jwt.refreshExpiresIn') },
        ),
      };
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CHANGE PASSWORD
  // ──────────────────────────────────────────────────────────────────────────
  async changePassword(userId: string, tenantSlug: string | null, dto: ChangePasswordDto) {
    const schema = tenantSlug ? `tenant_${tenantSlug}` : 'public';
    const table = tenantSlug ? `"${schema}".users` : 'public.super_admins';

    const rows = await this.ds.query(
      `SELECT id, password_hash FROM ${table} WHERE id=$1`,
      [userId],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    this.validatePasswordStrength(dto.newPassword);

    const hash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.ds.query(
      `UPDATE ${table} SET password_hash=$1, must_change_password=false, updated_at=NOW() WHERE id=$2`,
      [hash, userId],
    );

    this.logger.log(`Password changed for user ${userId}`);
    return { message: 'Password changed successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ──────────────────────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto, tenantSlug?: string) {
    // Always return success to prevent email enumeration
    const schema = tenantSlug ? `tenant_${tenantSlug}` : 'public';
    const table = tenantSlug ? `"${schema}".users` : 'public.super_admins';

    const rows = await this.ds.query(
      `SELECT id, email FROM ${table} WHERE email=$1`,
      [dto.email.toLowerCase().trim()],
    );

    if (rows[0]) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.ds.query(
        `UPDATE ${table} SET password_reset_token=$1, password_reset_expires=$2 WHERE id=$3`,
        [token, expires, rows[0].id],
      );

      // TODO: Queue email via NotificationService
      this.logger.log(`Password reset token generated for ${dto.email}`);
    }

    return { message: 'If the email is registered, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto, tenantSlug?: string) {
    const schema = tenantSlug ? `tenant_${tenantSlug}` : 'public';
    const table = tenantSlug ? `"${schema}".users` : 'public.super_admins';

    const rows = await this.ds.query(
      `SELECT id FROM ${table}
       WHERE password_reset_token=$1
         AND password_reset_expires > NOW()`,
      [dto.token],
    );

    if (!rows[0]) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    this.validatePasswordStrength(dto.newPassword);

    const hash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.ds.query(
      `UPDATE ${table}
       SET password_hash=$1, must_change_password=false,
           password_reset_token=NULL, password_reset_expires=NULL,
           updated_at=NOW()
       WHERE id=$2`,
      [hash, rows[0].id],
    );

    return { message: 'Password reset successfully. You can now login.' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ME — current user profile
  // ──────────────────────────────────────────────────────────────────────────
  async getMe(payload: JwtPayload) {
    const tenantSlug = payload.tenantSlug;
    const schema = tenantSlug ? `tenant_${tenantSlug}` : 'public';
    const table = tenantSlug ? `"${schema}".users` : 'public.super_admins';

    const rows = await this.ds.query(
      `SELECT id, email, role, is_active, onboarding_completed, must_change_password,
              last_login_at, created_at
       FROM ${table} WHERE id=$1`,
      [payload.sub],
    );

    if (!rows[0]) throw new UnauthorizedException('User not found');

    // Attach profile data (student/faculty row)
    let profile: any = null;
    if (tenantSlug) {
      if (payload.role === UserRole.STUDENT) {
        const pRows = await this.ds.query(
          `SELECT id, rollno, registration_no, name, photo_url, course_cd, batch_cd FROM "${schema}".students WHERE user_id=$1`,
          [payload.sub],
        );
        profile = pRows[0] ?? null;
      } else if ([UserRole.FACULTY, UserRole.HOD, UserRole.CLERK].includes(payload.role)) {
        const pRows = await this.ds.query(
          `SELECT f.id, f.emp_id, f.name, f.photo_url, f.designation, f.department_id, f.subject_id,
                  d.name AS department_name, d.code AS department_code
           FROM "${schema}".faculty f
           LEFT JOIN "${schema}".departments d ON d.id = f.department_id
           WHERE f.user_id=$1`,
          [payload.sub],
        );
        profile = pRows[0] ?? null;
      }
    }

    return { ...rows[0], profile, tenantSlug, tenantId: payload.tenantId };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────────────────
  private async handleFailedLogin(userId: string, schema: string, attempts: number) {
    const newCount = attempts + 1;
    const table = schema === 'public' ? 'public.super_admins' : `"${schema}".users`;

    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await this.ds.query(
        `UPDATE ${table} SET failed_login_count=$1, locked_until=$2 WHERE id=$3`,
        [newCount, lockUntil, userId],
      );
      this.logger.warn(`Account locked: userId=${userId} until ${lockUntil.toISOString()}`);
    } else {
      await this.ds.query(
        `UPDATE ${table} SET failed_login_count=$1 WHERE id=$2`,
        [newCount, userId],
      );
    }
  }

  private validatePasswordStrength(password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
  }

  async hashPassword(raw: string): Promise<string> {
    return bcrypt.hash(raw, BCRYPT_ROUNDS);
  }
}
