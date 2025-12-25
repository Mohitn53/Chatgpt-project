import { useEffect, useState, useRef } from "react";
import { socket } from "../../services/socket";
import { getMyChats } from "../../services/chatApi";
import { getMessagesByChat } from "../../services/messageApi";

export default function ChatLayout() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  
  // 🟢 UX STATE: Loading indicators
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 🟢 UX FIX: Ref for auto-scrolling
  const messagesEndRef = useRef(null);

  /* ================= UTILS ================= */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  /* ================= FETCH CHATS ================= */
  useEffect(() => {
    const loadChats = async () => {
      try {
        setIsChatsLoading(true);
        const data = await getMyChats();
        setChats(data.chats);
        if (data.chats.length > 0) {
          setActiveChatId(data.chats[0]._id);
        }
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setIsChatsLoading(false);
      }
    };
    loadChats();
  }, []);

  /* ================= FETCH MESSAGES ================= */
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      try {
        setIsMessagesLoading(true);
        const data = await getMessagesByChat(activeChatId);
        setMessages(
          data.messages.map((m) => ({
            role: m.role,
            text: m.content,
          }))
        );
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setIsMessagesLoading(false);
      }
    };

    loadMessages();
  }, [activeChatId]);

  /* ================= AUTO SCROLL ================= */
  // 🟢 UX FIX: Scroll whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isMessagesLoading]);

  /* ================= SOCKET LISTENER ================= */
  // 🟢 CRITICAL FIX: Move socket listener inside useEffect to prevent duplicates
  useEffect(() => {
    const handleAiResponse = async (data) => {
      setIsSending(false); // Stop loading animation
      setMessages((prev) => [...prev, { role: "model", text: data.content }]);

      // If this was a new chat creation, update the active ID and refresh sidebar
      if (!activeChatId && data.chat) {
        setActiveChatId(data.chat);
        const updatedChats = await getMyChats();
        setChats(updatedChats.chats);
      }
    };

    socket.on("ai-response", handleAiResponse);

    // Cleanup listener on unmount
    return () => {
      socket.off("ai-response", handleAiResponse);
    };
  }, [activeChatId]); 

  /* ================= SEND MESSAGE ================= */
  const sendMessage = () => {
    if (!input.trim() || isSending) return;

    setIsSending(true); // Start loading animation
    setMessages((prev) => [...prev, { role: "user", text: input }]);

    socket.emit("ai-message", {
      content: input,
      chat: activeChatId,
    });

    setInput("");
  };

  // 🟢 UX FIX: Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-black text-white font-sans selection:bg-blue-500/30">
      
      {/* ===== SIDEBAR ===== */}
      <div className="w-72 border-r border-white/10 flex flex-col bg-zinc-950/50">
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleNewChat}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>+</span> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {isChatsLoading ? (
             <div className="text-center text-white/30 text-sm mt-4">Loading history...</div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => setActiveChatId(chat._id)}
                className={`p-3 text-sm rounded-lg cursor-pointer transition-colors truncate ${
                  activeChatId === chat._id
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {chat.title || "Untitled Chat"}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Empty State */}
          {messages.length === 0 && !isMessagesLoading && (
            <div className="h-full flex flex-col items-center justify-center text-white/20">
              <p className="text-2xl font-semibold mb-2">How can I help?</p>
              <p className="text-sm">Start a new conversation with DecMo</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl p-4 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-zinc-800/80 text-gray-100 rounded-bl-none border border-white/5"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* AI Typing/Loading Indicator */}
          {isSending && (
            <div className="flex justify-start animate-pulse">
               <div className="bg-zinc-800/80 p-4 rounded-2xl rounded-bl-none border border-white/5 text-white/50 text-sm">
                  DecMo is thinking...
               </div>
            </div>
          )}

          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* ===== INPUT AREA ===== */}
        <div className="p-4 border-t border-white/10 bg-black/90 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="flex-1 bg-zinc-900 border border-white/10 focus:border-blue-500/50 rounded-xl px-5 py-3 outline-none transition-all placeholder:text-white/20 disabled:opacity-50"
              placeholder={isSending ? "Waiting for response..." : "Ask anything..."}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="absolute right-2 p-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 transition-all"
            >
              {/* Simple Send Icon SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-white/20">
            DecMo can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  );
}