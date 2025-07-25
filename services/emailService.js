const Mailgun = require("mailgun.js");
const formData = require("form-data");

class EmailService {
  constructor() {
    this.mailgun = new Mailgun(formData);
    this.mg = this.mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });
    this.domain = process.env.MAILGUN_DOMAIN;
    this.fromEmail = process.env.FROM_EMAIL;
  }

  async sendVerificationEmail(email, username, verificationToken) {
    const verificationUrl = `${
      process.env.BASE_URL || "http://localhost:3000"
    }/api/auth/verify-email?token=${verificationToken}`;

    const emailData = {
      from: this.fromEmail,
      to: email,
      subject: "Verify your Echo account",
      html: this.getVerificationEmailTemplate(username, verificationUrl),
    };

    try {
      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("Verification email sent:", result);
      return result;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  async sendPasswordResetEmail(email, username, resetToken) {
    const resetUrl = `${
      process.env.BASE_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    const emailData = {
      from: this.fromEmail,
      to: email,
      subject: "Reset your Echo password",
      html: this.getPasswordResetEmailTemplate(username, resetUrl),
    };

    try {
      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("Password reset email sent:", result);
      return result;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  getVerificationEmailTemplate(username, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Echo Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1da1f2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { background: #1da1f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Echo!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}!</h2>
            <p>Thank you for signing up for Echo. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Echo, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Echo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailTemplate(username, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Echo Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1da1f2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { background: #1da1f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}!</h2>
            <p>We received a request to reset your Echo account password. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This password reset link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Echo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
