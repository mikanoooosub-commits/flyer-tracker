import { AppHeader } from "@/components/app-header";
import { MapView } from "@/components/map/map-view";
import {
  getSchools,
  getLocationsWithSchool,
  getPinStatuses,
  getVisits,
} from "@/lib/data/queries";
import type { Rating } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [schools, locations, pinStatuses, visits] = await Promise.all([
    getSchools(),
    getLocationsWithSchool(),
    getPinStatuses(),
    getVisits({}),
  ]);

  const ratings: Record<string, Rating | null> = {};
  for (const p of pinStatuses) {
    ratings[p.location_id] = p.latest_rating;
  }

  return (
    <>
      <AppHeader title="地図" subtitle="配布場所のピン" />
      <MapView schools={schools} locations={locations} ratings={ratings} visits={visits} />
    </>
  );
}
