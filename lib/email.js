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
      subject: `Welcome to Prepcart, ${user.name}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Prepcart!</h1>
            <p style="color: white; opacity: 0.9; margin: 10px 0 0;">Your meal planning journey begins</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Hello ${user.name},</h2>
            <p>Thank you for joining Prepcart! We're excited to simplify your meal planning.</p>
            
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
              <p>© ${new Date().getFullYear()} Prepcart. All rights reserved.</p>
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
      text: `Welcome to Prepcart, ${user.name}!

Thank you for joining Prepcart! We're excited to simplify your meal planning.

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

© ${new Date().getFullYear()} Prepcart. All rights reserved.
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
export const sendPasswordResetEmail = async (email, resetToken, user, locale = 'en') => {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Reset Your Prepcart Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Hello ${user?.name || "User"},</h2>
            <p>You requested to reset your password for Prepcart.</p>
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
              <p>© ${new Date().getFullYear()} Prepcart. All rights reserved.</p>
              <p>This link expires in 1 hour for security reasons.</p>
            </div>
          </div>
        </div>
      `,
      text: `Password Reset Request - Prepcart

Hello ${user?.name || "User"},

You requested to reset your password for Prepcart.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

⚠️ Security Notice:
If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Prepcart. All rights reserved.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("Password reset email error:", error.message);
    throw error;
  }
};
// Password changed confirmation email
export const sendPasswordChangedEmail = async (email, user, locale = 'en') => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "✅ Your Prepcart Password Has Been Changed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Changed Successfully</h1>
          </div>
          
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Hello ${user.name},</h2>
            <p>Your Prepcart password has been successfully changed.</p>
            
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${locale}/login" 
                 style="background: #4a9fd8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Login to Your Account →
              </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; color: #718096; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Prepcart. All rights reserved.</p>
              <p>This is a security notification for your account: ${email}</p>
            </div>
          </div>
        </div>
      `,
      text: `Password Changed Successfully - Prepcart

Hello ${user.name},

Your Prepcart password has been successfully changed on ${new Date().toLocaleString()}.

🔒 Security Tip:
If you did NOT make this change, please contact us immediately at support@prepcart.com

Login to your account: ${process.env.NEXT_PUBLIC_APP_URL}/${locale}/login

© ${new Date().getFullYear()} Prepcart. All rights reserved.`,
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


// Send welcome email to subscriber
export const sendSubscriptionWelcomeEmail = async (subscription) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: subscription.email,
      subject: '🎉 Welcome to Prepcart Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8cc63c 0%, #4a9fd8 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Prepcart!</h1>
            <p style="color: white; opacity: 0.9; margin: 10px 0 0;">Your meal planning journey starts here</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>Thank You for Subscribing!</h2>
            <p>Hello,</p>
            <p>You've successfully subscribed to the Prepcart newsletter. We'll keep you updated with:</p>
            
            <ul style="line-height: 1.8;">
              <li>🍽️ Weekly meal plans and recipes</li>
              <li>🛒 Grocery shopping tips</li>
              <li>🎁 Exclusive offers and discounts</li>
              <li>📈 Nutrition and health tips</li>
            </ul>
            
            <div style="background: #f8fafc; border-left: 4px solid #4a9fd8; padding: 20px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #2d3748;">Your Subscription Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #4a5568;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0;">${subscription.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568;"><strong>Postal Code:</strong></td>
                  <td style="padding: 8px 0;">${subscription.postalCode}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568;"><strong>Subscribed On:</strong></td>
                  <td style="padding: 8px 0;">${new Date(subscription.subscribedAt).toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
                 style="background: #8cc63c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Explore Prepcart →
              </a>
            </div>
            
            <!-- Unsubscribe -->
            <p style="font-size: 14px; color: #666;">
              <strong>Changed your mind?</strong><br>
              You can unsubscribe anytime by clicking 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${subscription.email}" style="color: #4a9fd8;">here</a>.
            </p>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 20px; color: #718096; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Prepcart. All rights reserved.</p>
              <p>This email was sent to ${subscription.email} as part of your newsletter subscription.</p>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to Prepcart Newsletter!

Thank you for subscribing to the Prepcart newsletter!

We'll keep you updated with:
- Weekly meal plans and recipes
- Grocery shopping tips  
- Exclusive offers and discounts
- Nutrition and health tips

Your Subscription Details:
- Email: ${subscription.email}
- Postal Code: ${subscription.postalCode}
- Subscribed On: ${new Date(subscription.subscribedAt).toLocaleDateString()}

Explore Prepcart: ${process.env.NEXT_PUBLIC_APP_URL}

Changed your mind? You can unsubscribe anytime by visiting: ${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe

© ${new Date().getFullYear()} Prepcart. All rights reserved.
This email was sent to ${subscription.email} as part of your newsletter subscription.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to subscriber: ${subscription.email}`);
    return info;
  } catch (error) {
    console.error('❌ Subscriber welcome email error:', error.message);
    return null;
  }
};

// Send notification to admin
export const sendSubscriptionNotificationToAdmin = async (subscription) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER; // Add ADMIN_EMAIL to .env
    
    if (!adminEmail) {
      console.log('⚠️ ADMIN_EMAIL not set. Skipping admin notification.');
      return null;
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: adminEmail,
      subject: '📥 New Newsletter Subscription - Prepcart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4a9fd8 0%, #2d5aa0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Newsletter Subscription</h1>
            <p style="color: white; opacity: 0.9; margin: 5px 0 0;">Prepcart Admin Notification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2>📊 New Subscriber Details</h2>
            
            <div style="background: #f0f7ff; border: 1px solid #d1e3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4a5568;">Email:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${subscription.email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4a5568;">Postal Code:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${subscription.postalCode}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4a5568;">Subscription Date:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${new Date(subscription.subscribedAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #4a5568;">Subscription ID:</td>
                  <td style="padding: 10px;">${subscription._id}</td>
                </tr>
              </table>
            </div>
            
            <!-- Statistics -->
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2d3748;">📈 Quick Stats</h3>
              <p>Total subscribers this month: <strong>Check database</strong></p>
              <p>Location: <strong>${subscription.postalCode} area</strong></p>
            </div>
            
            <!-- Action Links -->
            <div style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscriptions" 
                 style="background: #4a9fd8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                View All Subscriptions
              </a>
              <a href="mailto:${subscription.email}" 
                 style="background: #8cc63c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Email Subscriber
              </a>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; color: #718096; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Prepcart Admin System</p>
              <p>This is an automated notification. Do not reply to this email.</p>
            </div>
          </div>
        </div>
      `,
      text: `New Newsletter Subscription - Prepcart

📊 New Subscriber Details:
Email: ${subscription.email}
Postal Code: ${subscription.postalCode}
Subscription Date: ${new Date(subscription.subscribedAt).toLocaleString()}
Subscription ID: ${subscription._id}

📈 Quick Stats:
Total subscribers this month: Check database
Location: ${subscription.postalCode} area

Admin Actions:
- View All Subscriptions: ${process.env.NEXT_PUBLIC_APP_URL}/admin/subscriptions
- Email Subscriber: mailto:${subscription.email}

© ${new Date().getFullYear()} Prepcart Admin System
This is an automated notification. Do not reply to this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent to: ${adminEmail}`);
    return info;
  } catch (error) {
    console.error('Admin notification email error:', error.message);
    return null;
  }
};

export default transporter;
