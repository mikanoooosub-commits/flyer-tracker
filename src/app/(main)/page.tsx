import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ListPage() {
  return (
    <>
      <AppHeader title="配布実績一覧" subtitle="チラシ配布の履歴" />
      <main className="px-4 py-4">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            一覧タブ（Phase 3 で実装）
          </CardContent>
        </Card>
      </main>
    </>
  );
}
