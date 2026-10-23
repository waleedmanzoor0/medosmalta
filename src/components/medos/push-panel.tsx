import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/medos/ui";
import { enablePush, PUSH_MESSAGES } from "@/lib/push";
import { sendPushAlert } from "@/lib/push.functions";

export function PushPanel() {
  const [busy, setBusy] = useState<string | null>(null);
  const send = useServerFn(sendPushAlert);

  async function enable() {
    setBusy("enable");
    try {
      const s = await enablePush();
      if (s === "registered") toast.success("Alerts are on for this device");
      else toast.error(PUSH_MESSAGES[s]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    try {
      const r = await send({ data: { kind: "test" } });
      if (r.devices === 0) toast.error("No devices yet. Turn on alerts first.");
      else toast.success(`Test alert sent to ${r.sent} device${r.sent === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel title="Phone alerts">
      <p className="mb-4 text-sm text-muted-foreground">
        Get an alert on your phone whenever someone signs in to MedOS. On iPhone, first tap Share → Add to Home Screen, then open MedOS from the icon.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={enable} disabled={!!busy}>
          <Bell className="mr-2 h-4 w-4" />
          {busy === "enable" ? "Turning on…" : "Turn on for this device"}
        </Button>
        <Button variant="outline" onClick={test} disabled={!!busy}>
          {busy === "test" ? "Sending…" : "Send test alert"}
        </Button>
      </div>
    </Panel>
  );
}
