import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.modal.js";
import { validateObject } from "../utils/validate.js";
import {validatePartialObject } from "../utils/validate.js";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ ValidateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "unable to generate Tokens");
    }
}

const filterAllowedFields = (obj, allowedFields) => {
    return Object.keys(obj)
        .filter(key => allowedFields.includes(key))
        .reduce((newObj, key) => {
            newObj[key] = obj[key];
            return newObj;
        }, {});
};

const RegisterUser = asyncHandler(async (req, res) => {
    const response = validateObject(req.body);
    if (!response.success) throw new ApiError(404, "Any of the field is empty or is entered wrong");
    const { email, name, age, city, zipcode, password } = req.body;

    const existedUser = await User.findOne({
        $or: [{ email }, { zipcode }]
    })

    if (existedUser) throw new ApiError(409, "user already existed");

    const user = await User.create({
        email: email,
        name: name.toLowerCase(),
        age: age,
        city: city,
        zipcode: zipcode,
        password: password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) throw new ApiError(500, "unable to create a user")

    return res.status(200).json(new ApiResponse(200, createdUser, "user created successfully"))
})

const LoginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const response = validateObject(req.body, 'login');
    if (!response.success) throw new ApiError(409, "validation is incorrect");

    const user = await User.find({ email });

    if (!user) throw new ApiError(400, "user not find");

    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) throw new ApiError(401, "password is wrong");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loginUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(new ApiResponse(200 , {
        user:loginUser , accessToken , refreshToken
    },
    "user loggedin successfully"
))
})

const LogOutUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1
        }
      },
      {
        new: true // this will make sure i have updated field in response
      }
    )
  
  
    const options = { // by doing this your cookies is only modifilable on the server side not frontend side
      httpOnly: true,
      secure: true
    }
  
    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User loggedOut"))
  
  })
  
  const RefreshAccessToken = asyncHandler(async (req, res) => {
  
    try {
      const inComingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!inComingRefreshToken) throw new ApiError(401, "Unauthorized request");
  
      const decodedToken = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
      const user = await User.findById(decodedToken?._id);
      if (!user) throw new ApiError(401, "Invalid refresh Token");
  
      if (inComingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token expired")
      }
  
      const options = { // by doing this your cookies is only modifilable on the server side not frontend side
        httpOnly: true,
        secure: true
      }
  
      const { accessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user._id)
  
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
          new ApiResponse(200,
            { accessToken, refreshToken: newrefreshToken },
            "AccessToken Refreshed successfully"
          )
        )
  
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid token")
    }
  })
  
  const ChangeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)
  
    const isPasswordCorrect = await user.isPasswordValid(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");
  
    user.password = newPassword;
    await user.save({ ValidateBeforeSave: false });
  
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changes Successfully"))
  
  });

  const GetUser = asyncHandler(async (req , res) =>{
    const user = await User.find({});
    if(!user) throw new ApiError(500 , "Couldn't fetch user data");

    return res.status(200)
    .json(new ApiResponse(200 , {user} , "Fetched all user data successfully"));
  })

  const GetSingleUser = asyncHandler(async(req , res) => {
    const {userId} = req.params;
    if(!userId) throw new ApiError(404 , "couldn't fetch the id");

    const user = await User.findById(userId).select("-password -refreshToken");
    if(!user) throw new ApiError(404 , "Unable to find the user");

    return res.status(200)
    .json(200 , {user} , "user fetched successfully");
  })

  const UpdateUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId; 
    const allowedFields = ['name', 'age', 'city', 'zipcode', 'email'];
    const updates = filterAllowedFields(req.body, allowedFields);
    
    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No valid fields to update");
    }
    
    const validationResponse = validatePartialObject(updates);
    if (!validationResponse.success) {
        throw new ApiError(400, "Validation failed: " + validationResponse.error.message);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true}
    ).select("-password -refreshToken");
    
    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }
    
    res.status(200).json(
        new ApiResponse(200, updatedUser, "User updated successfully")
    );
});

const DeleteUser = asyncHandler(async(req , res) => {
    const user = await User.findByIdAndDelete(req.user._id);

    return res.status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200 , {} , "User delete successdully"));
})

const UpdateUserPatch = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    
    const existingUser = await User.findById(userId);
    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }

    const allowedFields = ['name', 'age', 'city', 'zipcode', 'email'];
    const updates = filterAllowedFields(req.body, allowedFields);
    
    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No valid fields to update");
    }
    
    const validationResponse = validatePartialObject(updates);
    if (!validationResponse.success) {
        throw new ApiError(400, "Validation failed: " + validationResponse.error.message);
    }

    Object.assign(existingUser, updates);

    await existingUser.save();

    const updatedUser = existingUser.toObject();
    delete updatedUser.password;
    delete updatedUser.refreshToken;

    res.status(200).json(
        new ApiResponse(200, updatedUser, "User updated successfully")
    );
});

export {RegisterUser , LoginUser , LogOutUser , RefreshAccessToken , ChangeCurrentUserPassword , GetUser , GetSingleUser , UpdateUser , DeleteUser , UpdateUserPatch , generateAccessAndRefreshToken}