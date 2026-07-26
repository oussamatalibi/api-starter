import {
  handleOptions,
  allowMethods,
  sendJson,
  readJsonBody
} from "../../lib/_helpers.js";
import { getDb, databaseErrorPayload } from "../../lib/_db.js";
import { parseBookBody } from "../../lib/_books.js";

/**
 * /api/books/[id]
 * GET    → one book
 * PUT    → update a book
 * DELETE → remove a book from the library
 */
export default async function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowMethods(req, res, ["GET", "PUT", "DELETE"])) return;

    const idParam = req.query?.id;
    const id = Number(Array.isArray(idParam) ? idParam[0] : idParam);

    if (!idParam || Number.isNaN(id) || id < 1) {
      sendJson(res, 400, {
        success: false,
        message: "A valid book id is required."
      });
      return;
    }

    const sql = getDb();

    if (req.method === "GET") {
      const [book] = await sql`
        SELECT
          id, title, author, genre, year, pages,
          language, available, summary, created_at, updated_at
        FROM books
        WHERE id = ${id}
      `;

      if (!book) {
        sendJson(res, 404, {
          success: false,
          message: "Book not found."
        });
        return;
      }

      sendJson(res, 200, {
        success: true,
        data: book
      });
      return;
    }

    if (req.method === "PUT") {
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
        UPDATE books
        SET
          title = ${b.title},
          author = ${b.author},
          genre = ${b.genre},
          year = ${b.year},
          pages = ${b.pages},
          language = ${b.language},
          available = ${b.available},
          summary = ${b.summary},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING
          id, title, author, genre, year, pages,
          language, available, summary, created_at, updated_at
      `;

      if (!book) {
        sendJson(res, 404, {
          success: false,
          message: "Book not found."
        });
        return;
      }

      sendJson(res, 200, {
        success: true,
        message: "Book updated.",
        data: book
      });
      return;
    }

    // DELETE
    const [deleted] = await sql`
      DELETE FROM books
      WHERE id = ${id}
      RETURNING
        id, title, author, genre, year, pages,
        language, available, summary, created_at, updated_at
    `;

    if (!deleted) {
      sendJson(res, 404, {
        success: false,
        message: "Book not found."
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      message: "Book removed from the library.",
      data: deleted
    });
  } catch (error) {
    const status = error?.code === "NO_DATABASE_URL" ? 503 : 500;
    sendJson(res, status, databaseErrorPayload(error));
  }
}
