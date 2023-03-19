const { default: mongoose } = require("mongoose")

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONOGODB_URL)
    console.log("database connected successfully")
  } catch (error) {
    console.log("DATABASE ERROR")
  }
}
module.exports = dbConnect