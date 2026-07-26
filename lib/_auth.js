import { createClient } from "@supabase/supabase-js";

const ROLES = new Set(["admin", "student", "parent"]);

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function getPublicAuthConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthError(
      503,
      "Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseAdminClient() {
  if (globalThis.__mockSupabaseAdminClient) {
    return globalThis.__mockSupabaseAdminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new AuthError(
      503,
      "Supabase admin access is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

export function normalizeRole(role) {
  const normalized = String(role || "").toLowerCase().trim();
  return ROLES.has(normalized) ? normalized : "";
}

export function normalizeName(name) {
  return String(name || "").trim().slice(0, 120);
}

export function normalizeEmailList(value) {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  return [
    ...new Set(
      items
        .map((item) => String(item || "").trim().toLowerCase())
        .filter((item) => item.includes("@"))
    )
  ].slice(0, 10);
}

export function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

export async function requireUser(req, allowedRoles = []) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AuthError(401, "Please log in first.");
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data?.user) {
    throw new AuthError(401, "Your session expired. Please log in again.");
  }

  const role = normalizeRole(
    data.user.app_metadata?.role || data.user.user_metadata?.role
  );

  if (!role) {
    throw new AuthError(403, "Your account does not have a LearnHub role yet.");
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    throw new AuthError(403, "You do not have permission for this action.");
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name: normalizeName(data.user.user_metadata?.name),
    role,
    childEmails: normalizeEmailList(
      data.user.app_metadata?.childEmails || data.user.user_metadata?.childEmails
    )
  };
}

export function isValidRole(role) {
  return ROLES.has(role);
}
