import nodemailer from "nodemailer";

// Get credentials from environment
const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

console.log("📧 Email Config:", {
  host: emailConfig.host,
  port: emailConfig.port,
  user: emailConfig.auth.user ? "Set" : "Missing",
  pass: emailConfig.auth.pass ? "Set (hidden)" : "Missing",
});

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Email connection failed:", error.message);
  } else {
    console.log("Email server ready");
  }
});

// Professional welcome email
export async function sendWelcomeEmail(user) {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Welcome to PrepCart, ${user.name}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PrepCart!</h1>
            <p style="color: white; opacity: 0.9; margin: 10px 0 0;">Your meal planning journey begins</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Hello ${user.name},</h2>
            <p>Thank you for joining PrepCart! We're excited to simplify your meal planning.</p>
            
            <!-- Account Info -->
            <div style="background: #f8fafc; border-left: 4px solid #4a9fd8; padding: 20px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #2d3748;">Your Account Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #4a5568;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0;">${user.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568;"><strong>Province:</strong></td>
                  <td style="padding: 8px 0;">${user.province}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568;"><strong>Plan:</strong></td>
                  <td style="padding: 8px 0;">${
                    user.tier.charAt(0).toUpperCase() + user.tier.slice(1)
                  } Tier</td>
                </tr>
              </table>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
                 style="background: #8cc63c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Start Planning Your Meals →
              </a>
            </div>
            
            <!-- Next Steps -->
            <h3 style="color: #2d3748;">What You Can Do Now:</h3>
            <ul style="line-height: 1.8;">
              <li>Generate personalized weekly meal plans</li>
              <li>Create automatic grocery lists</li>
              <li>Customize meals with your free swaps</li>
              <li>Track your nutrition goals</li>
            </ul>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 20px; color: #718096; font-size: 12px;">
              <p>© ${new Date().getFullYear()} PrepCart. All rights reserved.</p>
              <p>This email was sent to ${
                user.email
              } as part of your registration.</p>
              <p>
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL
                }/privacy" style="color: #4a9fd8;">Privacy Policy</a> | 
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL
                }/unsubscribe" style="color: #4a9fd8;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to PrepCart, ${user.name}!

Thank you for joining PrepCart! We're excited to simplify your meal planning.

ACCOUNT DETAILS:
- Email: ${user.email}
- Province: ${user.province}
- Plan: ${user.tier} Tier

GET STARTED:
1. Generate personalized weekly meal plans
2. Create automatic grocery lists  
3. Customize meals with your free swaps
4. Track your nutrition goals

Start planning: ${process.env.NEXT_PUBLIC_APP_URL}

Need help? Reply to this email.

© ${new Date().getFullYear()} PrepCart. All rights reserved.
This email was sent to ${user.email} as part of your registration.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Professional welcome email sent to ${user.email}`);
    console.log(`   Message ID: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error("❌ Email error:", error.message);
    // Don't throw error - registration should succeed regardless
    return null;
  }
}
// Password reset email
export const sendPasswordResetEmail = async (email, resetToken, user) => {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "🔐 Reset Your PrepCart Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Hello ${user?.name || "User"},</h2>
            <p>You requested to reset your password for PrepCart.</p>
            <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
            
            <!-- Reset Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #8cc63c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reset Your Password →
              </a>
            </div>
            
            <!-- Alternative Link -->
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link in your browser:<br>
              <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all;">${resetUrl}</code>
            </p>
            
            <!-- Security Note -->
            <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Security Notice:</strong><br>
                If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; color: #718096; font-size: 12px;">
              <p>© ${new Date().getFullYear()} PrepCart. All rights reserved.</p>
              <p>This link expires in 1 hour for security reasons.</p>
            </div>
          </div>
        </div>
      `,
      text: `Password Reset Request - PrepCart

Hello ${user?.name || "User"},

You requested to reset your password for PrepCart.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

⚠️ Security Notice:
If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} PrepCart. All rights reserved.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Password reset email error:", error.message);
    throw error;
  }
};
// Password changed confirmation email
export const sendPasswordChangedEmail = async (email, user) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "✅ Your PrepCart Password Has Been Changed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Changed Successfully</h1>
          </div>
          
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Hello ${user.name},</h2>
            <p>Your PrepCart password has been successfully changed.</p>
            
            <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #2e7d32;">
                <strong>✅ Password Updated:</strong><br>
                ${new Date().toLocaleString()}
              </p>
            </div>
            
            <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>🔒 Security Tip:</strong><br>
                If you did NOT make this change, please contact us immediately at support@prepcart.com
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" 
                 style="background: #4a9fd8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Login to Your Account →
              </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; color: #718096; font-size: 12px;">
              <p>© ${new Date().getFullYear()} PrepCart. All rights reserved.</p>
              <p>This is a security notification for your account: ${email}</p>
            </div>
          </div>
        </div>
      `,
      text: `Password Changed Successfully - PrepCart

Hello ${user.name},

Your PrepCart password has been successfully changed on ${new Date().toLocaleString()}.

🔒 Security Tip:
If you did NOT make this change, please contact us immediately at support@prepcart.com

Login to your account: ${process.env.NEXT_PUBLIC_APP_URL}/auth/login

© ${new Date().getFullYear()} PrepCart. All rights reserved.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password changed email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Password changed email error:", error.message);
    // Don't throw - password change should still succeed
    return null;
  }
};

export default transporter;
