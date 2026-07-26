import { students } from "../data/students.js";
import {
  handleOptions,
  allowGetOnly,
  sendJson,
  equalsIgnoreCase,
  getQueryParam
} from "../lib/_helpers.js";

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    const city = getQueryParam(req, "city");
    const level = getQueryParam(req, "level");
    const language = getQueryParam(req, "language");

    let results = [...students];

    // Filters are case-insensitive and can be combined
    if (city) {
      results = results.filter((student) =>
        equalsIgnoreCase(student.city, city)
      );
    }

    if (level) {
      results = results.filter((student) =>
        equalsIgnoreCase(student.level, level)
      );
    }

    if (language) {
      results = results.filter((student) =>
        equalsIgnoreCase(student.favoriteLanguage, language)
      );
    }

    sendJson(res, 200, {
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
