import UserModel from "../models/User.js";
import bcrypt from 'bcryptjs';
import sendEmailVerificationOTP from "../utils/sendEmailVerificationOTP.js";
import EmailVerificationModel from "../models/EmailVerification.js";
import generateTokens from "../utils/generateTokens.js";
import setTokenCookies from "../utils/setTokenCookies.js";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
import transporter from "../config/emailConfig.js";
import jwt from "jsonwebtoken";
import { getFullUserProfile } from "../utils/getUserProfile.js";

export const userRegistration = async (req, res) => {
  try {
    const { name, email, password, password_confirmation } = req.body;

    if (!name || !email || !password || !password_confirmation) {
      return res
        .status(400)
        .json({ status: "failed", message: "All fields are required" });
    }

    if (password !== password_confirmation) {
      return res
        .status(400)
        .json({ status: "failed", message: "Password do not match" });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: "failed",
        message: "Email already exists",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await new UserModel({
      name,
      email,
      password: hashedPassword,
    }).save();

    sendEmailVerificationOTP(req, newUser);

    res.status(201).json({
      status: "Success",
      message: "Registration Success",
      user: { id: newUser._id, email: newUser.email },
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: "Unable to Register, please try again later",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: "failed",
        message: "All fields are required",
      });
    }

    const existingUser = await UserModel.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({
        status: "failed",
        message: "Email doesn't exist",
      });
    }

    if (existingUser.is_verified) {
      return res.status(400).json({
        status: "failed",
        message: "Email is already verified",
      });
    }

    const emailVerification = await EmailVerificationModel.findOne({
      userId: existingUser._id,
      otp,
    });

    if (!emailVerification) {
      if (!existingUser.is_verified) {
        await sendEmailVerificationOTP(req, existingUser);
        return res.status(400).json({
          status: "failed",
          message: "Invalid OTP, new OTP sent to your email",
        });
      }
      return res.status(400).json({
        status: "failed",
        message: "Invalid OTP",
      });
    }

    const currentTime = new Date();
    const expirationTime = new Date(
      emailVerification.createdAt.getTime() + 15 * 60 * 1000
    );

    if (currentTime > expirationTime) {
      await sendEmailVerificationOTP(req, existingUser);
      return res.status(400).json({
        status: "failed",
        message: "OTP expired, new OTP sent to your email",
      });
    }

    existingUser.is_verified = true;
    await existingUser.save();

    await EmailVerificationModel.deleteMany({ userId: existingUser._id });

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Unable to verify email, please try again later",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Email and password are required",
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "Email or password was not found",
      });
    }

    if (!user.is_verified) {
      return res.status(401).json({
        status: "failed",
        message: "Your account is not verified",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid email or password",
      });
    }

    const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
      await generateTokens(user);

    setTokenCookies(
      res,
      accessToken,
      refreshToken,
      accessTokenExp,
      refreshTokenExp
    );

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified,
        isAdmin: user.is_admin,
      },
      status: "success",
      message: "Login successful",
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_exp: accessTokenExp,
      is_auth: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Unable to login, please try again later",
    });
  }
};

export const userProfile = async (req, res) => {
   try {
    const profile = await getFullUserProfile(req.user._id);
    res.status(200).json({user: profile, is_auth: true})
   } catch (error) {
     res.status(500).json({ message: "Server error" });
   }
};

export const getUserProfileById = async (req, res) =>{
  try {
    const profile = await getFullUserProfile(req.params.id);
    res.status(200).json({ user: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const userLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await UserRefreshTokenModel.findOneAndUpdate(
      { token: refreshToken },
      { $set: { blacklisted: true } }
    );
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken_public");

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Unable to logout, please try again later",
    });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { password, password_confirmation } = req.body;
    if (!password || !password_confirmation) {
      return res.status(400).json({
        status: "failed",
        message: "New password and confirm new password are required",
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        status: "failed",
        message: "New password and confirm new password don't match",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashPassword = await bcrypt.hash(password, salt);

    await UserModel.findByIdAndUpdate(req.user._id, {
      $set: {
        password: newHashPassword,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Unable to change password, please try again later",
    });
  }
};

export const sendUserPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "failed",
        message: "Email field is required",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "Email doesn't exist",
      });
    }

    const secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
    const token = jwt.sign(
      {
        userId: user._id,
      },
      secret,
      { expiresIn: "15m" }
    );

    const resetLink = `${process.env.FRONTEND_HOST}/account/reset-password-confirm/${user._id}/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset Link",
      html: `<p>Hello ${user.name}, Please <a href="${resetLink}">click here</a> to reset your password.</p>`,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset email sent. Please check your email.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Unable to send password reset email. Please try again later.",
    });
  }
};

export const userPasswordReset = async (req, res) => {
  try {
    const { password, password_confirmation } = req.body;
    const { id, token } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const new_secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
    jwt.verify(token, new_secret);

    if (!password || !password_confirmation) {
      return res.status(400).json({
        status: "failed",
        message: "New password and confirm new password are required",
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        status: "failed",
        message: "New password and confirm new password dont match",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashPassword = await bcrypt.hash(password, salt);

    await UserModel.findByIdAndUpdate(user._id, {
      $set: { password: newHashPassword },
    });

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        status: "failed",
        message: "Token expired. Please request a new password reset link.",
      });
    }

    return res.status(500).json({
      status: "failed",
      message: "Unable to reset password. Please try again later",
    });
  }
};
