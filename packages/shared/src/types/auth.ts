import type { Role } from '../constants/roles.js';

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  role: Role;
  jti: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    tenantId: string;
  };
  accessToken: string;
}

export interface RegisterRequest {
  tenantName: string;
  tenantSlug: string;
  email: string;
  password: string;
  fullName: string;
}
