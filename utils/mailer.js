const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS  
  }
});

const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP for Password Reset",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;
