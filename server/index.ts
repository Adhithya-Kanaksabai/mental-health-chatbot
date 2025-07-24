import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Readable } from "stream";
import axios from "axios";

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "openai/gpt-4o", // Or try "anthropic/claude-3-sonnet", "google/gemini-pro"
        messages,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173", // required by OpenRouter
          "X-Title": "mental-health-chatbot", // required
        },
        responseType: "stream",
      }
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    response.data.on("data", (chunk: Buffer) => {
      const payloads = chunk.toString().split("\n\n");
      for (const payload of payloads) {
        if (payload.includes("[DONE]")) {
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
        if (payload.startsWith("data: ")) {
          try {
            const json = JSON.parse(payload.replace("data: ", ""));
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${JSON.stringify(json)}\n\n`);
            }
          } catch (err) {
            console.error("Error parsing JSON:", err);
          }
        }
      }
    });

    response.data.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    response.data.on("error", (err: any) => {
      console.error("Streaming error:", err);
      res.status(500).send("Error in streaming response");
    });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
