import { motion } from "framer-motion";

export default function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-xl px-4 py-2 rounded-xl text-sm ${
        isUser
          ? "ml-auto bg-blue-600 text-white"
          : "bg-white/10 text-gray-100"
      }`}
    >
      {text}
    </motion.div>
  );
}
