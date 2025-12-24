import { motion } from "framer-motion";

export default function Button({ children, loading, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading}
      className="
        w-full
        bg-gradient-to-r from-blue-500 to-purple-600
        py-2 rounded-lg
        font-medium
        shadow-lg
        hover:opacity-90
        disabled:opacity-60
        transition
      "
      {...props}
    >
      {loading ? "Please wait..." : children}
    </motion.button>
  );
}
