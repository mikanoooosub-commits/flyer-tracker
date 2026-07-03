"use client";

import { useState } from "react";
import { MapPin, Mail, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "送信に失敗しました。時間をおいて再度お試しください。"
      );
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MapPin className="size-7" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">チラシ配布実績管理</h1>
          <p className="text-sm text-muted-foreground">ログインして記録を始めましょう</p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Mail className="size-5" />
            メールでログイン
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-rating-good" />
              <p className="text-sm font-bold">ログインリンクを送信しました</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span> 宛のメールを開き、
                リンクをタップしてログインしてください。
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatus("idle")}
                className="mt-2"
              >
                別のメールアドレスで送り直す
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {status === "error" && (
                <p className="text-sm text-destructive">{message}</p>
              )}
              <Button type="submit" size="lg" disabled={status === "sending"}>
                {status === "sending" ? "送信中…" : "ログインリンクを送る"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                パスワードは不要です。届いたメールのリンクからログインします。
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
