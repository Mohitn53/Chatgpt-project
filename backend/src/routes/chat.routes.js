const express = require('express')
const { authMiddleware } = require('../middleware/authmiddleware')
const { chatController , getUserChats} = require('../controllers/chat.controller')
const router = express.Router()

router.post('/',authMiddleware,chatController)
router.get('/chats',authMiddleware,getUserChats)


module.exports = router