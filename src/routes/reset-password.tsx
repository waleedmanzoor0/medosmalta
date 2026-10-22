import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/medos/ui";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — MedOS" },
      { name: "description", content: "Choose a new password for your MedOS account." },
      { property: "og:title", content: "Set a new password — MedOS" },
      { property: "og:description", content: "Choose a new password for your MedOS account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isRecovery = typeof window !== "undefined" && window.location.hash.includes("type=recovery");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="surface grid w-full max-w-sm gap-4 p-6">
        <h1 className="font-display text-2xl">Set a new password</h1>
        {!isRecovery && <p className="text-sm text-muted-foreground">Open this page from the link in your reset email.</p>}
        <Field label="New password" error={err}><Input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} /></Field>
        <Button type="submit" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
