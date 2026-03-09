import api from "@/lib/axios-client";
import type { AppSettings, ExchangeRates, ApiResponse } from "@/types";

export const settingsApi = {
  get: async () => {
    const res = await api.get<ApiResponse<AppSettings>>("/api/settings");
    return res.data.data;
  },

  update: async (settings: Partial<AppSettings>) => {
    const res = await api.put<ApiResponse<AppSettings>>("/api/settings", settings);
    return res.data.data;
  },

  getExchangeRates: async () => {
    const res = await api.get<ApiResponse<ExchangeRates>>("/api/exchange-rates");
    return res.data.data;
  },
};
