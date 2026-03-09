import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">구독 & 고정비</h2>
        <p className="text-muted-foreground text-sm mt-1">월별 구독 및 고정 비용 관리</p>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">구독 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm text-center py-12">
            구독 관리 페이지 (Phase 2에서 구현)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
