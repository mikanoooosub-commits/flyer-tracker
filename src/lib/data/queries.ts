import { createClient } from "@/lib/supabase/server";
import type {
  School,
  VisitWithRelations,
  VisitLog,
  LocationPinStatus,
  Location,
  MapNote,
  CooldownVisit,
  SchoolSpot,
} from "@/lib/types";
import { fetchAllRows, type FetchAllResult } from "@/lib/cooldown";

// サーバーコンポーネントから呼ぶ読み取り関数群（"use server" は付けない）

export type VisitFilters = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  schoolId?: string;
  locationId?: string;
  includeDeleted?: boolean;
  hideZero?: boolean; // count=0 の履歴を除外（null は残す）
};

export async function getSchools(): Promise<School[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as School[];
}

export async function getVisits(filters: VisitFilters = {}): Promise<VisitWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("visits")
    .select("*, location:locations(*, school:schools(*))")
    .order("date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!filters.includeDeleted) query = query.eq("is_deleted", false);
  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  if (filters.locationId) query = query.eq("location_id", filters.locationId);

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as unknown as VisitWithRelations[];

  // 小学校フィルタは埋め込みリソースのため JS 側で適用（データ量が小さい前提）
  if (filters.schoolId) {
    rows = rows.filter((v) => v.location?.school_id === filters.schoolId);
  }
  // 0件（count=0）を隠す。未記入(null)は残す。
  if (filters.hideZero) {
    rows = rows.filter((v) => v.count !== 0);
  }
  return rows;
}

export async function getVisitLogs(visitId: string): Promise<VisitLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visit_logs")
    .select("*")
    .eq("visit_id", visitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VisitLog[];
}

export async function getLocations(): Promise<Location[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Location[];
}

export type LocationWithSchool = Location & { school: School | null };

export async function getLocationById(id: string): Promise<LocationWithSchool | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*, school:schools(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as LocationWithSchool) ?? null;
}

export async function getLocationsWithSchool(): Promise<LocationWithSchool[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*, school:schools(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LocationWithSchool[];
}

export async function getPinStatuses(): Promise<LocationPinStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("location_pin_status").select("*");
  if (error) throw error;
  return (data ?? []) as LocationPinStatus[];
}

// ── クールダウン（WO-003）────────────────────────────────────────────────────
// 件数の上限（Max rows）で黙って欠けないよう、fetchAllRows で全件を取り切る。
// 取り切れなければ { ok: false } を返す（画面側でエラー文を出す。throw してページ全体を止めない）。

const PAGE_SIZE = 1000;

/** 未削除の実績を全件（判定に要る列だけ）。配布数0も非推奨の判定に使うので取る */
export async function getCooldownVisits(): Promise<FetchAllResult<CooldownVisit>> {
  const supabase = await createClient();
  return fetchAllRows<CooldownVisit>(async (from, to) => {
    const { data, count, error } = await supabase
      .from("visits")
      .select("id, location_id, date, start_time, created_at, count, rating", { count: "exact" })
      .eq("is_deleted", false)
      .order("id")
      .range(from, to);
    return { data, count, error };
  }, PAGE_SIZE);
}

/** 小学校が設定されている配布場所（立ち位置）を全件 */
export async function getSchoolSpots(): Promise<FetchAllResult<SchoolSpot>> {
  const supabase = await createClient();
  return fetchAllRows<SchoolSpot>(async (from, to) => {
    const { data, count, error } = await supabase
      .from("locations")
      .select("id, school_id, spot", { count: "exact" })
      .not("school_id", "is", null)
      .order("id")
      .range(from, to);
    return { data, count, error };
  }, PAGE_SIZE);
}

export async function getMapNotes(): Promise<MapNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("map_notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MapNote[];
}
