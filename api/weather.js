import {
  handleOptions,
  allowGetOnly,
  sendJson,
  equalsIgnoreCase,
  getQueryParam
} from "./_helpers.js";

// Fictional weather data for classroom practice only
const weatherData = [
  {
    city: "Tangier",
    temperature: 24,
    condition: "Sunny",
    humidity: 65,
    windSpeed: 12,
    unit: "Celsius"
  },
  {
    city: "Casablanca",
    temperature: 22,
    condition: "Partly Cloudy",
    humidity: 70,
    windSpeed: 15,
    unit: "Celsius"
  },
  {
    city: "Rabat",
    temperature: 21,
    condition: "Cloudy",
    humidity: 68,
    windSpeed: 10,
    unit: "Celsius"
  },
  {
    city: "Marrakech",
    temperature: 30,
    condition: "Hot and Sunny",
    humidity: 35,
    windSpeed: 8,
    unit: "Celsius"
  },
  {
    city: "Fez",
    temperature: 26,
    condition: "Clear",
    humidity: 45,
    windSpeed: 9,
    unit: "Celsius"
  },
  {
    city: "Agadir",
    temperature: 27,
    condition: "Breezy",
    humidity: 55,
    windSpeed: 18,
    unit: "Celsius"
  }
];

export default function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    const city = getQueryParam(req, "city");

    const note =
      "This weather data is fictional and only for API practice. It is not real weather.";

    // No city parameter → return all cities
    if (!city) {
      sendJson(res, 200, {
        success: true,
        note,
        count: weatherData.length,
        data: weatherData
      });
      return;
    }

    const match = weatherData.find((item) =>
      equalsIgnoreCase(item.city, city)
    );

    if (!match) {
      sendJson(res, 404, {
        success: false,
        message: "City not found.",
        note
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      note,
      data: match
    });
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      message: "Something went wrong on the server."
    });
  }
}
