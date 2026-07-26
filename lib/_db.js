import postgres from "postgres";

/**
 * Connect to PostgreSQL using DATABASE_URL.
 * Create the database yourself (Neon, Supabase, Railway, etc.),
 * then add DATABASE_URL in Vercel Environment Variables.
 */
let sql;

export function getDb() {
  if (globalThis.__mockSql) {
    return globalThis.__mockSql;
  }

  if (!process.env.DATABASE_URL) {
    const error = new Error(
      "DATABASE_URL is missing. Add your PostgreSQL connection string in Vercel Environment Variables."
    );
    error.code = "NO_DATABASE_URL";
    throw error;
  }

  if (!sql) {
    const isLocal =
      process.env.DATABASE_URL.includes("localhost") ||
      process.env.DATABASE_URL.includes("127.0.0.1");

    sql = postgres(process.env.DATABASE_URL, {
      ssl: isLocal ? false : "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }

  return sql;
}

/**
 * Friendly JSON error when the database is not ready.
 */
export function databaseErrorPayload(error) {
  if (error?.code === "NO_DATABASE_URL") {
    return {
      success: false,
      message:
        "Database is not connected yet. The teacher must set DATABASE_URL and create the books table."
    };
  }

  if (error?.code === "42P01") {
    return {
      success: false,
      message:
        "The books table does not exist yet. Run the SQL file in sql/books.sql first."
    };
  }

  return {
    success: false,
    message: "Database error. Check DATABASE_URL and that the books table exists."
  };
}
