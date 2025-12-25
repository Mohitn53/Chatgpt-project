export const getMyChats = async () => {
  const res = await fetch("http://localhost:3001/user/chats", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch chats");
  }

  return res.json();
};
