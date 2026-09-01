'use client';

import type { ElementType } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { NavGroup } from '@/config/navigation';
import { useLogout } from '@/queries/auth';
import { cn } from '@/lib/utils';

type WorkspaceShellProps = {
  children: React.ReactNode;
  navGroups: NavGroup[];
  /** Workspace root path used for exact active matching (e.g. `/admin`, `/seller`). */
  rootHref: string;
  navLoading?: boolean;
  sidebarFooter?: React.ReactNode;
};

export function WorkspaceShell({
  children,
  navGroups,
  rootHref,
  navLoading = false,
  sidebarFooter,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-background">
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:w-64">
        <div className="shrink-0 border-b border-sidebar-border px-4 py-2">
          <Link href="/" className="relative block h-[40px] w-[118px]">
            <Image
              src="/images/FInal-logo-dashboard.png"
              alt="UZA Mobility"
              fill
              className="object-contain object-center"
              sizes="118px"
              priority
            />
          </Link>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-5 p-3">
            {navLoading ? (
              <div className="space-y-2 px-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              navGroups.map((group) => (
                <div key={group.label ?? 'main'}>
                  {group.label ? (
                    <p className="mb-1.5 px-2 text-xs font-medium tracking-wide text-sidebar-foreground/70 uppercase">
                      {group.label}
                    </p>
                  ) : null}
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== rootHref &&
                          pathname.startsWith(`${item.href}/`));

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center rounded-md px-2.5 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                                : 'text-sidebar-foreground/80 hover:bg-primary/10 hover:text-primary',
                            )}
                          >
                            {item.icon ? (
                              <span
                                className={cn(
                                  'mr-2 flex items-center',
                                  isActive
                                    ? 'text-primary-foreground'
                                    : 'text-primary/80',
                                )}
                              >
                                {(() => {
                                  const Icon: ElementType = item.icon;
                                  return <Icon className="size-4" />;
                                })()}
                              </span>
                            ) : null}
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </nav>
        </ScrollArea>

        {sidebarFooter ? (
          <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Log out
            </Button>
          </div>
        ) : null}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-sidebar-border px-4 lg:px-6">
          <div className="text-primary">
            <NotificationBell />
          </div>
          <div className="text-primary">
            <ThemeToggle />
          </div>
          {sidebarFooter ? (
            <div className="ml-3 flex items-center gap-2 text-sm">
              {sidebarFooter}
            </div>
          ) : null}
        </header>
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <div className="mx-auto w-full max-w-none px-4 py-4 lg:px-8 lg:py-6 xl:px-10 2xl:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
