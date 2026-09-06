import { Router } from "express";
import userController from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    userController.registerUser
)

router.route('/login').post(userController.loginUser)

//secured routes
router.route('/logout').post(verifyJWT, userController.logoutUser)

router.route('/refreshToken').post(userController.refreshAccessToken)

router.route('/change-pass').post(verifyJWT, userController.changeCurrentUserPassword)

router.route('/current-user').get(verifyJWT, userController.getCurrentUser)

router.route('/update-account').patch(verifyJWT, userController.updateAccountDetails)

router.route('/avatar').patch(verifyJWT, upload.single('avatar'), userController.updateUserAvatar)

router.route('/cover-image').patch(verifyJWT, upload.single('coverImage'), userController.updateUserCover)

router.route('/c/:username').get(verifyJWT, userController.getUserChannelProfile)

router.route('/history').get(verifyJWT, userController.getWatchHistory)


export default router;