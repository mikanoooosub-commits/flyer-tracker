"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisitRow } from "@/components/visits/visit-row";
import { VisitForm } from "@/components/visits/visit-form";
import { createVisitAction } from "@/lib/data/actions";
import type { School, VisitWithRelations } from "@/lib/types";

type Props = {
  schools: School[];
  visits: VisitWithRelations[];
  filters: { from: string; to: string; schoolId: string; includeDeleted: boolean };
};

export function VisitListView({ schools, visits, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const totalCount = visits.reduce((sum, v) => sum + (v.count ?? 0), 0);
  const unmappedCount = visits.filter(
    (v) => v.location?.lat == null || v.location?.lng == null
  ).length;

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`/?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/");
  }

  const hasActiveFilter =
    filters.from || filters.to || filters.schoolId || filters.includeDeleted;

  return (
    <div className="flex flex-col gap-4">
      {/* 新規登録 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2">
            <Plus className="size-5" />
            配布実績を登録
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配布実績を登録</DialogTitle>
          </DialogHeader>
          <VisitForm
            schools={schools}
            submitLabel="登録する"
            onSubmit={createVisitAction}
            onSuccess={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* フィルタ */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <Filter className="size-4" />
              絞り込み
            </span>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
                <X className="size-3.5" />
                クリア
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-from" className="text-xs">開始日</Label>
              <Input
                id="f-from"
                type="date"
                value={filters.from}
                onChange={(e) => updateParam("from", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-to" className="text-xs">終了日</Label>
              <Input
                id="f-to"
                type="date"
                value={filters.to}
                onChange={(e) => updateParam("to", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-school" className="text-xs">対象小学校</Label>
            <Select
              value={filters.schoolId || "all"}
              onValueChange={(v) => updateParam("school", v === "all" ? null : v)}
            >
              <SelectTrigger id="f-school">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={filters.includeDeleted}
              onChange={(e) => updateParam("deleted", e.target.checked ? "1" : null)}
            />
            削除済みを表示
          </label>
        </CardContent>
      </Card>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCell label="表示件数" value={`${visits.length}件`} />
        <SummaryCell label="配布枚数合計" value={`${totalCount}枚`} />
        <SummaryCell label="地図未紐付け" value={`${unmappedCount}件`} />
      </div>

      {/* 一覧 */}
      {visits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {hasActiveFilter
              ? "条件に合う配布実績がありません"
              : "まだ配布実績がありません。「配布実績を登録」から追加しましょう。"}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visits.map((v) => (
            <VisitRow key={v.id} visit={v} schools={schools} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
