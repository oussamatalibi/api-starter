import { getDb } from "./_db.js";
import { AuthError, requireUser } from "./_auth.js";
import { sendJson, readJsonBody, allowMethods, getQueryParam } from "./_helpers.js";
import { uploadHomeworkToSupabase } from "./_supabase-storage.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function homeworkErrorPayload(error) {
  if (error?.code === "NO_DATABASE_URL") {
    return {
      status: 503,
      message:
        "Database is not connected yet. Set DATABASE_URL in Vercel Environment Variables."
    };
  }

  if (error?.code === "42P01") {
    return {
      status: 500,
      message:
        "Homework tables are not available yet. Check that the database user can create tables."
    };
  }

  if (error.message?.startsWith("Supabase credentials are missing")) {
    return {
      status: 503,
      message:
        "File storage is not connected yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables."
    };
  }

  return {
    status: 500,
    message:
      "Homework database error. Check DATABASE_URL, Supabase settings, and the Vercel function logs."
  };
}

export function normalizeHomeworkPost(input = {}) {
  return {
    title: String(input.title || "").trim(),
    subject: String(input.subject || "").trim(),
    description: String(input.description || "").trim(),
    dueDate: String(input.dueDate || "").trim()
  };
}

export function normalizeHomeworkSubmission(input = {}) {
  return {
    studentName: String(input.studentName || "").trim(),
    assignmentId: String(input.assignmentId || "").trim(),
    assignmentTitle: String(input.assignmentTitle || "").trim(),
    fileName: String(input.fileName || "").trim(),
    fileType: String(input.fileType || "application/pdf").trim(),
    fileData: String(input.fileData || "").trim()
  };
}

export function normalizeStudentRemark(input = {}) {
  return {
    studentEmail: String(input.studentEmail || "").trim().toLowerCase(),
    studentName: String(input.studentName || "").trim(),
    remark: String(input.remark || "").trim()
  };
}

export function normalizeClassSession(input = {}) {
  return {
    title: String(input.title || "").trim(),
    sessionDate: String(input.sessionDate || "").trim(),
    startTime: String(input.startTime || "").trim(),
    endTime: String(input.endTime || "").trim(),
    recordingUrl: String(input.recordingUrl || "").trim(),
    notes: String(input.notes || "").trim()
  };
}

export function isDueDatePassed(dueDate, now = new Date()) {
  if (!dueDate) return false;

  const normalizedDueDate = String(dueDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDueDate)) return false;

  const today = now.toISOString().slice(0, 10);
  return normalizedDueDate < today;
}

export async function ensureHomeworkTables() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS homework_posts (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT,
      description TEXT NOT NULL,
      due_date TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id UUID PRIMARY KEY,
      student_user_id UUID,
      student_email TEXT,
      student_name TEXT NOT NULL,
      assignment_id UUID NOT NULL,
      assignment_title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_data TEXT NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE homework_submissions
    ADD COLUMN IF NOT EXISTS student_user_id UUID
  `;

  await sql`
    ALTER TABLE homework_submissions
    ADD COLUMN IF NOT EXISTS student_email TEXT
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS student_remarks (
      id UUID PRIMARY KEY,
      student_email TEXT NOT NULL,
      student_name TEXT,
      remark TEXT NOT NULL,
      created_by_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS class_sessions (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      session_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      recording_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function listHomeworkPosts() {
  const sql = getDb();
  return sql`
    SELECT id, title, subject, description, due_date AS "dueDate", created_at AS "createdAt"
    FROM homework_posts
    ORDER BY created_at DESC
  `;
}

export async function createHomeworkPost(payload) {
  const normalized = normalizeHomeworkPost(payload);

  if (!normalized.title || !normalized.description) {
    throw new Error("Title and description are required.");
  }

  const sql = getDb();
  const id = crypto.randomUUID();
  const [post] = await sql`
    INSERT INTO homework_posts (id, title, subject, description, due_date)
    VALUES (${id}, ${normalized.title}, ${normalized.subject || null}, ${normalized.description}, ${normalized.dueDate || null})
    RETURNING id, title, subject, description, due_date AS "dueDate", created_at AS "createdAt"
  `;

  return post;
}

export async function createHomeworkSubmission(payload, user = {}) {
  const normalized = normalizeHomeworkSubmission(payload);

  if (!normalized.studentName || !normalized.assignmentId || !normalized.fileData) {
    throw new Error("Student name, assignment, and file data are required.");
  }

  if (!UUID_PATTERN.test(normalized.assignmentId)) {
    throw new Error("Assignment id must be a valid homework post id.");
  }

  const sql = getDb();
  const [assignment] = await sql`
    SELECT id, due_date AS "dueDate"
    FROM homework_posts
    WHERE id = ${normalized.assignmentId}
  `;

  if (!assignment) {
    throw new Error("Homework assignment was not found.");
  }

  if (isDueDatePassed(assignment.dueDate)) {
    throw new Error("Homework deadline has passed.");
  }

  const id = crypto.randomUUID();
  const storageResult = await uploadHomeworkToSupabase({
    studentName: normalized.studentName,
    fileName: normalized.fileName || "homework.pdf",
    fileType: normalized.fileType || "application/pdf",
    fileData: normalized.fileData
  });

  const [submission] = await sql`
    INSERT INTO homework_submissions (id, student_user_id, student_email, student_name, assignment_id, assignment_title, file_name, file_type, file_data)
    VALUES (
      ${id},
      ${user.id || null},
      ${user.email || null},
      ${normalized.studentName},
      ${normalized.assignmentId},
      ${normalized.assignmentTitle || "Untitled"},
      ${normalized.fileName || "homework.pdf"},
      ${normalized.fileType || "application/pdf"},
      ${storageResult.publicUrl || storageResult.path}
    )
    RETURNING id, student_user_id AS "studentUserId", student_email AS "studentEmail", student_name AS "studentName", assignment_id AS "assignmentId", assignment_title AS "assignmentTitle", file_name AS "fileName", file_type AS "fileType", file_data AS "fileData", uploaded_at AS "uploadedAt"
  `;

  return submission;
}

export async function listHomeworkSubmissions() {
  const sql = getDb();
  return sql`
    SELECT id, student_user_id AS "studentUserId", student_email AS "studentEmail", student_name AS "studentName", assignment_id AS "assignmentId", assignment_title AS "assignmentTitle", file_name AS "fileName", file_type AS "fileType", file_data AS "fileData", uploaded_at AS "uploadedAt"
    FROM homework_submissions
    ORDER BY uploaded_at DESC
  `;
}

export async function listHomeworkSubmissionsForStudent(userId) {
  const sql = getDb();
  return sql`
    SELECT id, student_user_id AS "studentUserId", student_email AS "studentEmail", student_name AS "studentName", assignment_id AS "assignmentId", assignment_title AS "assignmentTitle", file_name AS "fileName", file_type AS "fileType", file_data AS "fileData", uploaded_at AS "uploadedAt"
    FROM homework_submissions
    WHERE student_user_id = ${userId}
    ORDER BY uploaded_at DESC
  `;
}

export async function listHomeworkSubmissionsForParent(childEmails) {
  if (!childEmails.length) return [];

  const sql = getDb();
  return sql`
    SELECT id, student_user_id AS "studentUserId", student_email AS "studentEmail", student_name AS "studentName", assignment_id AS "assignmentId", assignment_title AS "assignmentTitle", file_name AS "fileName", file_type AS "fileType", file_data AS "fileData", uploaded_at AS "uploadedAt"
    FROM homework_submissions
    WHERE LOWER(student_email) IN ${sql(childEmails)}
    ORDER BY uploaded_at DESC
  `;
}

export async function createStudentRemark(payload, user = {}) {
  const normalized = normalizeStudentRemark(payload);

  if (!normalized.studentEmail || !normalized.studentEmail.includes("@")) {
    throw new Error("A valid student email is required.");
  }

  if (!normalized.remark) {
    throw new Error("Remark is required.");
  }

  const sql = getDb();
  const id = crypto.randomUUID();
  const [remark] = await sql`
    INSERT INTO student_remarks (id, student_email, student_name, remark, created_by_email)
    VALUES (
      ${id},
      ${normalized.studentEmail},
      ${normalized.studentName || null},
      ${normalized.remark},
      ${user.email || null}
    )
    RETURNING id, student_email AS "studentEmail", student_name AS "studentName", remark, created_by_email AS "createdByEmail", created_at AS "createdAt"
  `;

  return remark;
}

export async function listStudentRemarks() {
  const sql = getDb();
  return sql`
    SELECT id, student_email AS "studentEmail", student_name AS "studentName", remark, created_by_email AS "createdByEmail", created_at AS "createdAt"
    FROM student_remarks
    ORDER BY created_at DESC
  `;
}

export async function listStudentRemarksForParent(childEmails) {
  if (!childEmails.length) return [];

  const sql = getDb();
  return sql`
    SELECT id, student_email AS "studentEmail", student_name AS "studentName", remark, created_by_email AS "createdByEmail", created_at AS "createdAt"
    FROM student_remarks
    WHERE LOWER(student_email) IN ${sql(childEmails)}
    ORDER BY created_at DESC
  `;
}

export async function listStudentRemarksForStudent(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];

  const sql = getDb();
  return sql`
    SELECT id, student_email AS "studentEmail", student_name AS "studentName", remark, created_by_email AS "createdByEmail", created_at AS "createdAt"
    FROM student_remarks
    WHERE LOWER(student_email) = ${normalizedEmail}
    ORDER BY created_at DESC
  `;
}

export async function listClassSessions() {
  const sql = getDb();
  return sql`
    SELECT id, title, session_date AS "sessionDate", start_time AS "startTime", end_time AS "endTime", recording_url AS "recordingUrl", notes, created_at AS "createdAt"
    FROM class_sessions
    ORDER BY session_date ASC, start_time ASC, created_at ASC
  `;
}

export async function createClassSession(payload) {
  const normalized = normalizeClassSession(payload);

  if (!normalized.title || !normalized.sessionDate) {
    throw new Error("Session title and date are required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized.sessionDate)) {
    throw new Error("Session date must use YYYY-MM-DD.");
  }

  if (normalized.recordingUrl && !/^https?:\/\//i.test(normalized.recordingUrl)) {
    throw new Error("Recording link must start with http:// or https://.");
  }

  const sql = getDb();
  const id = crypto.randomUUID();
  const [session] = await sql`
    INSERT INTO class_sessions (id, title, session_date, start_time, end_time, recording_url, notes)
    VALUES (
      ${id},
      ${normalized.title},
      ${normalized.sessionDate},
      ${normalized.startTime || null},
      ${normalized.endTime || null},
      ${normalized.recordingUrl || null},
      ${normalized.notes || null}
    )
    RETURNING id, title, session_date AS "sessionDate", start_time AS "startTime", end_time AS "endTime", recording_url AS "recordingUrl", notes, created_at AS "createdAt"
  `;

  return session;
}

export async function handleHomeworkApi(req, res) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.end();
      return;
    }

    if (!allowMethods(req, res, ["GET", "POST"])) return;

    await ensureHomeworkTables();

    const action = getQueryParam(req, "action") || "posts";

    if (req.method === "GET") {
      if (action === "submissions") {
        const user = await requireUser(req, ["admin", "parent", "student"]);
        let submissions;
        if (user.role === "student") {
          submissions = await listHomeworkSubmissionsForStudent(user.id);
        } else if (user.role === "parent") {
          submissions = await listHomeworkSubmissionsForParent(user.childEmails);
        } else {
          submissions = await listHomeworkSubmissions();
        }
        sendJson(res, 200, { success: true, data: submissions });
      } else if (action === "remarks") {
        const user = await requireUser(req, ["admin", "parent", "student"]);
        const remarks = user.role === "parent"
          ? await listStudentRemarksForParent(user.childEmails)
          : user.role === "student"
            ? await listStudentRemarksForStudent(user.email)
            : await listStudentRemarks();
        sendJson(res, 200, { success: true, data: remarks });
      } else if (action === "sessions") {
        await requireUser(req, ["admin", "student", "parent"]);
        const sessions = await listClassSessions();
        sendJson(res, 200, { success: true, data: sessions });
      } else {
        await requireUser(req, ["admin", "student", "parent"]);
        const posts = await listHomeworkPosts();
        sendJson(res, 200, { success: true, data: posts });
      }
      return;
    }

    const body = await readJsonBody(req);

    if (action === "submissions") {
      const user = await requireUser(req, ["student"]);
      const submission = await createHomeworkSubmission({
        ...body,
        studentName: user.name || user.email
      }, user);
      sendJson(res, 201, { success: true, data: submission });
      return;
    }

    if (action === "remarks") {
      const user = await requireUser(req, ["admin"]);
      const remark = await createStudentRemark(body, user);
      sendJson(res, 201, { success: true, data: remark });
      return;
    }

    if (action === "sessions") {
      await requireUser(req, ["admin"]);
      const session = await createClassSession(body);
      sendJson(res, 201, { success: true, data: session });
      return;
    }

    await requireUser(req, ["admin"]);
    const post = await createHomeworkPost(body);
    sendJson(res, 201, { success: true, data: post });
  } catch (error) {
    if (error instanceof AuthError) {
      sendJson(res, error.status, { success: false, message: error.message });
      return;
    }

    if (
      error.message === "Title and description are required." ||
      error.message === "Student name, assignment, and file data are required." ||
      error.message === "Assignment id must be a valid homework post id." ||
      error.message === "Homework assignment was not found." ||
      error.message === "Homework deadline has passed." ||
      error.message === "A valid student email is required." ||
      error.message === "Remark is required." ||
      error.message === "Session title and date are required." ||
      error.message === "Session date must use YYYY-MM-DD." ||
      error.message === "Recording link must start with http:// or https://."
    ) {
      sendJson(res, 400, { success: false, message: error.message });
      return;
    }
    const payload = homeworkErrorPayload(error);
    sendJson(res, payload.status, { success: false, message: payload.message });
  }
}
