export const getMessagesByChat = async (chatId) => {
  const res = await fetch(
    `http://localhost:3001/api/message/chat/${chatId}`,
    {
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load messages");
  }

  return res.json();
};
