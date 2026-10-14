"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Mail, CheckCircle2, FlaskConical, KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { disableDemoMode, enableDemoMode, readDemoMode } from "@/lib/demo";
import { detectLoginError, urlWithoutLoginError } from "@/lib/auth-error";
import { GoogleLogo } from "@/components/google-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 未登録の文はメールリンクの既存の文と揃える（WO-006 Q-3）
const NOT_REGISTERED_MESSAGE = "このメールアドレスは登録されていません。管理者に招待を依頼してください。";
const LOGIN_FAILED_MESSAGE = "ログインに失敗しました。もう一度お試しください。";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");

  // デモ表示モード（DB の参照先を demo スキーマに切り替える）
  const [useDemo, setUseDemo] = useState(false);

  // パスワードログイン
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pwMessage, setPwMessage] = useState("");

  // マジックリンク
  const [magicEmail, setMagicEmail] = useState("");
  const [magicStatus, setMagicStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [magicMessage, setMagicMessage] = useState("");

  // Google でログイン
  const [googleStatus, setGoogleStatus] = useState<"idle" | "redirecting">("idle");
  // Google ボタンの下に出すエラー文（URL で戻ってきたエラーと、signInWithOAuth のエラーの両方）
  const [googleError, setGoogleError] = useState("");
  // 素早い2回押しで state の反映より先に2回目が来ても、1回だけ移動するように ref でも止める
  const googleRedirectingRef = useRef(false);

  // 実際の cookie に初期状態を合わせる。
  // マウント後に読むのは、サーバー描画と初期 state を一致させて hydration のズレを避けるため。
  useEffect(() => {
    setUseDemo(readDemoMode());
  }, []);

  // Google から拒否されて戻ったときのエラーは URL の「#」以降で届くため、ブラウザ側で読む。
  // URL の値はそのまま出さず、決まった文だけを出す。読んだら URL から消す（再読み込みで出続けないように）。
  useEffect(() => {
    const result = detectLoginError(window.location.hash, window.location.search);
    if (result === "none") return;
    setGoogleError(result === "not_registered" ? NOT_REGISTERED_MESSAGE : LOGIN_FAILED_MESSAGE);
    // URL を消すのは、この描画の effect が全部終わってから（setTimeout）にする。
    // Next.js は history.replaceState を自分のルーターと同期させる差し替えを、親（ルーター側）の effect で入れる。
    // 初回の描画ではこのページの effect の方が先に走るため、ここで直接呼ぶと差し替え前の replaceState になり、
    // ルーターが元の URL（エラー付き）を覚えたままになって、後でルーターが動いたときに URL が元に戻ってしまう（実測）。
    const timer = window.setTimeout(() => {
      window.history.replaceState(
        null,
        "",
        urlWithoutLoginError(window.location.pathname, window.location.search)
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Google の画面からブラウザの「戻る」で戻ると、押せない状態のままページが復元されることがあるので元に戻す
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      googleRedirectingRef.current = false;
      setGoogleStatus("idle");
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  function handleDemoToggle(checked: boolean) {
    setUseDemo(checked);
    // 押した時点で cookie に反映しておく。ログイン後のリダイレクト先を
    // サーバーが描画する時点で、すでに参照スキーマが決まっている必要があるため。
    if (checked) enableDemoMode();
    else disableDemoMode();
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setGoogleError("");
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
    setGoogleError("");
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

  async function handleGoogleLogin() {
    if (googleRedirectingRef.current) return;
    googleRedirectingRef.current = true;
    setGoogleError("");
    setGoogleStatus("redirecting");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) throw error;
      // 成功するとブラウザが Google の画面へ移るので、ボタンは押せないままにしておく
    } catch {
      googleRedirectingRef.current = false;
      setGoogleStatus("idle");
      setGoogleError(LOGIN_FAILED_MESSAGE);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <MapPin className="size-7" />
        </span>
        <div>
          <h1 className="text-xl font-bold">チラトラ</h1>
          <p className="text-sm text-muted-foreground">チラシ配布実績の記録・共有アプリ</p>
        </div>
      </div>

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
              {pwStatus === "error" && <p className="text-sm text-danger">{pwMessage}</p>}
              <Button type="submit" size="lg" disabled={pwStatus === "loading"}>
                {pwStatus === "loading" ? "ログイン中…" : "ログイン"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("magic")}
                className="min-h-11 rounded-control text-center text-sm font-bold text-primary hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                初回の方・パスワード未設定の方はこちら（メールでログイン）
              </button>
            </form>
          ) : magicStatus === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="text-sm font-bold">ログインリンクを送信しました</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">{magicEmail}</span> 宛のメールを開き、
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
              {magicStatus === "error" && <p className="text-sm text-danger">{magicMessage}</p>}
              <Button type="submit" size="lg" disabled={magicStatus === "sending"}>
                {magicStatus === "sending" ? "送信中…" : "ログインリンクを送る"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className="min-h-11 rounded-control text-center text-sm font-bold text-primary hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                パスワードでログインに戻る
              </button>
              <p className="text-center text-sm text-muted-foreground">
                ログイン後、右上メニューからパスワードを設定できます。
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Google でログイン。ロゴ・色・文言は Google のブランドの決まり（ライトのテーマ）に、
          高さ・幅・角丸・書体は既存の「ログイン」ボタン（size="lg"）に合わせる（WO-006 S-1） */}
      <div className="mt-4 flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogleLogin}
          disabled={googleStatus === "redirecting"}
          // Google のボタンの色は Google のブランドの決まりによる例外（WO-007 S-9）
          className="w-full border border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2] hover:text-[#1F1F1F]"
        >
          <GoogleLogo className="size-5" />
          {googleStatus === "redirecting" ? "Google に移動中…" : "Google でログイン"}
        </Button>
        {googleError && <p className="text-sm text-danger">{googleError}</p>}
      </div>

      {/* デモ表示モード: DB の参照先を demo スキーマに切り替える（本番データは表示されない） */}
      <label className="mt-4 flex w-full cursor-pointer items-start gap-3 rounded-card border border-demo-field-border bg-demo-field px-4 py-3">
        <input
          type="checkbox"
          checked={useDemo}
          onChange={(e) => handleDemoToggle(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-demo-field-icon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-bold text-demo-field-foreground">
            <FlaskConical className="size-4 text-demo-field-icon" />
            デモデータを参照する
          </span>
          <span className="text-sm text-muted-foreground">
            架空のダミーデータに切り替えて表示します。本番データは表示されません。
          </span>
        </span>
      </label>
    </div>
  );
}
