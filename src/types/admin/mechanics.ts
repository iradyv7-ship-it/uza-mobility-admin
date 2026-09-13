export const mechanicEngagements = ['EMPLOYED', 'CERTIFIED'] as const;
export type MechanicEngagement = (typeof mechanicEngagements)[number];

export const mechanicLevels = ['APPRENTICE', 'TECHNICIAN', 'SENIOR', 'MASTER'] as const;
export type MechanicLevel = (typeof mechanicLevels)[number];

export const workCategories = [
  'BRAKES',
  'STEERING',
  'SUSPENSION',
  'TYRES',
  'HIGH_VOLTAGE',
  'BODY',
  'GENERAL',
] as const;
export type WorkCategory = (typeof workCategories)[number];

/** The mechanic-pool display row, as `GET /workshop/mechanics` returns it. */
export type MechanicListRow = {
  id: string;
  name: string;
  grade: MechanicLevel;
  hvCertificateStatus: 'CURRENT' | 'SUSPENDED' | 'EXPIRED' | null;
  hvCertificateExpiresAt: string | null;
};
