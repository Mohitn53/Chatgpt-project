const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')

const authMiddleware = async(req,res,next)=>{
    const token = req.cookies.token
    if(!token){
        return res.status(402).json({
            message:"Unauthorized"
        })
    }
    try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    const user = await userModel.findById({
        _id:decoded.id
    })
    req.user = user
    next()     
    } catch (error) {
        console.log(error)
        return res.status(402).json({
            message:"Unauthorized",
            error
        })
    }
}

module.exports = {
    authMiddleware
}