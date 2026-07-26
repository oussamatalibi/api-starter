/**
 * Shared helpers for validating library (biblio) book data.
 */

import { cleanText } from "./_helpers.js";

const ALLOWED_GENRES = [
  "fiction",
  "science",
  "history",
  "technology",
  "comics",
  "poetry",
  "biography",
  "other"
];

/**
 * Parse and validate a book from a request body.
 * Returns { ok: true, book } or { ok: false, message }.
 */
export function parseBookBody(body) {
  const title = cleanText(body.title, 150);
  const author = cleanText(body.author, 100);
  const genre = cleanText(body.genre, 50).toLowerCase();
  const language = cleanText(body.language || "English", 30);
  const summary = cleanText(body.summary || "", 300);

  const year = Number(body.year);
  const pages = body.pages === undefined || body.pages === "" ? null : Number(body.pages);

  let available = true;
  if (typeof body.available === "boolean") {
    available = body.available;
  } else if (typeof body.available === "string") {
    available = body.available.toLowerCase() === "true";
  }

  if (!title || !author || !genre) {
    return {
      ok: false,
      message: "title, author, and genre are required."
    };
  }

  if (!ALLOWED_GENRES.includes(genre)) {
    return {
      ok: false,
      message: `genre must be one of: ${ALLOWED_GENRES.join(", ")}.`
    };
  }

  if (!Number.isInteger(year) || year < 1000 || year > 2100) {
    return {
      ok: false,
      message: "year must be a valid number between 1000 and 2100."
    };
  }

  if (pages !== null && (!Number.isInteger(pages) || pages < 1 || pages > 5000)) {
    return {
      ok: false,
      message: "pages must be a whole number between 1 and 5000."
    };
  }

  return {
    ok: true,
    book: {
      title,
      author,
      genre,
      year,
      pages,
      language,
      available,
      summary
    }
  };
}

export { ALLOWED_GENRES };
