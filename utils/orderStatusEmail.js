import transporter from "../config/emailConfig.js";

const sendOrderStatusEmail = async ({ to, subject, text }) =>{
    const mailOptions = {
        from:  `"My Shop" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text
    }

    try{
      await transporter.sendMail(mailOptions)
    }catch (error){
      console.error("Failed to send email", error.message)
    }
}

export default sendOrderStatusEmail;