const express = require('express')
const authRoutes = require('./routes/auth.routes')
const chatRoutes = require('./routes/chat.routes')
const cookieParser = require('cookie-parser')
const app = express()
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
module.exports = app