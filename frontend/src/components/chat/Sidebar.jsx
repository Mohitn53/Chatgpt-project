import { Plus } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-72 glass border-r border-white/10 p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">DecMo</h2>

      <button className="flex items-center gap-2 text-sm text-blue-400 hover:opacity-80 mb-4">
        <Plus size={16} />
        New Chat
      </button>

      <div className="flex-1 text-gray-400 text-sm">
        No chats yet
      </div>
    </div>
  );
}
