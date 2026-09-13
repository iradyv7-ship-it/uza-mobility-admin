import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api/error';
import { listMechanics, registerMechanic } from '@/lib/api/mechanics';
import type { RegisterMechanicInput } from '@/schemas/mechanics';

export const mechanicKeys = {
  all: ['mechanics'] as const,
  list: () => [...mechanicKeys.all, 'list'] as const,
};

export function useMechanics() {
  return useQuery({
    queryKey: mechanicKeys.list(),
    queryFn: listMechanics,
  });
}

export function useRegisterMechanic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterMechanicInput) => registerMechanic(body),
    onSuccess: () => {
      toast.success('Garage partner registered');
      void queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : 'Failed to register the partner',
      ),
  });
}
