import nodemailer from "nodemailer";
import User from "../Models/User.js";

// Configure the email transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "diwakerryan12345@gmail.com", // Replace with environment variable for security
    pass: "eulovxvqvhrpmarh", // **Security Risk**: Store credentials in environment variables instead
  },
});

/**
 * Generates a 6-digit OTP.
 * @returns {number} A random 6-digit OTP.
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // Ensures a 6-digit OTP
};

/**
 * Verifies the OTP entered by the user.
 * If the OTP is valid and not expired, the account is marked as verified.
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the user based on email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No account found" });

    // Check if the account is already verified
    if (user.isVerified)
      return res.status(400).json({ message: "Account already verified" });

    // Validate the OTP and check if it has expired
    if (user.otp !== otp || user.otpExpiry < new Date())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // Mark the user as verified and clear OTP-related fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    console.log("Error verifying OTP: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Resends a new OTP if the account is not already verified.
 * Generates a new OTP, updates the user's record, and sends the OTP via email.
 */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user based on email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No account found" });

    // Check if the account is already verified
    if (user.isVerified)
      return res.status(400).json({ message: "Account already verified, can't send OTP" });

    // Generate a new OTP and set an expiry time (10 minutes)
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    // Send the OTP via email
    await transporter.sendMail({
      from: "diwakerryan12345@gmail.com",
      to: email,
      subject: "OTP Verification from -----------",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.log("Error resending OTP: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Sends an OTP email to the specified user.
 * @param {string} email - The recipient's email address.
 * @param {number} OTP - The generated OTP.
 */
export const sendMail = async (email, OTP) => {
  try {
    await transporter.sendMail({
      from: "diwakerryan12345@gmail.com",
      to: email,
      subject: "OTP Verification from -----------",
      text: `Your OTP is: ${OTP}`,
    });
  } catch (error) {
    console.log("Error sending email: ", error.message);
  }
};
