'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { AuthFieldError } from '@/components/auth/auth-field-error';
import { AuthFormCard } from '@/components/auth/auth-form-card';
import { AuthFormMessage } from '@/components/auth/auth-form-message';
import { AuthPageHeader } from '@/components/auth/auth-page-header';
import { AuthPasswordInput } from '@/components/auth/auth-password-input';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import {
  authFieldClassName,
  authFooterLinkClassName,
  authInputClassName,
  authLabelClassName,
} from '@/components/auth/auth-styles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { useLogin, useVerifyLogin } from '@/queries/auth';
import type { AdminLoginChallenge } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api';
import { authRoutes } from '@/config/routes';
import { signOutClient } from '@/lib/auth/sign-out-client';
import { useAppRouter } from '@/lib/navigation/use-app-router';

export function Login() {
  const login = useLogin();
  const verify = useVerifyLogin();
  const [challenge, setChallenge] = useState<AdminLoginChallenge | null>(null);
  const [code, setCode] = useState('');
  const { status } = useSession();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useAppRouter();
  const signOutStarted = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const shouldClearSession = searchParams.get('signout') === '1';

  useEffect(() => {
    if (
      !shouldClearSession ||
      status !== 'authenticated' ||
      signOutStarted.current
    ) {
      return;
    }

    signOutStarted.current = true;
    void (async () => {
      await signOutClient({ queryClient, redirect: false });
      router.replace(authRoutes.login);
      router.refresh();
    })();
  }, [queryClient, router, shouldClearSession, status]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const { errors } = useFormState({ control: form.control });

  const rootMessage =
    errors.root?.message ??
    (login.isError
      ? login.error instanceof ApiClientError
        ? login.error.message
        : 'Unable to sign in. Please try again.'
      : verify.isError
        ? verify.error instanceof ApiClientError
          ? verify.error.message
          : 'Unable to verify the code. Please try again.'
        : null);

  useEffect(() => {
    if (rootMessage) {
      errorRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [rootMessage]);

  const onSubmit = form.handleSubmit((values) => {
    form.clearErrors('root');
    login.reset();
    login.mutate(values, {
      onSuccess: (ch) => {
        setChallenge(ch);
        setCode(ch.devCode ?? '');
      },
      onError: (error) => {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Unable to sign in. Please try again.';
        form.setError('root', { message });
      },
    });
  });

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    verify.reset();
    const { email, password } = form.getValues();
    verify.mutate({ challengeId: challenge.challengeId, code, email, password });
  };

  if (challenge) {
    return (
      <AuthFormCard>
        <div className="space-y-4">
          <AuthPageHeader
            title="Enter your sign-in code"
            description={`A six-digit code was sent to ${challenge.deliveredTo}. It expires in 10 minutes.`}
          />
          <form onSubmit={onVerify} className="space-y-3">
            <div className={authFieldClassName}>
              <Label htmlFor="otp" className={authLabelClassName}>
                One-time code
              </Label>
              <Input
                id="otp"
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={16}
                placeholder="000000"
                className={`${authInputClassName} text-center text-2xl tracking-[0.4em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 16))}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Mailbox unreachable? A super admin can read you a one-time recovery code (R-…); enter it here instead.
              </p>
              {challenge.devCode ? (
                <p className="text-xs text-amber-700">
                  Mail is off on this server; the code was pre-filled for development.
                </p>
              ) : null}
            </div>
            {rootMessage ? (
              <div ref={errorRef}>
                <AuthFormMessage variant="error" message={rootMessage} />
              </div>
            ) : null}
            <AuthPrimaryButton type="submit" disabled={verify.isPending || code.length < 6}>
              {verify.isPending ? 'Verifying…' : 'Continue'}
            </AuthPrimaryButton>
            <button
              type="button"
              className="w-full text-xs text-[#356769] hover:text-[#174438]"
              onClick={() => {
                setChallenge(null);
                setCode('');
                verify.reset();
                login.reset();
              }}
            >
              Start again
            </button>
          </form>
          <p className={authFooterLinkClassName}>
            A password alone never opens the admin panel. If you did not try to sign in, change your password now.
          </p>
        </div>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard>
      <div className="space-y-4">
        <AuthPageHeader
          title="Welcome back"
          description="Log in to access the admin dashboard"
        />

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2.5">
            <div className={authFieldClassName}>
              <Label htmlFor="email" className={authLabelClassName}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className={authInputClassName}
                aria-invalid={Boolean(errors.email)}
                {...form.register('email')}
              />
              <AuthFieldError message={errors.email?.message} />
            </div>

            <div className={authFieldClassName}>
              <Label htmlFor="password" className={authLabelClassName}>
                Password
              </Label>
              <AuthPasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter password"
                aria-invalid={Boolean(errors.password)}
                {...form.register('password')}
              />
              <AuthFieldError message={errors.password?.message} />
            </div>

            <div className="flex justify-end">
              <Link
                href={authRoutes.forgotPassword}
                className="text-xs text-[#356769] hover:text-[#174438] sm:text-sm"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {rootMessage ? (
            <div ref={errorRef}>
              <AuthFormMessage variant="error" message={rootMessage} />
            </div>
          ) : null}

          <AuthPrimaryButton type="submit" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </AuthPrimaryButton>
        </form>

        <p className={authFooterLinkClassName}>
          Staff access only. Contact your administrator if you need an account.
        </p>
      </div>
    </AuthFormCard>
  );
}
