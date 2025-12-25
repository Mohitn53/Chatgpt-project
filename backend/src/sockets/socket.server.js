const { Server } = require("socket.io");
const cookie = require("Cookie");
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
           0️⃣ CHAT GUARD (Detects New Chat)
        ===================================================== */
        let chatId = payload.chat;
        let isNewChat = false; // 🟢 We track if this is new

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
          const newChat = await chatModel.create({
            user: socket.user._id,
            title: "New Chat", // Starts as "New Chat"
          });
          chatId = newChat._id;
          isNewChat = true; // 🟢 Mark as true
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
           3️⃣ QUERY MEMORY
        ===================================================== */
        const memory = await queryMemory({
          queryVector: vector,
          limit: 3,
          metadata: { user: socket.user._id.toString() },
        });

        /* =====================================================
           4️⃣ STORE MEMORY
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
           5️⃣ FETCH HISTORY & BUILD PROMPT
        ===================================================== */
        const chatHistory = (
          await messageModel
            .find({ chat: chatId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const stm = chatHistory.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model', // Ensure roles match API expectations
          parts: [{ text: m.content }],
        }));

        // 🟢 Logic Fix: History must come BEFORE the current message
        const prompt = [];
        
        // Add Memory context if available
        if (memory.length > 0) {
            prompt.push({
                role: "user",
                parts: [{ text: `Context:\n${memory.map(m => m.metadata.text).join("\n")}` }]
            });
        }

        // Add History (excluding current message if it's already saved/fetched)
        // We filter out the message we just saved to avoid duplication
        const pastMessages = stm.filter(m => m.parts[0].text !== payload.content);
        if (pastMessages.length > 0) {
            prompt.push(...pastMessages);
        }

        // Add Current User Message
        prompt.push({
            role: "user",
            parts: [{ text: payload.content }]
        });

        /* =====================================================
           6️⃣ GENERATE RESPONSE
        ===================================================== */
        const response = await generateContent(prompt);

        /* =====================================================
           7️⃣ SAVE AI MESSAGE
        ===================================================== */
        const aiMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: response,
          role: "model",
        });

        /* =====================================================
           🟢 8️⃣ AUTO-TITLE GENERATOR (THE FIX)
           If this is a new chat, ask AI to rename it based on context
        ===================================================== */
        if (isNewChat) {
            try {
                // We run this asynchronously so it doesn't block the response
                const titlePrompt = [{
                    role: "user",
                    parts: [{ text: `Generate a very short chat title (max 4 words) summarizing this message: "${payload.content}"` }]
                }];
                
                // Ask AI for title
                const newTitle = await generateContent(titlePrompt);
                
                // Clean formatting (remove quotes if AI adds them)
                const cleanTitle = newTitle.replace(/["*]/g, '').trim();

                // Update Database
                await chatModel.findByIdAndUpdate(chatId, { title: cleanTitle });
                
                console.log(`Chat renamed to: ${cleanTitle}`);
            } catch (err) {
                console.error("Auto-title failed:", err);
            }
        }

        /* =====================================================
           9️⃣ EMIT RESPONSE
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