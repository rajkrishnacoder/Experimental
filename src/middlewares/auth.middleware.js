import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"

export const verifyJwt = asyncHandler(async (req, _, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Autorization")?.replace("Bearer ", "")// what is this i need to do some research about this matter

        if(!token){
            throw new ApiError(401, "unauthorized request")
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCES_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
 
        if(!user) throw new ApiError(401, "invalid access token")
    
        req.user = user
        next()
    } catch (error) {
        console.error("JWT verification error:", error);

        // Handle and throw the error
        throw new ApiError(401, error.message || "Invalid access token");
    }
})

