import { AppHeader } from "@/components/app-header";
import { SchoolManager } from "@/components/schools/school-manager";
import { getCooldownVisits, getSchoolSpots, getSchools } from "@/lib/data/queries";
import {
  COOLDOWN_DAYS,
  buildSpotList,
  getSpotStatus,
  summarizeByLocation,
  todayInTokyo,
  type SchoolSpotsView,
  type SpotInput,
} from "@/lib/cooldown";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  const [schools, visitsResult, spotsResult] = await Promise.all([
    getSchools(),
    getCooldownVisits(),
    getSchoolSpots(),
  ]);

  // クールダウンの判定はすべてサーバーで行い、画面には学校ごとの並び済みの表示データだけを渡す（WO-003 S-5）。
  // 実績・立ち位置のどちらかが取り切れなければ null（画面はエラー文を出し、立ち位置の欄を出さない。S-8）。
  let spotsBySchool: Record<string, SchoolSpotsView> | null = null;
  if (visitsResult.ok && spotsResult.ok) {
    const today = todayInTokyo(new Date());
    const latestByLocation = summarizeByLocation(visitsResult.rows);

    const inputsBySchool = new Map<string, SpotInput[]>();
    for (const location of spotsResult.rows) {
      if (location.school_id === null) continue;
      const latest = latestByLocation.get(location.id);
      const status = getSpotStatus(
        latest?.latestVisit ?? null,
        latest?.latestCounted ?? null,
        today,
        COOLDOWN_DAYS
      );
      const list = inputsBySchool.get(location.school_id) ?? [];
      list.push({ id: location.id, spot: location.spot, status });
      inputsBySchool.set(location.school_id, list);
    }

    spotsBySchool = {};
    for (const school of schools) {
      spotsBySchool[school.id] = buildSpotList(inputsBySchool.get(school.id) ?? []);
    }
  } else {
    // 原因の調査用にサーバーのログへ残す（画面には定型のエラー文だけを出す）
    if (!visitsResult.ok) console.error("[schools] 配布実績の取得に失敗:", visitsResult.reason);
    if (!spotsResult.ok) console.error("[schools] 立ち位置の取得に失敗:", spotsResult.reason);
  }

  return (
    <>
      <AppHeader title="小学校マスタ" subtitle="対象小学校の管理" />
      <main className="px-4 py-4">
        <SchoolManager schools={schools} spotsBySchool={spotsBySchool} />
      </main>
    </>
  );
}
