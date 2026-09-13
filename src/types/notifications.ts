export const notificationTypes = [
  'INVOICE_ISSUED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_REJECTED',
  'ORDER_STATUS_UPDATED',
  'LISTING_APPROVED',
  'LISTING_REJECTED',
  'FINANCING_UPDATE',
  'FLEET_REQUEST_UPDATE',
  'SYSTEM_ALERT',
  'TASK_ASSIGNED',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type NotificationsFilters = {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
};

/**
 * A task assigned to a colleague with a deadline. Rides on the Notification model on the
 * API (`type: TASK_ASSIGNED`, extra fields in `metadata`) rather than a separate table —
 * see TaskAssignmentMetadata's doc comment in uza-mobility-bn.
 */
export type AppTask = AppNotification & {
  dueAt: string;
  assignedByUserId: string;
  assignedByName: string;
  entityRef?: string;
  completedAt: string | null;
  isOverdue: boolean;
};

