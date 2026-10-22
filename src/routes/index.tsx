import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedOS — Private workspace" },
      { name: "description", content: "A private study and life operating system." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "MedOS — Private workspace" },
      { property: "og:description", content: "A private study and life operating system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entry,
});

function Entry() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/dashboard" : "/auth", replace: true });
    });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Logo />
    </div>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-lg text-primary-foreground">M</span>
      <span className="font-display text-xl">MedOS</span>
    </span>
  );
}
