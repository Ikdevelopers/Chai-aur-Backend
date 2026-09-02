import { Router } from "express";
import userController from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import userControllers from "../controllers/user.controllers.js";

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

export default router;