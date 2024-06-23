import { Router } from "express";
import { ChangeCurrentUserPassword, LogOutUser, LoginUser, RefreshAccessToken, RegisterUser , GetUser , GetSingleUser, UpdateUser , UpdateUserPatch} from "../controller/user.controller";
import { verifyJwt } from "../middleware/auth.middleware";

const router = Router();
router.route("/worko/user/CreateUser").get(RegisterUser);
router.route("/worko/user/login").post(LoginUser);

//secured routes
router.route("/worko/user/logout").post(verifyJwt , LogOutUser);
router.route("/worko/user/refreshToken").post(verifyJwt , RefreshAccessToken);
router.route("/worko/user/change-password").post(verifyJwt , ChangeCurrentUserPassword);
router.route("/worko/user").get(GetUser);
router.route("/worko/user/:userId").get(GetSingleUser)
router.route("/worko/user/update").put(UpdateUser)
router.route("/worko/user/update-patch").patch(UpdateUserPatch)

export default router;