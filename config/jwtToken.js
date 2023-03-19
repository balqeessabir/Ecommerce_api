const jwt = require("jsonwebtoken");

const generateToken = (id)=>{
  return jwt.sign({id},process.env.JWT_SECRET, { algorithm: 'HS256' },{expiresIn:"1d"})
};

module.exports={generateToken}