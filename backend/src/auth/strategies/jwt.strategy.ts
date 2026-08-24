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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Malformed token payload');
    }
    return payload;
  }
}
