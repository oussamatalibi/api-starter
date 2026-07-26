import { jokes } from "../data/jokes.js";
import {
  handleOptions,
  allowGetOnly,
  sendJson,
  pickRandom,
  getQueryParam
} from "../lib/_helpers.js";

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    const all = getQueryParam(req, "all");

    // /api/jokes?all=true returns every joke
    if (all && all.toLowerCase() === "true") {
      sendJson(res, 200, {
        success: true,
        count: jokes.length,
        data: jokes
      });
      return;
    }

    const randomJoke = pickRandom(jokes);

    sendJson(res, 200, {
      success: true,
      data: randomJoke
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
