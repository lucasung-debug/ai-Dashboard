import api from "@/lib/axios-client";
import type {
  Transaction,
  TransactionCreateInput,
  DashboardSummary,
  ApiResponse,
  Currency,
} from "@/types";

export const ledgerApi = {
  // Transactions
  getTransactions: async (month: string) => {
    const res = await api.post<ApiResponse<Transaction[]>>("/api/ledger/list", { month });
    return res.data.data;
  },

  addTransaction: async (input: TransactionCreateInput) => {
    const res = await api.post<ApiResponse<Transaction>>("/api/ledger/add", input);
    return res.data.data;
  },

  updateTransaction: async (id: number, input: Partial<TransactionCreateInput>) => {
    const res = await api.put<ApiResponse<Transaction>>(`/api/ledger/${id}`, input);
    return res.data.data;
  },

  deleteTransaction: async (id: number) => {
    const res = await api.delete<ApiResponse<void>>(`/api/ledger/${id}`);
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (month: string, currencies: Currency[] = ["KRW"]) => {
    const res = await api.post<ApiResponse<DashboardSummary>>("/api/ledger/dashboard-summary", {
      month,
      currencies,
    });
    return res.data.data;
  },

  // Excel upload
  uploadExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse<{ count: number; transactions: Transaction[] }>>(
      "/api/ledger/upload-excel",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },
};
