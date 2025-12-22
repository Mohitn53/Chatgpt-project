const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true  
    },
    fullname:{
        firstname:{
        type:String,
        required:true        
        },
        lastname:{
        type:String,
        required:true
        }
    },
    password:{
        type:String,
        required:true
    }
})

const userModel = mongoose.model('user',userSchema)

module.exports = userModel