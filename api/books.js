import {
  handleOptions,
  allowMethods,
  sendJson,
  readJsonBody,
  getQueryParam,
  equalsIgnoreCase
} from "../lib/_helpers.js";
import { getDb, databaseErrorPayload } from "../lib/_db.js";
import { parseBookBody } from "../lib/_books.js";

/**
 * /api/books
 * GET  → list books (optional filters: genre, available, author)
 * POST → add a book to the library
 */
export default async function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowMethods(req, res, ["GET", "POST"])) return;

    const sql = getDb();

    if (req.method === "GET") {
      const genre = getQueryParam(req, "genre");
      const availableParam = getQueryParam(req, "available");
      const author = getQueryParam(req, "author");

      let books = await sql`
        SELECT
          id, title, author, genre, year, pages,
          language, available, summary, created_at, updated_at
        FROM books
        ORDER BY title ASC
      `;

      if (genre) {
        books = books.filter((book) => equalsIgnoreCase(book.genre, genre));
      }

      if (author) {
        books = books.filter((book) =>
          book.author.toLowerCase().includes(author.toLowerCase())
        );
      }

      if (availableParam !== null && availableParam !== undefined) {
        const wantAvailable = String(availableParam).toLowerCase() === "true";
        books = books.filter((book) => book.available === wantAvailable);
      }

      sendJson(res, 200, {
        success: true,
        count: books.length,
        data: books
      });
      return;
    }

    // POST — create a book
    const body = await readJsonBody(req);
    const parsed = parseBookBody(body);

    if (!parsed.ok) {
      sendJson(res, 400, {
        success: false,
        message: parsed.message
      });
      return;
    }

    const b = parsed.book;

    const [book] = await sql`
      INSERT INTO books (
        title, author, genre, year, pages, language, available, summary
      )
      VALUES (
        ${b.title},
        ${b.author},
        ${b.genre},
        ${b.year},
        ${b.pages},
        ${b.language},
        ${b.available},
        ${b.summary}
      )
      RETURNING
        id, title, author, genre, year, pages,
        language, available, summary, created_at, updated_at
    `;

    sendJson(res, 201, {
      success: true,
      message: "Book added to the library.",
      data: book
    });
  } catch (error) {
    const status = error?.code === "NO_DATABASE_URL" ? 503 : 500;
    sendJson(res, status, databaseErrorPayload(error));
  }
}
