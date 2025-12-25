const chatModel = require('../models/chat.model')
const chatController = async(req,res)=>{
    const {title} = req.body
    const user = req.user
   const chat =  await chatModel.create({
        user:user._id,
        title
    })
    res.status(201).json({
        message:"Chat created sucessfully",
        chat
    })
}
const getUserChats = async (req, res) => {
  const user = req.user;

  const chats = await chatModel
    .find({ user: user._id })
    .sort({ updatedAt: -1 });

  res.status(200).json({
    chats,
  });
};

module.exports = {
    chatController,
    getUserChats
}