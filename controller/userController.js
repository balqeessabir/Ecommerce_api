const User = require('../models/userModel')
const asyncHandler = require('express-async-handler')
const { generateToken } = require('../config/jwtToken')
const { generateRefreshToken } = require('../config/refreshToken')
const validateMongodbId = require('../utils/validateMongodbId')
const cookies = require("cookie-parser");
const JWT = require('jsonwebtoken')

const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email
  const findUser = await User.findOne({ email: email })

  if (!findUser) {
    //create new user
    const newUser = await User.create(req.body)
    res.json(newUser)
  } else {
    //user already exists
    throw new Error('User already exists')
  }
})

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  //check if user exists
  const findUser = await User.findOne({ email })

  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id)
    const updateuser = await User.findByIdAndUpdate(
      findUser?.id,
      {
        refreshToken: refreshToken,
      },
      {
        new: true,
      },
    )
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    })

    res.json({
      id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    })
  } else {
    throw new Error('Invalid Credentials')
  }
})

// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req?.cookies;

  if(!cookie.refreshToken) throw new Error("No refresh token in Cookies")
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken})

  if(!user) throw new Error("No refresh Token present in db or not matched")
  JWT.verify(refreshToken, process.env.JWT_SECRET,(err,decoded)=>{
   if(err || user.id !== decoded.id){
    throw new Error("There is something wrong with the refresh token")
   }
   const accessToken = generateRefreshToken(user?._id)
   res.json(accessToken)
  })
})

//logout functionality
const logout = asyncHandler(async(req,res)=>{
const cookie = req?.cookies;
  if(!cookie.refreshToken) throw new Error("No refresh token in Cookies")
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken})
  if(!user) {
    res.clearCookie('refreshToken',{
      httpOnly:true,
      secure:true
    });
    return res.sendStatus(204);
  }
  await User.findOneAndUpdate(refreshToken,{
    refreshToken:"",
  })
  res.clearCookie('refreshToken',{
      httpOnly:true,
      secure:true
    });
    return res.sendStatus(200);
})

//get all user
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find()
    res.json(getUsers)
  } catch (error) {
    throw new Error(error)
  }
})

//get single user
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id)

  try {
    const getUser = await User.findById(id)
    res.json({
      getUser,
    })
  } catch (error) {
    throw new Error(error)
  }
})

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id)

  try {
    const deleteUser = await User.findByIdAndDelete(id)
    res.json({
      deleteUser,
    })
  } catch (error) {
    throw new Error(error)
  }
})

//update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.user
  validateMongodbId(id)

  try {
    const updatedUser = await User.findByIdAndUpdate(id, {
      firstname: req?.body.firstname,
      lastname: req?.body.lastname,
      email: req?.body.email,
      mobile: req?.body.mobile,
    })
    res.json({ updatedUser })
  } catch (error) {
    throw new Error(error)
  }
})

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id)

  try {
    const block = await User.findByIdAndUpdate(id, {
      isBlocked: true,
    },{
      new:true,
    })
    res.json({
      message: 'user blocked',
    })
  } catch (error) {
    throw new Error(error)
  }
})

const unBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const unBlock = await User.findByIdAndUpdate(id, {
      isBlocked: false,
    },{
      new:true,
    })
    res.json({
      message: 'user unblocked',
    })
  } catch (error) {
    throw new Error(error)
  }
})
module.exports = {
  createUser,
  loginUserCtrl,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  blockUser,
  unBlockUser,
  handleRefreshToken,
  logout,
}
