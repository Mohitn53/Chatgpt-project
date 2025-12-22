const express = require('express')
const { authMiddleware } = require('../middleware/authmiddleware')
const { chatController } = require('../controllers/chat.controller')
const router = express.Router()

router.post('/',authMiddleware,chatController)


module.exports = router