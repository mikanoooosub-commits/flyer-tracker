"use client";

import { useState } from "react";
import { MapPin, Mail, CheckCircle2, PlayCircle, KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");

  // パスワードログイン
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pwMessage, setPwMessage] = useState("");

  // マジックリンク
  const [magicEmail, setMagicEmail] = useState("");
  const [magicStatus, setMagicStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [magicMessage, setMagicMessage] = useState("");

  const [demoLoading, setDemoLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwStatus("loading");
    setPwMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      window.location.href = "/";
    } catch (err) {
      setPwStatus("error");
      const raw = err instanceof Error ? err.message : "";
      setPwMessage(
        /invalid login credentials/i.test(raw)
          ? "メールアドレスまたはパスワードが違います。"
          : raw || "ログインに失敗しました。"
      );
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicStatus("sending");
    setMagicMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;
      setMagicStatus("sent");
    } catch (err) {
      setMagicStatus("error");
      const raw = err instanceof Error ? err.message : "";
      setMagicMessage(
        /signup|not allowed|not found|disabled/i.test(raw)
          ? "このメールアドレスは登録されていません。管理者に招待を依頼してください。"
          : raw || "送信に失敗しました。"
      );
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
      window.location.href = "/";
    } catch {
      setDemoLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MapPin className="size-7" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">チラトラ</h1>
          <p className="text-sm text-muted-foreground">チラシ配布実績の記録・共有アプリ</p>
        </div>
      </div>

      {DEMO_MODE && (
        <Card className="mb-4 w-full border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="text-sm font-bold">これはデモ環境です</p>
            <p className="text-xs text-muted-foreground">
              下のボタンで、ダミーデータの入ったデモにそのままログインできます。
            </p>
            <Button size="lg" className="gap-2" onClick={handleDemoLogin} disabled={demoLoading}>
              <PlayCircle className="size-5" />
              {demoLoading ? "ログイン中…" : "デモとしてログイン"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {mode === "password" ? (
              <>
                <KeyRound className="size-5" />
                パスワードでログイン
              </>
            ) : (
              <>
                <Mail className="size-5" />
                メールリンクでログイン
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "password" ? (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {pwStatus === "error" && <p className="text-sm text-destructive">{pwMessage}</p>}
              <Button type="submit" size="lg" disabled={pwStatus === "loading"}>
                {pwStatus === "loading" ? "ログイン中…" : "ログイン"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("magic")}
                className="text-center text-xs font-bold text-primary hover:underline"
              >
                初回の方・パスワード未設定の方はこちら（メールでログイン）
              </button>
            </form>
          ) : magicStatus === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-rating-good" />
              <p className="text-sm font-bold">ログインリンクを送信しました</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{magicEmail}</span> 宛のメールを開き、
                リンクをタップしてください。
                <br />
                ※ リンクは<strong>リクエストしたのと同じブラウザ</strong>で開いてください。
              </p>
              <Button variant="ghost" size="sm" onClick={() => setMode("password")}>
                パスワードログインに戻る
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="magic-email">メールアドレス</Label>
                <Input
                  id="magic-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  required
                />
              </div>
              {magicStatus === "error" && <p className="text-sm text-destructive">{magicMessage}</p>}
              <Button type="submit" size="lg" disabled={magicStatus === "sending"}>
                {magicStatus === "sending" ? "送信中…" : "ログインリンクを送る"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className="text-center text-xs font-bold text-primary hover:underline"
              >
                パスワードでログインに戻る
              </button>
              <p className="text-center text-xs text-muted-foreground">
                ログイン後、右上メニューからパスワードを設定できます。
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
