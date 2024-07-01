import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    updateAccountDetails,
    getCurrTUser,
    updateUserAvatar
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

// secoure routes
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJwt, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJwt, changeCurrentPassword)

router.route("/update-account").patch(verifyJwt, updateAccountDetails)

router.route("/get-user").get(verifyJwt, getCurrTUser)

router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)

export default router
