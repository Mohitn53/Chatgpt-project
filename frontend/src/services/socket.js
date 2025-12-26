import { io } from "socket.io-client";

export const socket = io("https://decmo.onrender.com/", {
  withCredentials: true,
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket error:", err.message);
});
