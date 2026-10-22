import { createServerFn } from "@tanstack/react-start";

// Single-owner app: the very first account is created here (signups are disabled),
// and only while no account exists yet.
export const OWNER_EMAIL_DOMAIN = "medos.local";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${OWNER_EMAIL_DOMAIN}`;
}

export function validateUsername(u: string) {
  return /^[a-z0-9._-]{3,32}$/.test(u.trim().toLowerCase());
}

async function ownerExists() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw new Error("Could not check setup status.");
  return data.users.length > 0;
}

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { needsSetup: !(await ownerExists()) };
});

export const createOwner = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; password: string }) => input)
  .handler(async ({ data }) => {
    if (!validateUsername(data.username)) throw new Error("Username: 3–32 letters, numbers, dots, dashes or underscores.");
    if (typeof data.password !== "string" || data.password.length < 10) throw new Error("Password must be at least 10 characters.");
    if (await ownerExists()) throw new Error("This app already has an owner.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.username.trim() },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
