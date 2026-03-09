import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-6xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground text-lg">페이지를 찾을 수 없습니다</p>
        <Link to="/">
          <Button>대시보드로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
