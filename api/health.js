import { handleOptions, allowGetOnly, sendJson } from "./_helpers.js";

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    sendJson(res, 200, {
      success: true,
      status: "online",
      service: "Student Learning API",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
