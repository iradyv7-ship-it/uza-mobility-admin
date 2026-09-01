/* eslint-disable @typescript-eslint/no-empty-object-type --
 * Module augmentation. `interface User extends AuthUser {}` is the documented way to
 * merge a declaration into next-auth's own `User`, and the empty body is the whole
 * mechanism: it contributes the extends clause and nothing else. Adding a member to
 * satisfy the rule would change the type. The rule is wrong about this file.
 */
/**
 * NextAuth / Auth.js module augmentation.
 * App code should use `@/types/auth/*`, not `next-auth` types directly.
 * @see https://authjs.dev/getting-started/typescript
 */
import type { AuthUser } from '@/types/auth/session';
import type { MeUser } from '@/types/auth/me-user';
import type { AuthSessionError } from '@/types/auth/session';

type JwtPayload = {
  accessToken: string;
  refreshToken: string;
  user: MeUser;
  accessTokenExpires?: number;
  error?: AuthSessionError;
};

declare module 'next-auth' {
  interface Session {
    user: MeUser;
    accessToken: string;
    refreshToken: string;
    error?: AuthSessionError;
  }

  interface User extends AuthUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends JwtPayload {}
}

declare module '@auth/core/types' {
  interface Session {
    user: MeUser;
    accessToken: string;
    refreshToken: string;
    error?: AuthSessionError;
  }

  interface User extends AuthUser {}
}

declare module '@auth/core/jwt' {
  interface JWT extends JwtPayload {}
}
