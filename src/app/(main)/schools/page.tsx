import { AppHeader } from "@/components/app-header";
import { SchoolManager } from "@/components/schools/school-manager";
import {
  getCooldownDays,
  getCooldownVisits,
  getSchoolSpots,
  getSchools,
} from "@/lib/data/queries";
import {
  buildSpotList,
  getSpotStatus,
  summarizeByLocation,
  todayInTokyo,
  type SchoolSpotsView,
  type SpotInput,
} from "@/lib/cooldown";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  const [schools, cooldownDaysResult, visitsResult, spotsResult] = await Promise.all([
    getSchools(),
    getCooldownDays(),
    getCooldownVisits(),
    getSchoolSpots(),
  ]);

  // 日数は DB の設定の行からだけ読む。読めなければ null（予備の値は使わない。WO-004 S-4）
  const cooldownDays = cooldownDaysResult.ok ? cooldownDaysResult.days : null;
  // 実績・立ち位置の取得失敗（WO-003 S-8 の文を出す）。日数の失敗とは別に持ち、文を出し分ける
  const spotsLoadFailed = !visitsResult.ok || !spotsResult.ok;

  if (!cooldownDaysResult.ok) {
    console.error("[schools] クールダウン日数の取得に失敗:", cooldownDaysResult.reason);
  }
  // 原因の調査用にサーバーのログへ残す（画面には定型のエラー文だけを出す）
  if (!visitsResult.ok) console.error("[schools] 配布実績の取得に失敗:", visitsResult.reason);
  if (!spotsResult.ok) console.error("[schools] 立ち位置の取得に失敗:", spotsResult.reason);

  // クールダウンの判定はすべてサーバーで行い、画面には学校ごとの並び済みの表示データだけを渡す（WO-003 S-5）。
  // 日数・実績・立ち位置のどれかが読めなければ null（立ち位置の欄を見出しごと出さない。WO-003 S-8・WO-004 前提）。
  let spotsBySchool: Record<string, SchoolSpotsView> | null = null;
  if (cooldownDays !== null && visitsResult.ok && spotsResult.ok) {
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
        cooldownDays
      );
      const list = inputsBySchool.get(location.school_id) ?? [];
      list.push({ id: location.id, spot: location.spot, status });
      inputsBySchool.set(location.school_id, list);
    }

    spotsBySchool = {};
    for (const school of schools) {
      spotsBySchool[school.id] = buildSpotList(inputsBySchool.get(school.id) ?? []);
    }
  }

  return (
    <>
      <AppHeader title="小学校マスタ" subtitle="対象小学校の管理" />
      <main className="px-4 py-4">
        <SchoolManager
          schools={schools}
          cooldownDays={cooldownDays}
          spotsBySchool={spotsBySchool}
          spotsLoadFailed={spotsLoadFailed}
        />
      </main>
    </>
  );
}
