import jwt from "jsonwebtoken";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";

const generateTokens = async (user) => {
  try {
    const payload = { _id: user._id, roles: user.is_admin };
    const accessTokenExp = Math.floor(Date.now() / 1000) + 60 * 15;
    const accessToken = jwt.sign(
      { ...payload, exp: accessTokenExp },
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY
    );

    const refreshTokenExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const refreshToken = jwt.sign(
      { ...payload, exp: refreshTokenExp },
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY
    );

    const userRefreshToken = await UserRefreshTokenModel.findOneAndDelete({
      userId: user._id,
    });

    await new UserRefreshTokenModel({
      userId: user._id,
      token: refreshToken,
    }).save();

    return Promise.resolve({
      accessToken,
      refreshToken,
      accessTokenExp,
      refreshTokenExp,
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

export default generateTokens;
