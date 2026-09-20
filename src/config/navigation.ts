import { adminRoutes } from '@/config/routes';
import { ElementType } from 'react';
import {
  Calculator,
  KeyRound,
  Home,
  List,
  Users,
  Tag,
  Wrench,
  ShoppingCart,
  CreditCard,
  FileText,
  DollarSign,
  Truck,
  Zap,
  MapPin,
  Megaphone,
  Leaf,
  User,
  Activity,
  Percent,
  Bell,
  Settings,
  Car,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  /** User must have this permission. */
  permission?: string;
  /** User must have at least one of these permissions. */
  permissions?: string[];
  /** Only visible to super admin (`*` permission). */
  superAdminOnly?: boolean;
  /** Optional icon component to display in sidebars. */
  icon?: ElementType;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

/** Full admin sidebar; filter with `useAdminNav()`. */
export const adminNavGroups: NavGroup[] = [
  {
    items: [
      {
        label: 'Overview',
        href: adminRoutes.root,
        icon: Home,
        superAdminOnly: true,
      },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      {
        label: 'Listings',
        href: adminRoutes.listings,
        icon: List,
        permissions: [
          'listings:approve',
          'listings:reject',
          'listings:delete',
          'listings:create',
          'listings:feature',
        ],
      },
      {
        label: 'Sellers',
        href: adminRoutes.sellers,
        icon: Users,
        permissions: ['sellers:verify', 'sellers:suspend'],
      },
      {
        label: 'Categories',
        href: adminRoutes.categories,
        icon: Tag,
        permissions: ['listings:approve', 'listings:create', 'parts:manage'],
      },
      {
        label: 'Parts',
        href: adminRoutes.parts,
        icon: Wrench,
        permissions: ['parts:manage'],
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        label: 'Orders',
        href: adminRoutes.orders,
        icon: ShoppingCart,
        permissions: ['orders:read', 'orders:update-status'],
      },
      {
        label: 'Payments',
        href: adminRoutes.payments,
        icon: CreditCard,
        permissions: ['payments:verify', 'payments:reject', 'payments:refund'],
      },
      {
        label: 'Bookings',
        href: adminRoutes.bookings,
        icon: Car,
        permissions: ['bookings:manage', 'bookings:verify', 'bookings:reject'],
      },
      {
        label: 'Inquiries',
        href: adminRoutes.inquiries,
        icon: MessageCircle,
        permissions: ['inquiries:read-all', 'inquiries:update-status'],
      },
      {
        label: 'Invoices',
        href: adminRoutes.invoices,
        icon: FileText,
        permissions: ['invoices:read', 'invoices:send', 'invoices:cancel'],
      },
      {
        label: 'Discount sales',
        href: adminRoutes.discountSales,
        icon: Percent,
        permissions: ['invoices:read'],
      },
      {
        label: 'Financing',
        href: adminRoutes.financing,
        icon: DollarSign,
        permissions: ['financing:read', 'financing:send-to-bank'],
      },
      {
        label: 'Twara EV applications',
        href: adminRoutes.fundApplications,
        icon: ClipboardList,
        permissions: ['fund-applications:manage'],
      },
      {
        label: 'Loans',
        href: adminRoutes.loans,
        icon: DollarSign,
        permissions: ['financing:read', 'financing:send-to-bank'],
      },
      {
        label: 'Scenarios',
        href: adminRoutes.scenarios,
        icon: Calculator,
        permissions: ['financing:read', 'financing:send-to-bank'],
      },
      {
        label: 'Tasks',
        href: adminRoutes.tasks,
        icon: ClipboardList,
        permissions: ['financing:read', 'fund-applications:manage'],
      },
      {
        label: 'Impact',
        href: adminRoutes.impact,
        icon: Activity,
        permissions: ['financing:read', 'fund-applications:manage'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Fleet',
        href: adminRoutes.fleet,
        icon: Truck,
        permissions: ['fleet:read', 'fleet:update-status'],
      },
      {
        label: 'Energy',
        href: adminRoutes.energy,
        icon: Zap,
        permissions: ['parts:manage', 'fleet:read', 'fleet:update-status'],
      },
      {
        label: 'Stations',
        href: adminRoutes.stations,
        icon: MapPin,
        permissions: [
          'stations:read-all',
          'stations:approve',
          'stations:reject',
          'stations:suspend',
        ],
      },
      {
        label: 'Garage partners',
        href: adminRoutes.mechanics,
        icon: Wrench,
        permissions: ['fleet:read', 'parts:manage'],
      },
      {
        label: 'Training courses',
        href: adminRoutes.trainingCourses,
        icon: Wrench,
        permissions: ['fleet:read', 'parts:manage'],
      },
      {
        label: 'Promotions',
        href: adminRoutes.promotions,
        icon: Megaphone,
        permissions: ['promotions:create', 'promotions:manage'],
      },
      {
        label: 'Sustainability',
        href: adminRoutes.sustainability,
        icon: Leaf,
        permissions: ['sustainability:read', 'sustainability:manage'],
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        label: 'Users',
        href: adminRoutes.users,
        icon: Users,
        superAdminOnly: true,
      },
      {
        label: 'Staff access',
        href: adminRoutes.staffAccess,
        icon: KeyRound,
        superAdminOnly: true,
      },
      {
        label: 'Activity logs',
        href: adminRoutes.activityLogs,
        icon: Activity,
        superAdminOnly: true,
      },
      {
        label: 'Pricing rules',
        href: adminRoutes.pricingRules,
        icon: Percent,
        superAdminOnly: true,
      },
      {
        label: 'Platform settings',
        href: adminRoutes.platformSettings,
        icon: Settings,
        permissions: ['platform-settings:manage'],
      },
      {
        label: 'Profile',
        href: adminRoutes.settings,
        icon: User,
      },
      {
        label: 'Notifications',
        href: adminRoutes.notifications,
        icon: Bell,
      },
    ],
  },
];
