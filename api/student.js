import { students } from "../data/students.js";
import {
  handleOptions,
  allowGetOnly,
  sendJson,
  getQueryParam
} from "./_helpers.js";

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    const idParam = getQueryParam(req, "id");

    if (!idParam) {
      sendJson(res, 400, {
        success: false,
        message: "Student ID is required."
      });
      return;
    }

    const id = Number(idParam);

    if (Number.isNaN(id)) {
      sendJson(res, 400, {
        success: false,
        message: "Student ID must be a number."
      });
      return;
    }

    const student = students.find((item) => item.id === id);

    if (!student) {
      sendJson(res, 404, {
        success: false,
        message: "Student not found."
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      data: student
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
