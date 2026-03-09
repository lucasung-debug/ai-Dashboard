export const CATEGORIES = {
  income: ["급여", "부수입", "투자수익", "이자", "용돈", "기타수입"],
  expense: [
    "식비", "교통", "주거", "통신", "의류", "의료",
    "교육", "문화", "여행", "구독", "보험", "세금",
    "경조사", "생활용품", "반려동물", "기타지출",
  ],
  transfer: ["이체", "저축", "투자"],
} as const;

export const BILLING_CYCLES = [
  { value: "monthly", label: "월간" },
  { value: "yearly", label: "연간" },
  { value: "weekly", label: "주간" },
] as const;

export const SUBSCRIPTION_CATEGORIES = [
  "스트리밍", "AI 서비스", "소프트웨어", "클라우드",
  "뉴스/미디어", "게임", "학습", "헬스", "기타",
] as const;

export const CHART_COLORS = [
  "hsl(152, 60%, 48%)",
  "hsl(200, 70%, 55%)",
  "hsl(35, 92%, 60%)",
  "hsl(280, 60%, 60%)",
  "hsl(0, 72%, 55%)",
  "hsl(180, 50%, 50%)",
  "hsl(60, 70%, 50%)",
  "hsl(320, 60%, 55%)",
] as const;

export const TRANSACTION_TYPE_COLORS = {
  income: "text-gain",
  expense: "text-loss",
  transfer: "text-warning",
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
