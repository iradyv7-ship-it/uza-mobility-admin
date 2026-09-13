import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  UNDER_VERIFICATION: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  PAYMENT_SUBMITTED: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SUBMITTED: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  UNDER_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SENT: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  SENT_TO_BANK: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  AWAITING_PAYMENT: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  QUOTED: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  APPROVED: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  BANK_APPROVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  CONFIRMED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PAYMENT_CONFIRMED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  FULLY_PAID: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PARTIALLY_PAID: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  DELIVERED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ACTIVE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  IN_TRANSIT: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  PROCESSING: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  REJECTED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  BANK_REJECTED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  SUSPENDED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  UNPUBLISHED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  EXPIRED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-muted text-muted-foreground',
  DRAFT: 'bg-muted text-muted-foreground',
  SOLD: 'bg-muted text-muted-foreground',
  // Loan / loan-change-request statuses
  IN_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  DECLINED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  DISBURSED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  IN_ARREARS: 'bg-red-500/15 text-red-700 dark:text-red-400',
  CLOSED: 'bg-muted text-muted-foreground',
  APPLIED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status.replaceAll('_', ' ');

  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-normal capitalize',
        statusStyles[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {label}
    </Badge>
  );
}
