import { UserRole } from './roles.types';

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  logoUrl?: string;
  primaryColor?: string;
  isActive: boolean;
  schemaProvisioned: boolean;
  createdAt: string;
}
