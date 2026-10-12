"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { formatDate } from "@/lib/format";
import type { SchoolSpotsView, SpotRow, SpotStatus } from "@/lib/cooldown";

// ラベルの色は赤系・緑系を使わない（地図の 緑=良好／赤=非推奨 と読み違えないため。WO-003 S-2）。
// 白黒でも文字だけで判別できるよう、状態は必ず文字で出す。
const LABELS: Record<Exclude<SpotStatus["kind"], "none">, { text: string; className: string }> = {
  cooldown: { text: "クールダウン中", className: "border border-primary/40 bg-primary/10 text-primary" },
  available: { text: "配布可", className: "bg-muted text-muted-foreground" },
  excluded: { text: "非推奨（対象外）", className: "border border-muted-foreground/50 text-muted-foreground" },
};

/** 学校カードの中の「立ち位置」欄。最初は畳んでおき、見出しのタップで開閉する（開閉の状態は保存しない） */
export function SchoolSpots({ view }: { view: SchoolSpotsView }) {
  const [open, setOpen] = useState(false);

  if (view.total === 0) {
    return <p className="text-xs text-muted-foreground">立ち位置なし</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 self-start text-xs font-bold text-primary"
      >
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        立ち位置（{view.total}）
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          {view.active.length > 0 && <SpotList rows={view.active} />}
          {view.excluded.length > 0 && (
            <>
              <p className="pt-1 text-xs font-bold text-muted-foreground">非推奨（対象外）</p>
              <SpotList rows={view.excluded} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SpotList({ rows }: { rows: SpotRow[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60">
      {rows.map((row) => (
        <SpotItem key={row.id} row={row} />
      ))}
    </ul>
  );
}

function SpotItem({ row }: { row: SpotRow }) {
  const { status } = row;
  const label = status.kind === "none" ? null : LABELS[status.kind];

  return (
    <li className="flex flex-col gap-0.5 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium">{row.name}</span>
        {label && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${label.className}`}>
            {label.text}
          </span>
        )}
      </div>
      {status.kind === "none" ? (
        <p className="text-xs text-muted-foreground">配布実績なし</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{lastDateText(status)}</p>
          {status.kind === "cooldown" && status.releaseDate && (
            <p className="text-xs font-bold">{formatDate(status.releaseDate)} から配布可</p>
          )}
        </>
      )}
    </li>
  );
}

/** 「前回 2026/7/6(月)（98日前）」「前回 …（今日）」「2026/10/20(火)（予定）」「前回 …」（非推奨） */
function lastDateText(status: SpotStatus): string {
  const date = formatDate(status.date);
  if (status.isFuture) return `${date}（予定）`;
  if (status.elapsedDays === null) return `前回 ${date}`;
  if (status.elapsedDays === 0) return `前回 ${date}（今日）`;
  return `前回 ${date}（${status.elapsedDays}日前）`;
}
