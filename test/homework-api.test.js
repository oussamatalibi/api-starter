import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmailList } from "../lib/_auth.js";
import {
  createManagedAccount,
  linkParentToStudents,
  listStudentAccounts
} from "../lib/_admin-accounts.js";
import {
  createClassSession,
  createStudentRemark,
  createHomeworkSubmission,
  isDueDatePassed,
  listHomeworkSubmissionsForParent,
  listHomeworkSubmissionsForStudent,
  listStudentRemarksForStudent,
  listStudentRemarksForParent,
  normalizeClassSession,
  normalizeHomeworkPost,
  normalizeHomeworkSubmission,
  normalizeStudentRemark
} from "../lib/_homework.js";
import { buildSupabaseObjectPath } from "../lib/_supabase-storage.js";

test("normalizeHomeworkPost trims and keeps the required fields", () => {
  const payload = normalizeHomeworkPost({
    title: "  Math Homework  ",
    subject: "Math",
    description: "Solve page 10",
    dueDate: "2026-08-01"
  });

  assert.equal(payload.title, "Math Homework");
  assert.equal(payload.subject, "Math");
  assert.equal(payload.description, "Solve page 10");
  assert.equal(payload.dueDate, "2026-08-01");
});

test("normalizeHomeworkSubmission requires a student name and file data", () => {
  const payload = normalizeHomeworkSubmission({
    studentName: "Sara",
    assignmentId: "abc",
    assignmentTitle: "Math Homework",
    fileName: "homework.pdf",
    fileType: "application/pdf",
    fileData: "data:application/pdf;base64,abc"
  });

  assert.equal(payload.studentName, "Sara");
  assert.equal(payload.assignmentTitle, "Math Homework");
  assert.equal(payload.fileName, "homework.pdf");
  assert.match(payload.fileData, /^data:/);
});

test("buildSupabaseObjectPath makes a safe storage path", () => {
  const path = buildSupabaseObjectPath("Sara", "homework.pdf");

  assert.match(path, /^homework\/\d{4}\/\d{2}\/\d{2}\//);
  assert.match(path, /homework\.pdf$/);
});

test("isDueDatePassed closes homework after its due date", () => {
  const now = new Date("2026-08-02T10:00:00.000Z");

  assert.equal(isDueDatePassed("2026-08-01", now), true);
  assert.equal(isDueDatePassed("2026-08-02", now), false);
  assert.equal(isDueDatePassed("2026-08-03", now), false);
  assert.equal(isDueDatePassed("", now), false);
});

test("normalizeStudentRemark cleans remark fields", () => {
  const payload = normalizeStudentRemark({
    studentEmail: " Sara@Example.com ",
    studentName: " Sara ",
    remark: "  Great progress this week. "
  });

  assert.equal(payload.studentEmail, "sara@example.com");
  assert.equal(payload.studentName, "Sara");
  assert.equal(payload.remark, "Great progress this week.");
});

test("normalizeClassSession trims calendar fields", () => {
  const payload = normalizeClassSession({
    title: "  React workshop  ",
    sessionDate: " 2026-08-04 ",
    startTime: " 18:00 ",
    endTime: " 19:30 ",
    recordingUrl: " https://zoom.us/rec/abc ",
    notes: " Review hooks "
  });

  assert.equal(payload.title, "React workshop");
  assert.equal(payload.sessionDate, "2026-08-04");
  assert.equal(payload.startTime, "18:00");
  assert.equal(payload.endTime, "19:30");
  assert.equal(payload.recordingUrl, "https://zoom.us/rec/abc");
  assert.equal(payload.notes, "Review hooks");
});

test("createClassSession rejects invalid recording links", async () => {
  await assert.rejects(
    createClassSession({
      title: "React workshop",
      sessionDate: "2026-08-04",
      recordingUrl: "zoom-recording"
    }),
    /Recording link must start/
  );
});

test("createHomeworkSubmission rejects invalid assignment ids before upload", async () => {
  await assert.rejects(
    createHomeworkSubmission({
      studentName: "Sara",
      assignmentId: "abc",
      assignmentTitle: "Math Homework",
      fileName: "homework.pdf",
      fileType: "application/pdf",
      fileData: "data:application/pdf;base64,abc"
    }),
    /Assignment id must be a valid homework post id/
  );
});

test("createHomeworkSubmission rejects expired homework before upload", async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://local:test@localhost:5432/test";
  const assignmentId = "00000000-0000-4000-8000-000000000001";

  globalThis.__mockSql = (strings) => {
    if (strings.join("").includes("FROM homework_posts")) {
      return [{ id: assignmentId, dueDate: "2000-01-01" }];
    }
    return [];
  };

  try {
    await assert.rejects(
      createHomeworkSubmission(
        {
          studentName: "Sara",
          assignmentId,
          assignmentTitle: "Old Homework",
          fileName: "homework.pdf",
          fileType: "application/pdf",
          fileData: "data:application/pdf;base64,abc"
        },
        { id: "student-id", email: "sara@example.com" }
      ),
      /Homework deadline has passed/
    );
  } finally {
    delete globalThis.__mockSql;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }
});

test("listHomeworkSubmissionsForStudent filters by the authenticated user id", async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://local:test@localhost:5432/test";

  const calls = [];
  globalThis.__mockSql = (strings, ...values) => {
    calls.push({ strings, values });
    return [];
  };

  try {
    await listHomeworkSubmissionsForStudent("00000000-0000-4000-8000-000000000001");
  } finally {
    delete globalThis.__mockSql;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }

  assert.equal(calls.length, 1);
  assert.match(calls[0].strings.join("?"), /WHERE student_user_id = \?/);
  assert.deepEqual(calls[0].values, ["00000000-0000-4000-8000-000000000001"]);
});

test("normalizeEmailList cleans parent child emails", () => {
  assert.deepEqual(
    normalizeEmailList(" Sara@Example.com, bad-value, sara@example.com, ali@example.com "),
    ["sara@example.com", "ali@example.com"]
  );
});

test("listHomeworkSubmissionsForParent filters by linked child emails", async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://local:test@localhost:5432/test";

  const calls = [];
  globalThis.__mockSql = (strings, ...values) => {
    calls.push({ strings, values });
    return [];
  };

  globalThis.__mockSql[Symbol.for("nodejs.util.inspect.custom")] = () => "mockSql";

  try {
    await listHomeworkSubmissionsForParent(["sara@example.com", "ali@example.com"]);
  } finally {
    delete globalThis.__mockSql;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].strings, ["sara@example.com", "ali@example.com"]);
  assert.match(calls[1].strings.join("?"), /WHERE LOWER\(student_email\) IN \?/);
});

test("createManagedAccount allows an admin to create another admin", async () => {
  let createdUserPayload;
  globalThis.__mockSupabaseAdminClient = {
    auth: {
      admin: {
        createUser(payload) {
          createdUserPayload = payload;
          return {
            data: {
              user: {
                id: "admin-user-id",
                email: payload.email
              }
            },
            error: null
          };
        }
      }
    }
  };

  try {
    const account = await createManagedAccount({
      email: "SecondAdmin@example.com",
      password: "admin456",
      name: "Second Admin",
      role: "admin"
    });

    assert.equal(account.role, "admin");
    assert.equal(account.email, "secondadmin@example.com");
    assert.deepEqual(account.childEmails, []);
    assert.equal(createdUserPayload.app_metadata.role, "admin");
  } finally {
    delete globalThis.__mockSupabaseAdminClient;
  }
});

test("linkParentToStudents updates parent child emails", async () => {
  let updatedUserId;
  let updatedPayload;

  globalThis.__mockSupabaseAdminClient = {
    auth: {
      admin: {
        listUsers() {
          return {
            data: {
              users: [
                {
                  id: "parent-user-id",
                  email: "parent@example.com",
                  app_metadata: { role: "parent" },
                  user_metadata: { name: "Parent", role: "parent" }
                }
              ]
            },
            error: null
          };
        },
        updateUserById(userId, payload) {
          updatedUserId = userId;
          updatedPayload = payload;
          return {
            data: {
              user: {
                id: userId,
                email: "parent@example.com",
                user_metadata: payload.user_metadata
              }
            },
            error: null
          };
        }
      }
    }
  };

  try {
    const account = await linkParentToStudents({
      parentEmail: "parent@example.com",
      childEmails: "Student@example.com, other@example.com"
    });

    assert.equal(updatedUserId, "parent-user-id");
    assert.deepEqual(updatedPayload.app_metadata.childEmails, [
      "student@example.com",
      "other@example.com"
    ]);
    assert.deepEqual(account.childEmails, [
      "student@example.com",
      "other@example.com"
    ]);
  } finally {
    delete globalThis.__mockSupabaseAdminClient;
  }
});

test("createStudentRemark requires a valid student email", async () => {
  await assert.rejects(
    createStudentRemark({
      studentEmail: "not-email",
      studentName: "Sara",
      remark: "Needs to submit homework on time."
    }),
    /A valid student email is required/
  );
});

test("listStudentRemarksForParent filters by linked child emails", async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://local:test@localhost:5432/test";

  const calls = [];
  globalThis.__mockSql = (strings, ...values) => {
    calls.push({ strings, values });
    return [];
  };

  try {
    await listStudentRemarksForParent(["sara@example.com", "ali@example.com"]);
  } finally {
    delete globalThis.__mockSql;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].strings, ["sara@example.com", "ali@example.com"]);
  assert.match(calls[1].strings.join("?"), /WHERE LOWER\(student_email\) IN \?/);
});

test("listStudentRemarksForStudent filters by authenticated student email", async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://local:test@localhost:5432/test";

  const calls = [];
  globalThis.__mockSql = (strings, ...values) => {
    calls.push({ strings, values });
    return [];
  };

  try {
    await listStudentRemarksForStudent("Sara@Example.com");
  } finally {
    delete globalThis.__mockSql;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }

  assert.equal(calls.length, 1);
  assert.match(calls[0].strings.join("?"), /WHERE LOWER\(student_email\) = \?/);
  assert.deepEqual(calls[0].values, ["sara@example.com"]);
});

test("listStudentAccounts returns only auth users with the student role", async () => {
  globalThis.__mockSupabaseAdminClient = {
    auth: {
      admin: {
        listUsers() {
          return {
            data: {
              users: [
                {
                  id: "student-id",
                  email: "student@example.com",
                  app_metadata: { role: "student" },
                  user_metadata: { name: "Student One", role: "student" }
                },
                {
                  id: "parent-id",
                  email: "parent@example.com",
                  app_metadata: { role: "parent" },
                  user_metadata: { name: "Parent One", role: "parent" }
                }
              ]
            },
            error: null
          };
        }
      }
    }
  };

  try {
    const students = await listStudentAccounts();

    assert.deepEqual(students, [
      {
        id: "student-id",
        email: "student@example.com",
        name: "Student One",
        role: "student"
      }
    ]);
  } finally {
    delete globalThis.__mockSupabaseAdminClient;
  }
});
