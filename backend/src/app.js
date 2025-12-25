const express = require('express')
const authRoutes = require('./routes/auth.routes')
const chatRoutes = require('./routes/chat.routes')
const messageRoutes = require('./routes/message.routes')
const cookieParser = require('cookie-parser')
const public = require('../public')
const app = express()
const path = require('path')
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json())
app.use(cookieParser())
app.use('/auth',authRoutes)
app.use('/user',chatRoutes)
app.use('/',messageRoutes)
app.use(express.static(path.join(__dirname,'../public')))

app.get('*name',(req,res)=>{
    res.sendFile(path.join(__dirname,'../public/index.html'))
})
module.exports = app