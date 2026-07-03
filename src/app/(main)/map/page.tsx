import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";

export default function MapPage() {
  return (
    <>
      <AppHeader title="地図" subtitle="配布場所のピン" />
      <main className="px-4 py-4">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            地図タブ（Phase 4 で実装）
          </CardContent>
        </Card>
      </main>
    </>
  );
}
