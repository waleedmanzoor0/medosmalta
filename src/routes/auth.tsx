import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/medos/ui";
import { supabase } from "@/integrations/supabase/client";
import { createOwner, getSetupStatus, usernameToEmail, validateUsername } from "@/lib/owner.functions";
import { Logo } from "./index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Unlock — MedOS" },
      { name: "description", content: "Private MedOS workspace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Unlock — MedOS" },
      { property: "og:description", content: "Private MedOS workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const status = useServerFn(getSetupStatus);
  const setup = useServerFn(createOwner);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    status()
      .then((r) => setNeedsSetup(r.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, [navigate, status]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!validateUsername(username)) e["username"] = "3–32 letters, numbers, dots, dashes or underscores.";
    if (needsSetup && password.length < 10) e["password"] = "Use at least 10 characters.";
    if (!needsSetup && !password) e["password"] = "Enter your password.";
    if (needsSetup && confirm !== password) e["confirm"] = "Passwords don't match.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (needsSetup) await setup({ data: { username, password } });
      const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
      if (error) throw new Error(error.message.includes("Invalid") ? "Wrong username or password." : error.message);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="mb-8"><Logo /></div>
      <div className="surface w-full max-w-sm p-6 animate-rise">
        <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-primary-soft text-accent-foreground"><Lock className="size-4" /></div>
        <h1 className="font-display mt-3 text-2xl">{needsSetup ? "Set up your private workspace" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsSetup ? "Choose the username and password only you will use. This can be done once." : "This workspace is private."}
        </p>
        {needsSetup === null ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
            <Field label="Username" error={errors["username"]}>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus />
            </Field>
            <Field label="Password" error={errors["password"]}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={needsSetup ? "new-password" : "current-password"} />
            </Field>
            {needsSetup && (
              <Field label="Confirm password" error={errors["confirm"]}>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </Field>
            )}
            <Button type="submit" disabled={busy}>{busy ? "Please wait…" : needsSetup ? "Create & open" : "Open MedOS"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
