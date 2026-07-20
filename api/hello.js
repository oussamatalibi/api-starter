import { handleOptions, allowGetOnly, sendJson } from "./_helpers.js";

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    sendJson(res, 200, {
      success: true,
      message: "Hello students!",
      teacher: "Oussama",
      lesson: "Introduction to APIs",
      description: "This API was created for learning how fetch() works."
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
