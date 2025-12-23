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

module.exports = {
    chatController,
}