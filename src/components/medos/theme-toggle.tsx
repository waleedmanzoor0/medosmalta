import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Switches between the obsidian dark theme (default) and the warm paper light theme. */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const next = !dark;
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.classList.toggle("dark", next);
    localStorage.setItem("medos-theme", next ? "dark" : "light");
    setDark(next);
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} className={cn("rounded-full", className)}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
