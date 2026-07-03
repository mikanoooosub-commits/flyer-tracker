import { createClient } from "@/lib/supabase/server";
import type {
  School,
  VisitWithRelations,
  VisitLog,
  LocationPinStatus,
  Location,
} from "@/lib/types";

// サーバーコンポーネントから呼ぶ読み取り関数群（"use server" は付けない）

export type VisitFilters = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  schoolId?: string;
  locationId?: string;
  includeDeleted?: boolean;
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
