const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userModel = require("../models/user.model");
const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");

const { generateContent, generateVector } = require("../services/ai.service");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  /* ===================== AUTH MIDDLEWARE ===================== */
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

  /* ===================== CONNECTION ===================== */
  io.on("connection", (socket) => {
    console.log("A user connected", socket.user._id.toString());

    socket.on("ai-message", async (payload) => {
      try {
        /* =====================================================
           0️⃣ CHAT GUARD (ONLY ADDITION – DOES NOT BREAK LOGIC)
        ===================================================== */
        let chatId = payload.chat;

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
          const newChat = await chatModel.create({
            user: socket.user._id,
            title: "New Chat",
          });
          chatId = newChat._id;
        }

        /* =====================================================
           1️⃣ SAVE USER MESSAGE
        ===================================================== */
        const userMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: payload.content,
          role: "user",
        });

        /* =====================================================
           2️⃣ EMBEDDING
        ===================================================== */
        const vector = await generateVector(payload.content);

        /* =====================================================
           3️⃣ QUERY MEMORY (LTM)
        ===================================================== */
        const memory = await queryMemory({
          queryVector: vector,
          limit: 3,
          metadata: { user: socket.user._id.toString() },
        });

        /* =====================================================
           4️⃣ STORE MEMORY (ONLY IF MEANINGFUL)
        ===================================================== */
        if (payload.content.length > 40) {
          await createMemory({
            vectors: vector,
            messageId: userMessage._id.toString(),
            metadata: {
              chat: chatId.toString(),
              user: socket.user._id.toString(),
              text: payload.content,
            },
          });
        }

        /* =====================================================
           5️⃣ FETCH CHAT HISTORY (STM)
        ===================================================== */
        const chatHistory = (
          await messageModel
            .find({ chat: chatId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const stm = chatHistory.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));

        /* =====================================================
           6️⃣ BUILD PROMPT (UNCHANGED LOGIC)
        ===================================================== */
        const prompt = [];

        prompt.push({
          role: "user",
          parts: [{ text: payload.content }],
        });

        if (stm.length > 1) {
          prompt.push(...stm.slice(0, -1));
        }

        if (memory.length > 0) {
          prompt.push({
            role: "user",
            parts: [
              {
                text: `Relevant past context (use only if helpful):\n${memory
                  .map((m) => m.metadata.text)
                  .join("\n")}`,
              },
            ],
          });
        }

        /* =====================================================
           7️⃣ AI RESPONSE
        ===================================================== */
        const response = await generateContent(prompt);

        /* =====================================================
           8️⃣ SAVE AI MESSAGE
        ===================================================== */
        const aiMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: response,
          role: "model",
        });

        /* =====================================================
           9️⃣ STORE AI MEMORY (OPTIONAL)
        ===================================================== */
        if (response.length > 40) {
          const responseVector = await generateVector(response);
          await createMemory({
            vectors: responseVector,
            messageId: aiMessage._id.toString(),
            metadata: {
              chat: chatId.toString(),
              user: socket.user._id.toString(),
              text: response,
            },
          });
        }

        /* =====================================================
           🔟 EMIT RESPONSE (SEND REAL chatId BACK)
        ===================================================== */
        socket.emit("ai-response", {
          content: response,
          chat: chatId,
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
