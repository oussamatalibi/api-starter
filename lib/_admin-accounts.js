import {
  AuthError,
  getSupabaseAdminClient,
  normalizeEmailList,
  normalizeName,
  normalizeRole
} from "./_auth.js";

function normalizeAccountPayload(body = {}) {
  return {
    email: String(body.email || "").trim().toLowerCase(),
    password: String(body.password || ""),
    name: normalizeName(body.name),
    role: normalizeRole(body.role),
    childEmails: normalizeEmailList(body.childEmails)
  };
}

export async function createManagedAccount(body) {
  const account = normalizeAccountPayload(body);

  if (!account.email || !account.email.includes("@")) {
    throw new AuthError(400, "A valid email is required.");
  }

  if (account.password.length < 6) {
    throw new AuthError(400, "Password must be at least 6 characters.");
  }

  if (!account.name) {
    throw new AuthError(400, "Name is required.");
  }

  if (!["admin", "student", "parent"].includes(account.role)) {
    throw new AuthError(400, "Admin can create admin, student, or parent accounts here.");
  }

  if (account.role === "parent" && !account.childEmails.length) {
    throw new AuthError(400, "Add at least one linked student email for a parent account.");
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    app_metadata: {
      role: account.role,
      childEmails: account.role === "parent" ? account.childEmails : []
    },
    user_metadata: {
      name: account.name,
      role: account.role,
      childEmails: account.role === "parent" ? account.childEmails : []
    }
  });

  if (error) {
    throw new AuthError(400, error.message);
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name: account.name,
    role: account.role,
    childEmails: account.role === "parent" ? account.childEmails : []
  };
}

async function findAuthUserByEmail(client, email) {
  const targetEmail = String(email || "").trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 100
    });

    if (error) {
      throw new AuthError(400, error.message);
    }

    const user = data.users.find(
      (item) => String(item.email || "").toLowerCase() === targetEmail
    );

    if (user) return user;
    if (!data.users.length || data.users.length < 100) return null;
    page += 1;
  }

  return null;
}

export async function listStudentAccounts() {
  const client = getSupabaseAdminClient();
  const students = [];
  let page = 1;

  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 100
    });

    if (error) {
      throw new AuthError(400, error.message);
    }

    for (const user of data.users) {
      const role = normalizeRole(user.app_metadata?.role || user.user_metadata?.role);
      if (role === "student") {
        students.push({
          id: user.id,
          email: user.email,
          name: normalizeName(user.user_metadata?.name) || user.email,
          role
        });
      }
    }

    if (!data.users.length || data.users.length < 100) break;
    page += 1;
  }

  return students.sort((a, b) => a.name.localeCompare(b.name));
}

export async function linkParentToStudents(body) {
  const parentEmail = String(body.parentEmail || "").trim().toLowerCase();
  const childEmails = normalizeEmailList(body.childEmails);

  if (!parentEmail || !parentEmail.includes("@")) {
    throw new AuthError(400, "A valid parent email is required.");
  }

  if (!childEmails.length) {
    throw new AuthError(400, "Add at least one linked student email.");
  }

  const client = getSupabaseAdminClient();
  const parent = await findAuthUserByEmail(client, parentEmail);

  if (!parent) {
    throw new AuthError(404, "Parent account was not found.");
  }

  const role = normalizeRole(parent.app_metadata?.role || parent.user_metadata?.role);
  if (role !== "parent") {
    throw new AuthError(400, "That account is not a parent account.");
  }

  const appMetadata = {
    ...parent.app_metadata,
    role: "parent",
    childEmails
  };
  const userMetadata = {
    ...parent.user_metadata,
    role: "parent",
    childEmails
  };

  const { data, error } = await client.auth.admin.updateUserById(parent.id, {
    app_metadata: appMetadata,
    user_metadata: userMetadata
  });

  if (error) {
    throw new AuthError(400, error.message);
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name: normalizeName(data.user.user_metadata?.name),
    role: "parent",
    childEmails
  };
}
