const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/authmiddleware')
const {getMessagesByChat} = require('../controllers/message.controller')
router.get(
  "/chat/:chatId",
  authMiddleware,
  getMessagesByChat
);

module.exports = router
