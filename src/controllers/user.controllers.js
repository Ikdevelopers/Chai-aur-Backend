import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadCloudinary } from '../utils/cloudinary.js'; 
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler( async (req, res) => {
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
            [fullName, email, username, password].some((field) => !field?.trim()===''))
            {
            throw new ApiError(400, 'All fileds are required')
            }

            const existedUser = User.findOne({
                $or: [{ username }, { email }]
            })

            if (existedUser) {
                throw new ApiError(409, 'User already exists.')
            }

            const avatarLocalPath = req.files?.avatar[0]?.path;
            const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

            const createdUser = user.findById(user._id).select(
                "-password -refreshToken"
            )

            if (!createdUser) {
                throw new ApiError(500, 'Something went wrong while creating user')
            }

            return res.status(201).json(
                new ApiResponse(200, createdUser, 'User registered')
            ) 
} )

export default registerUser