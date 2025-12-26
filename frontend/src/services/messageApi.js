export const getMessagesByChat = async (chatId) => {
  const res = await fetch(
    `https://decmo.onrender.com/chat/${chatId}`,
    {
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load messages");
  }

  return res.json();
};

