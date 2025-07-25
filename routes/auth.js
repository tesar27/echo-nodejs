const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/database");
const emailService = require("../services/emailService");
const router = express.Router();

// Register user with email verification
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with verification token
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, display_name, email_verification_token, email_verification_expires, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, username, email, display_name, created_at`,
      [
        username,
        email,
        password_hash,
        display_name || username,
        verificationToken,
        verificationExpires,
        false,
      ]
    );

    const user = result.rows[0];

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        email,
        username,
        verificationToken
      );

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          email_verified: false,
          created_at: user.created_at,
        },
      });
    } catch (emailError) {
      // If email fails, we should still return success but warn about email
      console.error("Email verification failed:", emailError);
      res.status(201).json({
        success: true,
        message:
          "User registered successfully, but verification email could not be sent. Please contact support.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          email_verified: false,
          created_at: user.created_at,
        },
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find user with this token
    const result = await db.query(
      "SELECT id, username, email, email_verification_expires FROM users WHERE email_verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    // Mark email as verified and clear token
    await db.query(
      "UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1",
      [user.id]
    );

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now login.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        email_verified: true,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const result = await db.query(
      "SELECT id, username, email, email_verified FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update token
    await db.query(
      "UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3",
      [verificationToken, verificationExpires, user.id]
    );

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationToken
    );

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Login user (requires email verification)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find user by username or email
    const result = await db.query(
      "SELECT id, username, email, password_hash, display_name, email_verified FROM users WHERE username = $1 OR email = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
