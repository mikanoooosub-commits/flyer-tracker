import { AppHeader } from "@/components/app-header";
import { VisitListView } from "@/components/visits/visit-list-view";
import { getSchools, getVisits, getLocationById } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  school?: string;
  location?: string;
  deleted?: string;
}>;

export default async function ListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = {
    from: sp.from ?? "",
    to: sp.to ?? "",
    schoolId: sp.school ?? "",
    locationId: sp.location ?? "",
    includeDeleted: sp.deleted === "1",
  };

  const [schools, visits, activeLocation] = await Promise.all([
    getSchools(),
    getVisits({
      from: filters.from || undefined,
      to: filters.to || undefined,
      schoolId: filters.schoolId || undefined,
      locationId: filters.locationId || undefined,
      includeDeleted: filters.includeDeleted,
    }),
    filters.locationId ? getLocationById(filters.locationId) : Promise.resolve(null),
  ]);

  return (
    <>
      <AppHeader title="配布実績一覧" subtitle="チラシ配布の履歴" />
      <main className="px-4 py-4">
        <VisitListView
          schools={schools}
          visits={visits}
          filters={filters}
          activeLocation={activeLocation}
        />
      </main>
    </>
  );
}
