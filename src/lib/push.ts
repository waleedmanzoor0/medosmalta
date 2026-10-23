import { supabase } from "@/integrations/supabase/client";

export type PushStatus = "registered" | "not-configured" | "unsupported" | "open-in-new-tab" | "denied";

export const PUSH_MESSAGES: Record<Exclude<PushStatus, "registered">, string> = {
  "not-configured": "Phone alerts aren't set up yet.",
  unsupported: "This browser can't show alerts. On iPhone, add MedOS to your Home Screen first and open it from there.",
  "open-in-new-tab": "Open MedOS in its own tab (or the published app) to turn on alerts.",
  denied: "Alerts are blocked. Allow notifications for this site in your browser settings.",
};

export async function enablePush(): Promise<PushStatus> {
  const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
  const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;
  const config = {
    apiKey: (import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined) ?? "",
    projectId: (import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined) ?? "",
    appId: appId ?? "",
    messagingSenderId: appId?.split(":")[1] ?? "",
  };
  if (!config.apiKey || !config.projectId || !appId || !vapidKey || !config.messagingSenderId) return "not-configured";
  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return "unsupported";
  if (window.top !== window.self) return "open-in-new-tab";
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${new URLSearchParams(config).toString()}`,
  );
  const app = getApps()[0] ?? initializeApp(config);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return "denied";
  const { error } = await supabase
    .from("push_devices")
    .upsert({ token, label: navigator.userAgent.slice(0, 120) }, { onConflict: "user_id,token" });
  if (error) throw error;
  return "registered";
}
