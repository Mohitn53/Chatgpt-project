import Sidebar from "../../components/chat/Sidebar";
import ChatWindow from "../../components/chat/ChatWindow";

export default function ChatLayout() {
  return (
    <div className="h-screen w-full flex bg-black">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
