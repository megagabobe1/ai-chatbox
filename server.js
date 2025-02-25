const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());

// ✅ FIX: Explicitly allow all origins, including Wix & Ngrok
app.use(cors({
    origin: "*",  // Allows requests from anywhere
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true
}));

const OLLAMA_API_URL = "http://localhost:11434/api/generate";

app.post("/chat", async (req, res) => {
    try {
        console.log("Received request:", req.body);
        const { model, prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Message is required" });
        }

        const formattedPrompt = `
        You are an AI assistant.
        ONLY provide direct responses to the user's message.
        DO NOT include "<think>" tags or descriptions of your thought process.
        DO NOT explain how you generate responses.
        DO NOT apologize—just answer concisely like a human.

        User: ${prompt}
        AI:
        `;

        const response = await axios.post(OLLAMA_API_URL, {
            model: model || "deepseek-r1:8b",
            prompt: formattedPrompt,
            stream: false
        });

        let aiResponse = response.data.response || "";
        aiResponse = aiResponse.replace(/<\/?think>/g, "").trim();

        console.log("Clean AI Response:", aiResponse);
        res.json({ model: model, response: aiResponse, done: response.data.done });

    } catch (error) {
        console.error("Error calling Ollama:", error.response?.data || error.message);
        res.status(500).json({ error: "Error calling Ollama API" });
    }
});

// ✅ Handle OPTIONS Preflight Requests (Important for CORS!)
app.options("/chat", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
});

// ✅ Serve a simple landing page
app.get("/", (req, res) => {
    res.send("🚀 AI Chat Server is Running! Use it on your Wix site.");
});

// ✅ Allow external access via Ngrok
const PORT = 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running at: http://localhost:${PORT}`);
});
