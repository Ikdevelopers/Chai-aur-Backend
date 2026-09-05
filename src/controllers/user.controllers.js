import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { deleteCloudinary, uploadCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken'
import { ApiResponse } from '../utils/ApiResponse.js'
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

    if (!avatar?.url || !avatar?.public_id) {
        throw new ApiError(400, 'Avatar is required')
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
        coverImage: coverImage?.url || '',
        coverImagePublicId: coverImage?.public_id || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id)
        .select('-password -refreshToken')

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
    if ((!username && !email) || !password) {
        throw new ApiError(400, 'Username or email and password are required')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(404, 'Password invalid')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    //again running server's db query for getting real user to gain real tokens
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unautorized req at trying to re-send refreshToken')
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, 'Invalid refreshToken, verified by user')
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'refreshToken is expired or used')
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user?._id);

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'AccessToken refreshed'
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refreshtoken')
    }
})


const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorect = await user.isPasswordCorect(oldPassword);
    if (!isPasswordCorect) {
        throw new ApiError(400, 'Invalid old pass')
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'User fetched successfully.'))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(fullName || email)) {
        throw new ApiError(401, 'fullname and email required for updation')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
                /* Alternative
                fullName,
                 email
                 */
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'Account details updated.')
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is missing')
    }

    const avatar = await uploadCloudinary(avatarLocalPath);

    if (!avatar?.url || !avatar?.public_id) {
        throw new ApiError(400, 'Error while uploding on avatar')
    }

    const oldAvatarPublicId = req.user?.avatarPublicId
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
                avatarPublicId: avatar.public_id
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    await deleteCloudinary(oldAvatarPublicId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, 'Avatar updated.')
    )

})

const updateUserCover = asyncHandler(async (req, res) => {
    const coverLocalPath = await req.file?.path
    if (!coverLocalPath) {
        throw new ApiError(400, 'Cover file is missing')
    }

    const coverImage = await uploadCloudinary(coverLocalPath);

    if (!coverImage?.url || !coverImage?.public_id) {
        throw new ApiError(400, 'Error while uploding on CoverImage')
    }

    const oldCoverImagePublicId = req.user?.coverImagePublicId
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
                coverImagePublicId: coverImage.public_id
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    await deleteCloudinary(oldCoverImagePublicId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, 'Cover Image updated.')
    )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, 'User name is required')
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            },
            $lookup: {
                from :subscriptions,
                localField: '_id',
                foreignField: 'channel',
                as: subscriber
            },
            $lookup: {
                from :subscriptions,
                localField: '_id',
                foreignField: 'subscriber',
                as: subscribedTo
            },
            $addFields: {
                subscribersCount: {
                    $size: '$subscribers'
                },
                channelsSubscribedToCount: {
                    $size:  '$subscribedTo'
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, '$subscribers.subscriber']},
                        then: true,
                        else: false
                    }
                }
            },
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                coverImage:1,
                avatar:1,
                email:1
            }
        }
         
    ])
    if (!channel?.length) {
        throw new ApiError(404, 'Channel does not exixst')
    }
    return res
    .status(200)
    .json( new ApiResponse( 200, 'Channel fetched successfully.'))
})

export default {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentUserPassword,
    updateUserAvatar,
    updateUserCover,
    getUserChannelProfile
} 