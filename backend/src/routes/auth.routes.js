const express = require('express')
const { registerController, loginController,meController } = require('../controllers/auth.controller')
const router = express.Router()

router.post('/register',registerController)
router.post('/login',loginController)
router.get("/me", meController);

module.exports = router