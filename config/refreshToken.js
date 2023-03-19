const jwt = require("jsonwebtoken");

const generateRefreshToken = (id)=>{
  return jwt.sign({id},process.env.JWT_SECRET, { algorithm: 'HS256' },{expiresIn:"3d"})
};

module.exports={generateRefreshToken}