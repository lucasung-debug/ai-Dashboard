import api from "@/lib/axios-client";
import type {
  Subscription,
  SubscriptionCreateInput,
  ApiResponse,
} from "@/types";

export const subscriptionApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Subscription[]>>("/api/subscriptions");
    return res.data.data;
  },

  create: async (input: SubscriptionCreateInput) => {
    const res = await api.post<ApiResponse<Subscription>>("/api/subscriptions", input);
    return res.data.data;
  },

  update: async (id: string, input: Partial<SubscriptionCreateInput>) => {
    const res = await api.put<ApiResponse<Subscription>>(`/api/subscriptions/${id}`, input);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<void>>(`/api/subscriptions/${id}`);
    return res.data;
  },

  toggle: async (id: string) => {
    const res = await api.post<ApiResponse<Subscription>>(`/api/subscriptions/${id}/toggle`);
    return res.data.data;
  },
};
