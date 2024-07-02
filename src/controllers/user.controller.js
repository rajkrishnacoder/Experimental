import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { extractPublicId } from 'cloudinary-build-url'
import mongoose from "mongoose"

const generateAccescAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefressToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists
    // check for images, and avatar
    // upload them to cloudinary, avatar 
    // create user object - create entry in db
    // remove password and refresh token fro response
    // check for user creation
    // return response

    const {fullName, username, email, password} = req.body

    if([fullName, username, email, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fiels are required")
    }
    
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(existedUser) throw new ApiError(409, "User is already exits please go to login page")
     
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0].path
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required")
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar) throw new ApiError(400, "Avatar link is required from cludinary")
    
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email, 
        password,
        avatar: avatar.url,
        coverImage: coverImage.url
    })

    const response = await User.findById(user._id).select("-password -refreshToken")

    if(!response) throw new ApiError(500, "somthing went wrong while registry the user")

    return res.status(200)
    .json(new ApiResponse(200, response, "user has successfully registered"))
})

const loginUser = asyncHandler(async (req, res)=>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {username, email, password} = req.body

    if(!(username || email)) throw new ApiError(400, "username or password requred for login")
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) throw new ApiError(404, "user does not exit")
    
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid) throw new ApiError(401, "Invalid user credentioals")
    
    const {accessToken, refreshToken} = await generateAccescAndRefreshTokens(user._id)

    const loginUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: [loginUser, accessToken, refreshToken]}, "User loggin In Successfully"))
})

const logoutUser = asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {refreshToken: 1}
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User successfully logedout"))

})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    // get the refresh token from browser
    // decode that token and save it in a constant
    // verify that with db refreshtoken 
    // create new access and refresh token
    // save those new token in cookies 
    const myRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if(!myRefreshToken) throw new ApiError(401, "unathorized request")
    
    try {
        const decodedToken = await jwt.verify(myRefreshToken, process.env.REFRESH_TOKAN_SECRET)

        const user  = await User.findById(decodedToken._id)

        if(!user) throw new ApiError(401, "Invalid user token")

        if(myRefreshToken !== user?.refreshToken) throw new ApiError(401, "refresh token used or expired")

        const options = {
            httpOnly : true, 
            secure : true
        }
        
        const {accessToken, refreshToken} = await generateAccescAndRefreshTokens(user._id)
        
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken}, "Access token refreshed"))
    } catch (error) {
        console.error("JWT verification error:", error);

        // Handle and throw the error
        throw new ApiError(401, error.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    // get input oldpassword and newpassword
    // find the user
    // check the oldpassword is correct or not
    // then save the new password in database
    // then send the status and response 

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(400, "Invalid Old password")
    
    user.password = newPassword
    await user.save({validateBeforeSave: false})
  
    return res.status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res)=>{
    // get new fullName and email
    // check all are not missing with all the data
    // find the user and update those details in db
    // send the response 

    const {fullName, email} = req.body

    if(!fullName || !email) throw new ApiError(400, "all fields are requred")

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            }
        }, 
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Account details are updated Successfully"))
})

const getCurrTUser = asyncHandler(async (req, res)=>{

    return res.status(200)
    .json(new ApiResponse(200, req.user, "current user fatched successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res)=>{
    // ger the local path for file
    // uploade to cloudinary
    // update link to db
    // response after all work

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) throw new ApiError(400, "avatar file is missing")

    const publicId = await extractPublicId(req.user.avatar)

    if(!publicId) throw new ApiError(500, "public id not found")

    await deleteOnCloudinary([publicId], "image")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400, "avatar file is missing from cloudinay")
    
    const user = await User.findByIdAndDelete(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },{new: true}
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200, user, "user avatar updated successfully"))
})


const getUserChannelProfile = asyncHandler(async (req, res)=>{
    const {username} = req.params

    if(!username?.trim()) throw new ApiError(400, "username is missing")

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscribers",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
            }
        },
        {
            $lookup:{
                from: "subscribers",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribe"
            }
        },
        {
            $addFields:{
                totalSubscriber: {
                    $size: "$subscriber",
                },
                totalSubscribe: {
                    $size: "$subscribe"
                },
                isSubscribe: {
                    $cond:{
                        $if: {$in: [req.user?._id, "$subscribe.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                totalSubscriber: 1,
                totalSubscribe: 1,
                isSubscribe: 1
            }
        }
    ])

    if(!channel) throw new ApiError(404, "channel does dot exists")

    return res.status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})


const getWatchHistory = asyncHandler(async (req, res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        avatar: 1,
                                        username: 1
                                    }
                                }   
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!user) throw new ApiError(404, "user does not exist")

    return res.status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    getCurrTUser,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
}


