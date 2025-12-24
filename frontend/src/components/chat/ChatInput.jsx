import { Send } from "lucide-react";
import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    onSend(text);
    setText("");
  };

  return (
    <div className="glass border-t border-white/10 p-4 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Ask DecMo..."
        className="
          flex-1 bg-transparent border border-white/20
          rounded-lg px-4 py-2 outline-none
          focus:border-blue-500 transition
          disabled:opacity-50
        "
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        className="bg-blue-600 p-2 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
