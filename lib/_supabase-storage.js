import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase credentials are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

export function buildSupabaseObjectPath(studentName, fileName) {
  const safeStudent = String(studentName || "student")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "student";

  const safeFileName = String(fileName || "file")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "") || "file";

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `homework/${year}/${month}/${day}/${safeStudent}/${safeFileName}`;
}

export async function uploadHomeworkToSupabase({ studentName, fileName, fileType, fileData }) {
  const client = getSupabaseClient();
  const buffer = Buffer.from(fileData.replace(/^data:.*;base64,/, ""), "base64");
  const objectPath = buildSupabaseObjectPath(studentName, fileName);

  const { error } = await client.storage.from("homework-files").upload(objectPath, buffer, {
    contentType: fileType || "application/pdf",
    upsert: true
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = client.storage.from("homework-files").getPublicUrl(objectPath);

  return {
    path: objectPath,
    publicUrl: data?.publicUrl || null
  };
}
