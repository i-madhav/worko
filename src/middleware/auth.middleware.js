import { User } from "../models/user.modal";
import ApiError from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async(req , res , next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , " ")

        if(!token) throw new ApiError(401 , "unauthorized access")

        const decodedToken = jwt.verify(token , process.env,ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user) throw new ApiError(401 , "invalid accessToken");

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Token")
    }
})