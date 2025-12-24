const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { generateContent, generateVector } = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      if (!cookies.token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      socket.user = await userModel.findById(decoded.id);
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {

    socket.on("ai-message", async (payload) => {
      try {
        /* 1️⃣ Save user message */
        const userMessage = await messageModel.create({
          chat: payload.chat,
          user: socket.user._id,
          content: payload.content,
          role: "user",
        });

        /* 2️⃣ Generate embedding for user message */
        const vector = await generateVector(payload.content);

        /* 3️⃣ Query relevant memory (LTM) */
        const memory = await queryMemory({
          queryVector: vector,
          limit: 3,
          metadata: { user: socket.user._id.toString() },
        });

        /* 4️⃣ Store memory ONLY if meaningful */
        if (payload.content.length > 40) {
          await createMemory({
            vectors: vector,
            messageId: userMessage._id.toString(),
            metadata: {
              chat: payload.chat.toString(),
              user: socket.user._id.toString(),
              text: payload.content,
            },
          });
        }

        /* 5️⃣ Fetch chat history (STM) */
        const chatHistory = (
          await messageModel.find({ chat: payload.chat })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const stm = chatHistory.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));

        /* 6️⃣ BUILD PROMPT CORRECTLY */
        const prompt = [];

        // Always start with CURRENT question
        prompt.push({
          role: "user",
          parts: [{ text: payload.content }],
        });

        // Add STM (exclude last user message to avoid duplication)
        if (stm.length > 1) {
          prompt.push(...stm.slice(0, -1));
        }

        // Add LTM ONLY if it exists
        if (memory.length > 0) {
          prompt.push({
            role: "user",
            parts: [{
              text: `Relevant past context (use only if helpful):\n${memory
                .map(m => m.metadata.text)
                .join("\n")}`,
            }],
          });
        }

        /* 7️⃣ Generate AI response */
        const response = await generateContent(prompt);

        /* 8️⃣ Save AI response */
        const aiMessage = await messageModel.create({
          chat: payload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        });

        /* 9️⃣ Store AI memory (optional) */
        if (response.length > 40) {
          const responseVector = await generateVector(response);
          await createMemory({
            vectors: responseVector,
            messageId: aiMessage._id.toString(),
            metadata: {
              chat: payload.chat.toString(),
              user: socket.user._id.toString(),
              text: response,
            },
          });
        }

        /* 🔟 Send response */
        socket.emit("ai-response", {
          content: response,
          chat: payload.chat,
        });

      } catch (err) {
        console.error("AI SOCKET ERROR:", err);
        socket.emit("ai-response", {
          content: "Something went wrong. Please try again.",
        });
      }
    });

  });
}

module.exports = initSocketServer;
