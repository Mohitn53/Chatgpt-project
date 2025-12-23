const { Server } = require("socket.io");
const cookie = require('cookie')
const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");
const generateContent = require("../services/ai.service");
const messageModel = require("../models/message.model");
const chatModel = require("../models/chat.model");
const initSocketServer = (httpServer)=>{
    const io = new Server(httpServer, {});
    io.use(async(socket,next)=>{
        const cookies = cookie.parse(socket.handshake?.headers?.cookie || '') 
        if(!cookies){
            next(new Error('Authentication Error'))
        }
        try {            
            const decoded = jwt.verify(cookies.token,process.env.JWT_SECRET)
            const user = await userModel.findOne({
                _id:decoded.id
            })
            socket.user = user
            next()

        } catch (error) {
            next(new Error(error))
        }
    })
  
    io.on("connection",async (socket) => {
        console.log('User connected',socket.user)
        console.log('Socket id:',socket.id)
        socket.on('ai-message',async(payload)=>{
            await messageModel.create({
                user:socket.user._id,
                chat:payload.chat,
                content:payload.content,
                role:"user"
            })
            const chatHistory = await messageModel.find({
                chat:payload.chat
            })
            const aireq = chatHistory.map(item=>{
                return(
                    {
                        role:item.role,
                        parts:[{text:item.content}]
                    }
                )
            })
            const content = await generateContent(aireq)
            socket.emit('ai-response',{
                content
            })
            await messageModel.create({
                user:socket.user._id,
                chat:payload.chat,
                content:content,
                role:"model"
            })
        })
    });
}

module.exports = initSocketServer

