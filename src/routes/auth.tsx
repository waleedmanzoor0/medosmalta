import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/medos/ui";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "./index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — MedOS" },
      { name: "description", content: "Sign in or create your private MedOS workspace." },
      { property: "og:title", content: "Sign in — MedOS" },
      { property: "og:description", content: "Sign in or create your private MedOS workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email address.";
    if (mode !== "forgot" && password.length < 8) e.password = "Use at least 8 characters.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        setSent("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("If an account exists, a reset link is on its way.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) return toast.error(r.error.message ?? "Sign-in failed");
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <Link to="/" className="mb-8"><Logo /></Link>
      <div className="surface w-full max-w-sm p-6 animate-rise">
        <h1 className="font-display text-2xl">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your workspace" : "Reset password"}
        </h1>
        {sent ? (
          <p className="mt-4 rounded-lg bg-primary-soft p-3 text-sm text-accent-foreground">{sent}</p>
        ) : (
          <>
            {mode !== "forgot" && (
              <div className="mt-5 grid gap-2">
                <Button variant="outline" onClick={() => oauth("google")}>Continue with Google</Button>
                <button type="button" className="lovable-auth-button" onClick={() => oauth("lovable")}>Continue with Lovable</button>
                <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              </div>
            )}
            <form onSubmit={submit} className="mt-2 grid gap-4" noValidate>
              {mode === "signup" && (
                <Field label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></Field>
              )}
              <Field label="Email" error={errors.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
              {mode !== "forgot" && (
                <Field label="Password" error={errors.password}>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                </Field>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
        <div className="mt-5 flex flex-col gap-1 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button className="hover:text-foreground" onClick={() => { setMode("signup"); setSent(null); }}>New here? Create an account</button>
              <button className="hover:text-foreground" onClick={() => { setMode("forgot"); setSent(null); }}>Forgot password?</button>
            </>
          ) : (
            <button className="hover:text-foreground" onClick={() => { setMode("signin"); setSent(null); }}>Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
