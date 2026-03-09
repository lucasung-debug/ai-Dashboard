import type { Currency } from "@/types";

const CURRENCY_CONFIG: Record<Currency, { locale: string; symbol: string; decimals: number }> = {
  KRW: { locale: "ko-KR", symbol: "₩", decimals: 0 },
  USD: { locale: "en-US", symbol: "$", decimals: 2 },
  JPY: { locale: "ja-JP", symbol: "¥", decimals: 0 },
  EUR: { locale: "de-DE", symbol: "€", decimals: 2 },
};

export function formatCurrency(amount: number, currency: Currency = "KRW"): string {
  const config = CURRENCY_CONFIG[currency];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("ko-KR").format(num);
}

export function formatDate(dateStr: string, format: "short" | "long" | "relative" = "short"): string {
  const date = new Date(dateStr);

  if (format === "relative") {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  }

  if (format === "long") {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatMonth(dateStr: string): string {
  const date = new Date(dateStr + "-01");
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
