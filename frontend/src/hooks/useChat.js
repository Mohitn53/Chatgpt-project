import { useEffect, useState, useRef } from "react";
import { connectSocket } from "../services/socket";

export default function useChat(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = connectSocket();

    socketRef.current.on("ai-response", (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.content },
      ]);
      setLoading(false);
    });

    return () => {
      socketRef.current.off("ai-response");
    };
  }, []);

  const sendMessage = (text) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    socketRef.current.emit("ai-message", {
      chat: chatId,
      content: text,
    });
  };

  return {
    messages,
    sendMessage,
    loading,
  };
}
