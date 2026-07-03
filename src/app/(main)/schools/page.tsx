import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SchoolsPage() {
  return (
    <>
      <AppHeader title="小学校マスタ" subtitle="対象小学校の管理" />
      <main className="px-4 py-4">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            小学校マスタ管理（Phase 5 で実装）
          </CardContent>
        </Card>
      </main>
    </>
  );
}
