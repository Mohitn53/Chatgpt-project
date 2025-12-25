const chatModel = require('../models/chat.model');
// 🟢 Import messageModel so we can delete messages when a chat is deleted
const messageModel = require('../models/message.model'); 

const chatController = async (req, res) => {
    try {
        const { title } = req.body;
        const user = req.user;
        const chat = await chatModel.create({
            user: user._id,
            title
        });
        res.status(201).json({
            message: "Chat created successfully",
            chat
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to create chat" });
    }
};

const getUserChats = async (req, res) => {
    try {
        const user = req.user;
        const chats = await chatModel
            .find({ user: user._id })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            chats,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch chats" });
    }
};

// 🟢 NEW FUNCTION: Delete Chat
const deleteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Delete the chat document
        // We check 'user: user._id' to make sure users can only delete their OWN chats
        const deletedChat = await chatModel.findOneAndDelete({ 
            _id: id, 
            user: user._id 
        });

        if (!deletedChat) {
            return res.status(404).json({ message: "Chat not found or unauthorized" });
        }

        // 2. Delete all messages associated with this chat
        await messageModel.deleteMany({ chat: id });

        res.status(200).json({ message: "Chat deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    chatController,
    getUserChats,
    deleteChat // <--- Added to exports
};