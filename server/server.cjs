const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ==================================================
// GEMINI SETUP
// ==================================================

if (!process.env.GEMINI_API_KEY) {
  console.error("========================================");
  console.error("ERROR: GEMINI_API_KEY is missing.");
  console.error("Please add it to your .env file.");
  console.error("========================================");

  process.exit(1);
}

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

// ==================================================
// TEST ROUTE
// ==================================================

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Gemini AI Chatbot API is running",
  });
});

// ==================================================
// CHAT ROUTE
// ==================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    // ----------------------------------------------
    // Validate messages
    // ----------------------------------------------

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array.",
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        error: "At least one message is required.",
      });
    }

    // ----------------------------------------------
    // Validate individual messages
    // ----------------------------------------------

    const validMessages = messages.filter((message) => {
      return (
        message &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        (message.role === "user" ||
          message.role === "assistant")
      );
    });

    if (validMessages.length === 0) {
      return res.status(400).json({
        error: "No valid messages were provided.",
      });
    }

    // ----------------------------------------------
    // Convert messages to Gemini format
    // ----------------------------------------------

    const conversation = validMessages.map((message) => {
      return {
        type:
          message.role === "assistant"
            ? "model_output"
            : "user_input",

        content: [
          {
            type: "text",
            text: message.content.trim(),
          },
        ],
      };
    });

    // ----------------------------------------------
    // Send conversation to Gemini
    // ----------------------------------------------

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",

      input: conversation,

      store: false,
    });

    // ----------------------------------------------
    // Get AI response
    // ----------------------------------------------

    const aiResponse = interaction.output_text;

    if (!aiResponse) {
      return res.status(500).json({
        error: "Gemini returned an empty response.",
      });
    }

    // ----------------------------------------------
    // Send response to React
    // ----------------------------------------------

    res.status(200).json({
      message: aiResponse,
    });
  } catch (error) {
    console.error("========================================");
    console.error("Gemini API Error:");
    console.error(error);
    console.error("========================================");

    res.status(500).json({
      error:
        "The AI service could not process your request. Please try again.",
    });
  }
});

// ==================================================
// HANDLE UNKNOWN ROUTES
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

// ==================================================
// START SERVER
// ==================================================

app.listen(PORT, () => {
  console.log("========================================");
  console.log("Gemini AI Chatbot Backend");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("Status: Running");
  console.log("========================================");
});
