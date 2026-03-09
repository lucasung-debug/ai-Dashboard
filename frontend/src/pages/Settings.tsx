import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import type { Currency } from "@/types";

const CURRENCIES: Currency[] = ["KRW", "USD", "JPY", "EUR"];

export default function Settings() {
  const { theme, toggleTheme, currency, setCurrency } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">설정</h2>
        <p className="text-muted-foreground text-sm mt-1">앱 환경 설정</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">테마</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => theme !== "dark" && toggleTheme()}
              >
                다크 모드
              </Button>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => theme !== "light" && toggleTheme()}
              >
                라이트 모드
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">통화</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {CURRENCIES.map((c) => (
                <Button
                  key={c}
                  variant={currency === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
