import { Wallet, TrendingUp, PiggyBank, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatMonth } from "@/utils/formatters";

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "gain" | "loss" | "neutral";
  icon: React.ElementType;
  isLoading?: boolean;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold font-heading">{value}</p>
            <p
              className={`text-xs mt-1 ${
                changeType === "gain"
                  ? "text-gain"
                  : changeType === "loss"
                    ? "text-loss"
                    : "text-muted-foreground"
              }`}
            >
              {change}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const { currentMonth, goToPreviousMonth, goToNextMonth, goToCurrentMonth, currency } =
    useAppStore();

  const summary = data?.summary;
  const balance = (summary?.monthly_income ?? 0) - (summary?.monthly_expense ?? 0);

  return (
    <div className="space-y-6">
      {/* Header + Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Financial Overview</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {formatMonth(currentMonth)} · All accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
            오늘
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 자산"
          value={formatCurrency(summary?.total_assets ?? 0, currency)}
          change="이번 달 기준"
          changeType="neutral"
          icon={Wallet}
          isLoading={isLoading}
        />
        <StatCard
          title="이달 수입"
          value={formatCurrency(summary?.monthly_income ?? 0, currency)}
          change={`${formatMonth(currentMonth)} 수입`}
          changeType="gain"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="이달 저축"
          value={formatCurrency(balance, currency)}
          change={
            balance >= 0
              ? `+${formatCurrency(balance, currency)} 흑자`
              : `${formatCurrency(balance, currency)} 적자`
          }
          changeType={balance >= 0 ? "gain" : "loss"}
          icon={PiggyBank}
          isLoading={isLoading}
        />
        <StatCard
          title="이달 지출"
          value={formatCurrency(summary?.monthly_expense ?? 0, currency)}
          change={`고정비 ${formatCurrency(summary?.fixed_costs_total ?? 0, currency)}`}
          changeType="loss"
          icon={CreditCard}
          isLoading={isLoading}
        />
      </div>

      {/* Charts - placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 glass-card">
          <CardHeader>
            <CardTitle className="text-base">일별 지출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              차트 영역 (Phase 2에서 구현)
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="text-base">카테고리별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              차트 영역 (Phase 2에서 구현)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List + Budget placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">최근 거래</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm text-center py-8">
                거래 목록 (Phase 2에서 구현)
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">예산 추적</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm text-center py-8">
              예산 추적 (Phase 2에서 구현)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
