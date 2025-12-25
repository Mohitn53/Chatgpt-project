import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import useChat from "../../hooks/useChat";
import { useState } from "react";
export default function ChatWindow() {
  const { messages, sendMessage, loading } = useChat("default-chat");
  const [chatId, setChatId] = useState(null);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="glass border-b border-white/10 px-6 py-4">
        <h3 className="text-lg font-medium">DecMo Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <MessageBubble
            role="model"
            text="Hi 👋 I am DecMo. Ask me anything."
          />
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} text={msg.text} />
        ))}

        {loading && (
          <MessageBubble role="model" text="DecMo is typing..." />
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
