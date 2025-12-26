import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { socket } from "../../services/socket";
import { getMyChats, deleteChatApi, getUserProfile } from "../../services/chatApi"; 
import { getMessagesByChat } from "../../services/messageApi";

export default function ChatLayout() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 🟢 User State
  const [user, setUser] = useState({ username: "User", plan: "Pro Plan" });

  const activeChatIdRef = useRef(activeChatId);
  const messagesEndRef = useRef(null);
  const isChatCreating = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ================= 1. FETCH DATA (CHATS + USER) ================= */
  const initData = async () => {
    try {
      // Fetch Chats
      const chatData = await getMyChats();
      setChats(chatData?.chats || []);

      // 🟢 Fetch User Profile
      const profileData = await getUserProfile();
      
      if (profileData?.user) {
          setUser({
              username: profileData.user.username || "User",
              plan: "Pro Plan" 
          });
      }
    } catch (err) {
      console.error("Init Error:", err);
    }
  };

  useEffect(() => { initData(); }, []);

  /* ================= 2. LOGOUT (FIXED) ================= */
  const handleLogout = () => {
      // 1. Clear storage (Adjust keys if you use different ones)
      localStorage.removeItem("token"); 
      localStorage.removeItem("user");

      // 2. Force hard redirect to clear state and go to login
      window.location.href = "/login"; 
  };

  /* ================= 3. DELETE CHAT ================= */
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;

    setChats(prev => prev.filter(c => c._id !== chatId));

    if (activeChatId === chatId) {
        handleNewChat();
    }

    try {
        await deleteChatApi(chatId);
    } catch (err) {
        console.error("Delete failed", err);
        initData();
    }
  };

  /* ================= 4. LOAD MESSAGES ================= */
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    setIsSidebarOpen(false);

    if (isChatCreating.current) {
      isChatCreating.current = false;
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setMessages([]); 

        console.log("Fetching for ID:", activeChatId); 
        const data = await getMessagesByChat(activeChatId);
        const rawMessages = data?.messages || data?.data?.messages || [];

        setMessages(
          rawMessages.map((m) => ({
            role: m.role,
            text: m.content || m.text || "", 
          }))
        );
      } catch (err) {
        console.error("Message Load Error:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeChatId]);

  /* ================= 5. SOCKET LISTENERS ================= */
  useEffect(() => {
    const handleAiResponse = async (data) => {
      setMessages((prev) => [...prev, { role: "model", text: data.content }]);
      setIsSending(false);

      const currentChatId = activeChatIdRef.current;

      if (!currentChatId && data.chat) {
        isChatCreating.current = true; 
        setActiveChatId(data.chat);

        const userFirstMessage = messages.find(m => m.role === "user")?.text || "New Conversation";
        const topicName = userFirstMessage.slice(0, 30) + (userFirstMessage.length > 30 ? "..." : "");

        setChats(prev => [
            { _id: data.chat, title: topicName },
            ...prev
        ]);
        
        // Refresh to ensure ID is synced
        await initData(); 
      }
    };

    socket.on("ai-response", handleAiResponse);
    return () => socket.off("ai-response", handleAiResponse);
  }, [messages]); 

  useEffect(() => { scrollToBottom(); }, [messages, isSending, isLoadingMessages]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setIsSending(false);
    isChatCreating.current = false;
    setIsSidebarOpen(false);
  };

  const sendMessage = () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    socket.emit("ai-message", { content: input, chat: activeChatId || null });
    setInput("");
  };

  return (
    // 🟢 BACKGROUND: Deep gradient for glass effect
    <div className="h-screen flex bg-gradient-to-br from-gray-950 via-[#0a0a12] to-[#0f1020] text-white font-sans overflow-hidden relative selection:bg-blue-500/30">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white/5 backdrop-blur-xl border-b border-white/5 flex items-center px-4 z-20 shadow-lg">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white/70 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </button>
        <span className="ml-3 font-semibold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">DecMo AI</span>
      </div>

      {/* SIDEBAR */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 
        bg-black/20 backdrop-blur-2xl border-r border-white/5 shadow-2xl
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 pt-6">
            <button onClick={handleNewChat} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-white shadow-lg shadow-black/20">
                <span className="text-xl leading-none font-light">+</span> New Chat
            </button>
        </div>
            
        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
            {activeChatId === null && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl mb-2 text-sm animate-pulse">✨ New Topic...</div>
            )}
            
            {chats.map((chat) => (
            <div key={chat._id} onClick={() => setActiveChatId(chat._id)} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition-all duration-200 ${activeChatId === chat._id ? "bg-white/10 text-white font-medium border border-white/5 shadow-md" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                <span className="truncate flex-1">{chat.title || "Untitled Chat"}</span>
                <button onClick={(e) => handleDeleteChat(e, chat._id)} className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 text-white/40 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                </button>
            </div>
            ))}
        </div>

        {/* 🟢 USER PROFILE */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold text-white/90">{user.username}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                            <p className="text-xs text-white/50">{user.plan}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all" 
                    title="Log Out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                </button>
            </div>
        </div>
      </div>
      
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm" />}

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative h-full pt-16 md:pt-0">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 custom-scrollbar scroll-smooth">
          {isLoadingMessages && <div className="flex justify-center items-center h-full text-white/30 animate-pulse">Loading messages...</div>}

          {!isLoadingMessages && messages.length === 0 && !isSending && (
             <div className="h-full flex flex-col items-center justify-center text-white/20 select-none">
                <div className="p-6 rounded-3xl bg-white/5 mb-6 shadow-2xl shadow-black/50 border border-white/5">
                    <span className="text-5xl opacity-80">🔮</span>
                </div>
                <p className="text-lg font-light text-white/60">How can I help you today?</p>
             </div>
          )}

          {!isLoadingMessages && messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl px-6 py-4 rounded-3xl backdrop-blur-sm border ${
                  m.role === "user" 
                  ? "bg-blue-600/80 text-white rounded-br-none border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                  : "bg-white/5 text-gray-200 rounded-bl-none border-white/10 shadow-lg"
              }`}>
                {m.role === "user" ? <div className="whitespace-pre-wrap font-sans">{m.text}</div> : (
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                                <div className="rounded-xl overflow-hidden my-3 border border-white/10 shadow-2xl bg-black/50">
                                    <div className="bg-white/5 px-4 py-2 text-xs text-white/50 border-b border-white/5 flex justify-between select-none"><span className="font-mono font-bold text-blue-400">{match[1].toUpperCase()}</span></div>
                                    <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{margin: 0, padding: '1.5rem', background: 'transparent'}} {...props}>{String(children).replace(/\n$/, "")}</SyntaxHighlighter>
                                </div>
                            ) : (<code className="bg-white/10 px-1.5 py-0.5 rounded text-orange-300 font-mono text-xs" {...props}>{children}</code>);
                            }
                        }}>{m.text}</ReactMarkdown>
                    </div>
                )}
              </div>
            </div>
          ))}
          {isSending && (
              <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-3xl rounded-bl-none px-6 py-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 md:p-6 pt-0">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
            <TextareaAutosize minRows={1} maxRows={5} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} disabled={isSending} className="flex-1 bg-transparent border-none outline-none text-white px-3 py-3 resize-none custom-scrollbar placeholder:text-white/20 text-base" placeholder="Message DecMo..." />
            <button onClick={sendMessage} disabled={isSending || !input.trim()} className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" /></svg>
            </button>
          </div>
          <div className="text-center mt-3 text-[11px] text-white/20 hidden md:block">
             DecMo AI can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}