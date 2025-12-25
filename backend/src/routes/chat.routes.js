const express = require('express')
const { authMiddleware } = require('../middleware/authmiddleware')
const { chatController , getUserChats, deleteChat} = require('../controllers/chat.controller')
const router = express.Router()

router.post('/',authMiddleware,chatController)
router.get('/chats',authMiddleware,getUserChats)
router.delete('/chats/:id',authMiddleware,deleteChat)


module.exports = router