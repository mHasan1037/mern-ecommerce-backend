import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
import generateTokens from "./generateTokens.js";

const refreshAccessToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    const tokenDetails = jwt.verify(
      oldRefreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    );

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

    if (!userRefreshToken || userRefreshToken.blacklisted) {
      return res.status(401).send({
        status: "failed",
        message: "Unauthorized access",
      });
    }

    const isCurrent = oldRefreshToken === userRefreshToken.token;
    const isRecentPrevious =
      oldRefreshToken === userRefreshToken.previousToken &&
      userRefreshToken.rotatedAt &&
      Date.now() - userRefreshToken.rotatedAt.getTime() < 5000; // 5s grace window

    if (!isCurrent && !isRecentPrevious) {
      return res.status(401).send({
        status: "failed",
        message: "Unauthorized access",
      });
    }

    if (isRecentPrevious) {
      const currentPayload = jwt.verify(
        userRefreshToken.token,
        process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
      );

      const accessTokenExp = Math.floor(Date.now() / 1000) + 60 * 15;

      const newAccessToken = jwt.sign(
        {
          _id: currentPayload._id,
          roles: currentPayload.roles,
          exp: accessTokenExp,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
      );

      return {
        newAccessToken,
        newRefreshToken: userRefreshToken.token,
        newAccessTokenExp: accessTokenExp,
        newRefreshTokenExp: currentPayload.exp,
      };
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
