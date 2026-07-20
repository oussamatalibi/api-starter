import { facts } from "../data/facts.js";
import {
  handleOptions,
  allowGetOnly,
  sendJson,
  pickRandom,
  equalsIgnoreCase,
  getQueryParam
} from "./_helpers.js";

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    const category = getQueryParam(req, "category");

    let selectedFacts = facts;

    // Optional filter: /api/fact?category=science
    if (category) {
      selectedFacts = facts.filter((item) =>
        equalsIgnoreCase(item.category, category)
      );

      if (selectedFacts.length === 0) {
        sendJson(res, 404, {
          success: false,
          message: "Category not found."
        });
        return;
      }
    }

    const randomFact = pickRandom(selectedFacts);

    sendJson(res, 200, {
      success: true,
      data: randomFact,
      totalFacts: selectedFacts.length
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
