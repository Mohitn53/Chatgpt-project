const mongoose = require('mongoose')
const connectToDB = ()=>{
    mongoose.connect(process.env)
}