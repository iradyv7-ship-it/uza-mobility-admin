import { apiFetch } from './api';
import type { AuthTokens } from '@/types/auth/auth-tokens';
import type { MeUser } from '@/types/auth/me-user';
import type { LoginInput } from '@/schemas/auth';
import type { RegisterInput } from '@/schemas/auth';

/** Step one: password. The API answers with a challenge, never with tokens. */
export type AdminLoginChallenge = {
  challengeId: string;
  otpRequired: true;
  expiresAt: string;
  deliveredTo: string;
  delivered: 'email' | 'log';
  /** Only outside production, and only when mail is off. */
  devCode?: string;
};

export function login(input: LoginInput) {
  return apiFetch<AdminLoginChallenge>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Step two: the one-time code from the email, in exchange for tokens. */
export function verifyLogin(input: { challengeId: string; code: string }) {
  return apiFetch<AuthTokens>('/auth/admin/login/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type RegisterResponse = {
  message: string;
  email: string;
};

export function register(input: RegisterInput) {
  const payload = {
    ...input,
    phone: input.phone?.trim() ? input.phone.trim() : undefined,
  };

  return apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout(refreshToken: string) {
  await apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
    token: refreshToken,
  });
}

export function refresh(refreshToken: string) {
  return apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    token: refreshToken,
  });
}

/** Profile for a given access token (server / authorize). */
export function getMe(accessToken: string) {
  return apiFetch<MeUser>('/auth/me', { token: accessToken });
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: { token: string; password: string }) {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function resendVerificationByEmail(email: string) {
  return apiFetch<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
