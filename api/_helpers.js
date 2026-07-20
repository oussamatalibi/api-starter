/**
 * Shared helpers for all API endpoints.
 * Files starting with "_" are not turned into public routes on Vercel.
 */

// CORS headers so students can call the API from local HTML / Live Server
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

/**
 * Send a JSON response with CORS headers.
 */
export function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");

  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  res.end(JSON.stringify(data));
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 * Returns true if the request was handled.
 */
export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.setHeader(key, value);
    }
    res.end();
    return true;
  }
  return false;
}

/**
 * Only allow GET (and OPTIONS, which is handled separately).
 */
export function allowGetOnly(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, {
      success: false,
      message: "Method not allowed. Use GET."
    });
    return false;
  }
  return true;
}

/**
 * Pick a random item from an array.
 */
export function pickRandom(items) {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

/**
 * Compare two strings without caring about uppercase/lowercase.
 */
export function equalsIgnoreCase(a, b) {
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Read one query parameter from a Vercel/Node request.
 * Works with req.query (Vercel) and with URL search params.
 */
export function getQueryParam(req, name) {
  if (req.query && req.query[name] !== undefined) {
    const value = req.query[name];
    return Array.isArray(value) ? value[0] : value;
  }

  try {
    const host = req.headers?.host || "localhost";
    const url = new URL(req.url, `http://${host}`);
    return url.searchParams.get(name);
  } catch {
    return null;
  }
}