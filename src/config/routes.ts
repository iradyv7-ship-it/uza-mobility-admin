export const authRoutes = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  checkEmail: '/check-email',
} as const;

export const workspaceRoutes = {
  admin: '/admin',
} as const;

export const adminRoutes = {
  root: '/admin',
  listings: '/admin/listings',
  categories: '/admin/categories',
  parts: '/admin/parts',
  sellers: '/admin/sellers',
  orders: '/admin/orders',
  payments: '/admin/payments',
  bookings: '/admin/bookings',
  inquiries: '/admin/inquiries',
  invoices: '/admin/invoices',
  financing: '/admin/financing',
  fundApplications: '/admin/fund-applications',
  loans: '/admin/loans',
  scenarios: '/admin/scenarios',
  tasks: '/admin/tasks',
  mechanics: '/admin/mechanics',
  trainingCourses: '/admin/training-courses',
  impact: '/admin/impact',
  stations: '/admin/stations',
  fleet: '/admin/fleet',
  energy: '/admin/energy',
  promotions: '/admin/promotions',
  sustainability: '/admin/sustainability',
  users: '/admin/users',
  staffAccess: '/admin/staff-access',
  activityLogs: '/admin/activity-logs',
  pricingRules: '/admin/pricing-rules',
  discountSales: '/admin/discount-sales',
  platformSettings: '/admin/platform-settings',
  settings: '/admin/settings',
  notifications: '/admin/notifications',
} as const;

export const publicOnlyAuthPaths = [
  authRoutes.login,
  authRoutes.register,
  authRoutes.forgotPassword,
  authRoutes.checkEmail,
] as const;

export const protectedWorkspacePrefixes = [workspaceRoutes.admin] as const;
