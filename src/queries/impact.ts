import { useQuery } from '@tanstack/react-query';
import { getFunderImpact, getInvestorImpact } from '@/lib/api/impact';

export const impactKeys = {
  all: ['impact'] as const,
  funder: () => [...impactKeys.all, 'funder'] as const,
  investor: () => [...impactKeys.all, 'investor'] as const,
};

export function useFunderImpact() {
  return useQuery({ queryKey: impactKeys.funder(), queryFn: getFunderImpact });
}

export function useInvestorImpact() {
  return useQuery({ queryKey: impactKeys.investor(), queryFn: getInvestorImpact });
}
