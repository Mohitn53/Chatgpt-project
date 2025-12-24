const { Server } = require("socket.io");
const cookie = require('cookie')
const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");
const {generateContent,generateVector} = require("../services/ai.service");
const messageModel = require("../models/message.model");
const chatModel = require("../models/chat.model");
const {createMemory,queryMemory} = require('../services/vector.service');




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

        socket.on('ai-message',async(payload)=>{
           const message =  await messageModel.create({
                user:socket.user._id,
                chat:payload.chat,
                content:payload.content,
                role:"user"
            })

        const vector = await generateVector(payload.content)

        const memory  = await queryMemory({
                queryVector:vector,
                limit:3,
                metadata:{
                    user:socket.user._id.toString()
                }
            })


        await createMemory({
            vectors: vector,
            messageId: message._id.toString(),  // ✅ FIX
            metadata: {
            chat: payload.chat.toString(),
            user: socket.user._id.toString(),
            text:message.content
            }
        });


        const chatHistory = (await messageModel.find({
                chat:payload.chat
            }).sort({createdAt:-1}).limit(20).lean()).reverse()


        const stm = chatHistory.map(item=>{
                return(
                    {
                        role:item.role,
                        parts:[{text:item.content}]
                    }
                )
            })
        
        const ltm = [{
            role:'user',
            parts:[{
                text:`
                This are some related chats you can use them to generate response
                ${memory.map(item=>item.metadata.text).join("\n")}  `
            }]
        }]

        const content = await generateContent([...ltm,...stm])


        socket.emit('ai-response',{
                content
            })


        const responseMessage = await messageModel.create({
                user:socket.user._id,
                chat:payload.chat,
                content:content,
                role:"model"
            })


        const responseVector = await generateVector(responseMessage.content)


        await createMemory({
            vectors: responseVector,
            messageId: responseMessage._id.toString(), // ✅ FIX
            metadata: {
                chat: payload.chat.toString(),
                user: socket.user._id.toString(),
                text:responseMessage.content
            }
            });
        })
    });
}

module.exports = initSocketServer

