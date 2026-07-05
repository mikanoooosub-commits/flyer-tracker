import { AppHeader } from "@/components/app-header";
import { MapView } from "@/components/map/map-view";
import { RegisterDialog } from "@/components/register-dialog";
import {
  getSchools,
  getLocationsWithSchool,
  getPinStatuses,
  getVisits,
  getMapNotes,
} from "@/lib/data/queries";
import type { Rating } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MapHomePage() {
  const [schools, locations, pinStatuses, visits, notes] = await Promise.all([
    getSchools(),
    getLocationsWithSchool(),
    getPinStatuses(),
    getVisits({}),
    getMapNotes(),
  ]);

  const ratings: Record<string, Rating | null> = {};
  for (const p of pinStatuses) {
    ratings[p.location_id] = p.latest_rating;
  }

  return (
    <>
      <AppHeader title="地図" subtitle="配布場所のピン・メモ" />
      <div className="px-4 pt-3 pb-2">
        <RegisterDialog schools={schools} />
      </div>
      <MapView
        schools={schools}
        locations={locations}
        ratings={ratings}
        visits={visits}
        notes={notes}
      />
    </>
  );
}
