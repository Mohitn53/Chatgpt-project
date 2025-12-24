const userModel = require("../models/user.model")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const registerController = async(req,res)=>{
    const {username,password,email,fullname:{firstname,lastname}}= req.body
    const userExist = await userModel.findOne({
        username:username
    })
    if(userExist){
      return res.status(409).json({
            message:"User already exist"
        })
    }
    const user = await userModel.create({
        username,
        fullname:{firstname,lastname},
        email,
        password: await bcrypt.hash(password,10),
    })
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
    res.cookie('token',token)
    res.status(201).json({
        message:"User created sucessfully"
    })
}
const meController = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const loginController = async(req,res)=>{
    const {password,email}= req.body
    const userExist = await userModel.findOne({
        email:email
    })
    if(!userExist){
      return res.status(409).json({
            message:"User does not exist register"
        })
    }
    const isPassCorrect = await bcrypt.compare(password,userExist.password)
    console.log(isPassCorrect)
    if(!isPassCorrect){
      return res.status(403).json({
            message:"User unauthorized"
        })       
    }
    const token = jwt.sign({id:userExist._id},process.env.JWT_SECRET)
    res.cookie('token',token)
    res.status(201).json({
        message:"User logged in sucessfully"
    })
}



module.exports = {
    registerController,
    loginController,
    meController
}