import transporter from "../config/emailConfig.js";
import EmailVerificationModel from "../models/EmailVerification.js";

const sendEmailVerificationOTP = async (req, user) =>{
   const otp = Math.floor(1000 + Math.random() * 9000);

   await new EmailVerificationModel({userId: user._id, otp: otp}).save();

   const otpVerificationLink = `${process.env.FRONTEND_HOST}/account/verify-email`;

   await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'OTP - Verify your account',
      html: `
      <p>Dear ${user.name},</p>
      <p>
        To complete your registration, please verify your email by entering the following 
        one-time password (OTP):
        <a href="${otpVerificationLink}">${otpVerificationLink}</a>
      </p>
      <h2>OTP: ${otp}</h2>
      <p>This OTP is valid for 15 minutes.</p>
      `
   })
}

export default sendEmailVerificationOTP;