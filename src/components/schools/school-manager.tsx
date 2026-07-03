"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, School as SchoolIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { addSchoolAction, deleteSchoolAction } from "@/lib/data/actions";
import type { School } from "@/lib/types";

export function SchoolManager({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await addSchoolAction(name);
      if (result.ok) {
        setName("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteSchoolAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <form onSubmit={handleAdd} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="school-name" className="text-sm font-bold">
                小学校を追加
              </label>
              <Input
                id="school-name"
                placeholder="例: 板橋第一小"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" size="icon" disabled={pending} aria-label="追加">
              <Plus className="size-5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="px-1 text-sm text-destructive">{error}</p>}

      {schools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            まだ小学校が登録されていません。上のフォームから追加してください。
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {schools.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm"
            >
              <SchoolIcon className="size-4 shrink-0 text-primary" />
              <span className="flex-1 font-medium">{s.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive"
                disabled={pending}
                onClick={() => handleDelete(s.id)}
              >
                <Trash2 className="size-4" />
                削除
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        ※ 配布場所が紐づいている小学校は削除できません（先に該当の配布場所・履歴を整理してください）。
      </p>
    </div>
  );
}
