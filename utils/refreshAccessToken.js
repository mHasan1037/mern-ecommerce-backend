import { verifyEmail } from "../controllers/userController.js";
import UserModel from "../models/User.js";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
import generateTokens from "./generateTokens.js";

const refreshAccessToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    const { tokenDetails, error } = await verifyEmail(oldRefreshToken);

    if (error) {
      return res.status(401).send({
        statu: "failed",
        message: "Invalid refresh token",
      });
    }

    const user = await UserModel.findById(tokenDetails._id);

    if (!user) {
      return res.status(404).send({
        status: "failed",
        message: "User not found",
      });
    }

    const userRefreshToken = await UserRefreshTokenModel.findOne({
      userId: tokenDetails._id,
    });

    if (
      oldRefreshToken !== userRefreshToken.token ||
      userRefreshToken.blacklisted
    ) {
      return res.status(401).send({
        status: "failed",
        message: "Unauthorized access",
      });
    }

    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
      await generateTokens(user);

    return {
      newAccessToken: accessToken,
      newRefreshToken: refreshToken,
      newAccessTokenExp: accessTokenExp,
      newRefreshTokenExp: refreshTokenExp,
    };
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: "Internal server error",
    });
  }
};

export default refreshAccessToken;
