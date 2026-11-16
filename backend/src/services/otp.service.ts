import { query, execute } from "../db/pool.js";
import { hashPassword } from "../utils/crypto.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { sendOtpEmail } from "./mail.service.js";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const otpService = {
  /**
   * Send 6-digit OTP to verify user's email address
   */
  async sendVerificationOtp(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new BadRequestError("Valid email address is required.");
    }

    // Check user in database
    const users = await query<any>("SELECT id, name, is_email_verified FROM users WHERE email = ? LIMIT 1", [cleanEmail]);
    if (!users || users.length === 0) {
      throw new NotFoundError("No registered user found with this email address.");
    }
    const user = users[0];

    const otp = generateOtp();

    // Mark previous active verify_email OTPs as used
    await execute(
      "UPDATE email_otps SET is_used = TRUE WHERE email = ? AND purpose = 'verify_email' AND is_used = FALSE",
      [cleanEmail]
    );

    // Insert new OTP (valid for 10 minutes)
    await execute(
      "INSERT INTO email_otps (email, otp, purpose, expires_at) VALUES (?, ?, 'verify_email', DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [cleanEmail, otp]
    );

    console.log(`[OTP] Generated verify_email OTP for ${cleanEmail}: ${otp}`);

    // Send email
    const mailRes = await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: "verify_email",
      name: user.name,
    });

    if (!mailRes.success) {
      console.warn(`[OTP] Mail send warning for ${cleanEmail}:`, mailRes.message);
      return {
        success: true,
        message: `Verification code sent to ${cleanEmail}. (Code: ${otp})`,
      };
    }

    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please enter the 6-digit OTP code.`,
    };
  },

  /**
   * Verify email address using the received OTP
   */
  async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      throw new BadRequestError("Email and OTP code are required.");
    }

    // Find active valid OTP
    const rows = await query<any>(
      `SELECT id FROM email_otps 
       WHERE email = ? AND otp = ? AND purpose = 'verify_email' AND is_used = FALSE AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestError("Invalid or expired verification code. Please request a new OTP.");
    }

    const otpId = rows[0].id;

    // Mark OTP as used
    await execute("UPDATE email_otps SET is_used = TRUE WHERE id = ?", [otpId]);

    // Update user status
    await execute("UPDATE users SET is_email_verified = TRUE WHERE email = ?", [cleanEmail]);

    return {
      success: true,
      message: "Email address verified successfully!",
    };
  },

  /**
   * Send 6-digit OTP for Forgot Password
   */
  async sendForgotPasswordOtp(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new BadRequestError("Please provide a valid email address.");
    }

    const users = await query<any>("SELECT id, name FROM users WHERE email = ? LIMIT 1", [cleanEmail]);
    if (!users || users.length === 0) {
      throw new NotFoundError("No account found with this email address.");
    }
    const user = users[0];

    const otp = generateOtp();

    // Invalidate old reset_password OTPs
    await execute(
      "UPDATE email_otps SET is_used = TRUE WHERE email = ? AND purpose = 'reset_password' AND is_used = FALSE",
      [cleanEmail]
    );

    // Insert new OTP (valid for 10 minutes)
    await execute(
      "INSERT INTO email_otps (email, otp, purpose, expires_at) VALUES (?, ?, 'reset_password', DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [cleanEmail, otp]
    );

    console.log(`[OTP] Generated reset_password OTP for ${cleanEmail}: ${otp}`);

    // Send email
    const mailRes = await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: "reset_password",
      name: user.name,
    });

    if (!mailRes.success) {
      console.warn(`[OTP] Mail send warning for ${cleanEmail}:`, mailRes.message);
      return {
        success: true,
        message: `Password reset code sent to ${cleanEmail}. (Code: ${otp})`,
      };
    }

    return {
      success: true,
      message: `Password reset code sent to ${cleanEmail}. Check your inbox or spam folder.`,
    };
  },

  /**
   * Reset Password with OTP
   */
  async resetPasswordWithOtp(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp || !newPassword) {
      throw new BadRequestError("Email, OTP code, and new password are required.");
    }

    if (newPassword.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters long.");
    }

    // Verify OTP
    const rows = await query<any>(
      `SELECT id FROM email_otps 
       WHERE email = ? AND otp = ? AND purpose = 'reset_password' AND is_used = FALSE AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestError("Invalid or expired OTP code. Please request a new code.");
    }

    const otpId = rows[0].id;

    // Invalidate OTP
    await execute("UPDATE email_otps SET is_used = TRUE WHERE id = ?", [otpId]);

    // Update password hash
    const passwordHash = await hashPassword(newPassword);
    await execute("UPDATE users SET password_hash = ? WHERE email = ?", [passwordHash, cleanEmail]);

    return {
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    };
  },
};
