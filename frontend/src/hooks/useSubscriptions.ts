import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "@/services/subscriptionApi";
import type { SubscriptionCreateInput } from "@/types";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: subscriptionApi.getAll,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubscriptionCreateInput) => subscriptionApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubscriptionCreateInput> }) =>
      subscriptionApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useToggleSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
