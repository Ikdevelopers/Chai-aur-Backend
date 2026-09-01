import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { use } from 'react';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, 'Something went wrong while genearting tokens')
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user dtails from user (uses schema)
    //validation - not empty
    //check if user already exists OR not
    //check for images, if not use placeholder img 
    // upload avatar to cloudinary
    //create user obj - creat in db
    //remove pass, tokens
    //check user created OR not
    //return res (Created/Failed)

    // -- Testing Data --
    console.log(req.body);
    //  req.body
    const { fullName, email, username, password } = req.body;

    if (
        [fullName, email, username, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'All fileds are required')
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, 'User already exists.')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, 'Avatar is required')
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while creating user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered')
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // take data from req.body {de-structure}
    // username / email
    // find the user
    // Check the pass
    // Generate Access, Refres
    // Send Secure Cookies
    // Response (LoggedIn)

    const { email, username, password } = req.body
    if (!username || !email) {
        throw new ApiError(400, 'username or email is requires')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    const isPasswordValid = await user.isPasswordCorect(password);

    if (!isPasswordValid) {
        throw new ApiError(404, 'Password invalid')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    //again running server's db query for getting real user to gain real tokens
    const loggedInUser = await User.findById(user._id).
        select("-password, -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie('accessToken: ', accessToken, options)
        .cookie('refreshToken: ', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                'User is loggedIn successfully.'
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(
            new ApiResponse(
                200,
                {},
                'Logged Out Successfully'
            )
        )
})
export default {
    registerUser,
    loginUser,
    logoutUser
} 