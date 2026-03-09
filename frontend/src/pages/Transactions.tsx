import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Transactions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">거래 내역</h2>
        <p className="text-muted-foreground text-sm mt-1">모든 수입, 지출, 이체 기록</p>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">거래 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm text-center py-12">
            거래 관리 페이지 (Phase 2에서 구현)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
