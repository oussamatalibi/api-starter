import {
  AuthError,
  getPublicAuthConfig,
  getSupabaseAdminClient,
  normalizeEmailList,
  normalizeName,
  normalizeRole,
  requireUser
} from "../lib/_auth.js";
import {
  createManagedAccount,
  linkParentToStudents,
  listStudentAccounts
} from "../lib/_admin-accounts.js";
import { handleOptions, allowMethods, getQueryParam, readJsonBody, sendJson } from "../lib/_helpers.js";

async function createBootstrapAdmin(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = normalizeName(body.name);
  const role = normalizeRole(body.role);
  const childEmails = normalizeEmailList(body.childEmails);

  if (role !== "admin") {
    throw new AuthError(
      403,
      "Students and parents cannot create accounts. Ask the admin to create one."
    );
  }

  if (!email || !email.includes("@")) {
    throw new AuthError(400, "A valid email is required.");
  }

  if (password.length < 6) {
    throw new AuthError(400, "Password must be at least 6 characters.");
  }

  if (!name) {
    throw new AuthError(400, "Name is required.");
  }

  const expectedCode = process.env.ADMIN_SIGNUP_CODE || "HOMEWORK2026";
  if (String(body.adminCode || "") !== expectedCode) {
    throw new AuthError(403, "Admin signup code is incorrect.");
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, childEmails },
    user_metadata: { name, role, childEmails }
  });

  if (error) {
    throw new AuthError(400, error.message);
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name,
    role,
    childEmails
  };
}

export default async function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowMethods(req, res, ["GET", "POST"])) return;

    const action = getQueryParam(req, "action") || "config";

    if (req.method === "GET" && action === "config") {
      sendJson(res, 200, {
        success: true,
        data: getPublicAuthConfig()
      });
      return;
    }

    if (req.method === "GET" && action === "students") {
      await requireUser(req, ["admin"]);
      const students = await listStudentAccounts();
      sendJson(res, 200, {
        success: true,
        data: students
      });
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { success: false, message: "Method not allowed. Use POST." });
      return;
    }

    const body = await readJsonBody(req);

    if (action === "signup") {
      const account = await createBootstrapAdmin(body);
      sendJson(res, 201, { success: true, data: account });
      return;
    }

    if (action === "accounts") {
      await requireUser(req, ["admin"]);
      const account = await createManagedAccount(body);
      sendJson(res, 201, {
        success: true,
        message: `${account.role} account created.`,
        data: account
      });
      return;
    }

    if (action === "link-parent") {
      await requireUser(req, ["admin"]);
      const account = await linkParentToStudents(body);
      sendJson(res, 200, {
        success: true,
        message: "Parent linked to student account.",
        data: account
      });
      return;
    }

    sendJson(res, 404, { success: false, message: "Unknown auth action." });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    sendJson(res, status, {
      success: false,
      message: error.message || "Auth request failed."
    });
  }
}
