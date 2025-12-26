export const getMyChats = async () => {
  const res = await fetch("http://localhost:3001/user/chats", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch chats");
  }

  return res.json();
};
export const deleteChatApi = async (chatId) => {
  // We assume the delete route is at /chat/:id
  const res = await fetch(`http://localhost:3001/user/chats/${chatId}`, {
    method: "DELETE", // This tells the backend to delete
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to delete chat");
  }

  return res.json();
};

export const getUserProfile = async () => {
  const res = await fetch(`https://chatgpt-project-kise.onrender.com/auth/me`, { 
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to load profile");
  }

  return res.json();
};