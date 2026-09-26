import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../common/enums/role.enum';

export interface JwtPayload {
  sub: string;          // user UUID
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  colgCd?: string | null;
  collegeName?: string | null;
  usr_id?: string | null;
  devicecd?: number | string | null;
  emp_id?: string | null;
  loc_cd?: number | null;
  department?: string | null;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private config: ConfigService) {
    const jwtSecret =
      config.get<string>('jwt.secret') ||
      process.env.JWT_SECRET ||
      'change_me_to_a_super_long_random_string_at_least_64_chars';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          let token = null;
          if (req && req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
          }
          if (!token && req && req.headers && req.headers.cookie) {
            const match = req.headers.cookie.match(/auth_token=([^;]+)/);
            if (match) token = match[1];
          }
          if (!token && req && req.query && req.query.token) {
            token = req.query.token;
          }
          return token;
        },
      ]),
      ignoreExpiration: true, // Prevents session disruptions during active attendance marking
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Malformed token payload');
    }
    return payload;
  }
}
