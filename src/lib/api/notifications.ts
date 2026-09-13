import {
  authenticatedFetch,
  authenticatedPaginatedFetch,
} from '@/lib/api/authenticated';
import { toSearchParams } from '@/lib/api/query-params';
import type {
  AppNotification,
  AppTask,
  NotificationsFilters,
} from '@/types/notifications';
import type { AssignTaskInput } from '@/schemas/tasks';

export function getNotifications(
  filters: NotificationsFilters = {},
  accessToken?: string,
) {
  return authenticatedPaginatedFetch<AppNotification>('/notifications', {
    searchParams: toSearchParams({
      ...filters,
      unreadOnly: filters.unreadOnly ? 'true' : undefined,
    }),
    token: accessToken,
  });
}

export function getUnreadNotificationCount(accessToken?: string) {
  return authenticatedFetch<{ unreadCount: number }>(
    '/notifications/unread-count',
    { token: accessToken },
  );
}

export function markNotificationRead(id: string, accessToken?: string) {
  return authenticatedFetch<AppNotification>(`/notifications/${id}/read`, {
    method: 'PATCH',
    token: accessToken,
  });
}

export function markAllNotificationsRead(accessToken?: string) {
  return authenticatedFetch<{ markedCount: number }>(
    '/notifications/read-all',
    { method: 'PATCH', token: accessToken },
  );
}

/** My own task box, soonest deadline first. */
export function getMyTasks(includeCompleted = false, accessToken?: string) {
  return authenticatedFetch<AppTask[]>(
    `/notifications/tasks?includeCompleted=${includeCompleted}`,
    { token: accessToken },
  );
}

export function completeTask(id: string, accessToken?: string) {
  return authenticatedFetch<AppNotification>(
    `/notifications/tasks/${id}/complete`,
    { method: 'PATCH', token: accessToken },
  );
}

/** Assign a task with a deadline to a named colleague. Staff-only on the API. */
export function assignTask(body: AssignTaskInput) {
  return authenticatedFetch<AppNotification>('/admin/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
