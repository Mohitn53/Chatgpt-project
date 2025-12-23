require('dotenv').config()
const app = require('./src/app')
const connectToDB = require('./src/db/db')
const initSocketServer = require('./src/sockets/socket.server')
const httpServer = require('http').createServer(app);
initSocketServer(httpServer)
connectToDB()
httpServer.listen(3001,()=>{
    console.log('Server is running on port 3000')
})