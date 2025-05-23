const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "database-1.c1g4e2uw4ua7.ap-south-1.rds.amazonaws.com",
  user: process.env.DB_USER || "ariharan",
  password: process.env.DB_PASSWORD || "BLUEdragon100!",
  database: process.env.DB_NAME || "firstdatabase",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ariharan86400@gmail.com',
    pass: 'efxjqsryflqkdcdx' // Make sure this app password is valid
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});







//function to log in users
app.post('/api/logUsers', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.query(
      'SELECT username, is_verified FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The username or password is incorrect. Please try again!"
      });
    }

    const user = users[0];
    
    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Your email is not verified yet. Please check your inbox for the verification link."
      });
    }

    return res.json({
      success: true,
      message: 'You have logged in successfully'
    });
  } catch (error) {
    console.error("Cannot fetch from the database:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});









// Registration endpoint with UUID verification
app.post('/api/register', async (req, res) => {
  const { username, password, gmail, phone, gender, country } = req.body;

  console.log("Received registration request:", req.body);

  const verificationToken = uuidv4();
  const verificationLink = `http://${req.headers.host}/verify-email?token=${verificationToken}`;

  try {
    // Check for existing username in verified accounts
    const [verifiedUsername] = await pool.query(
      'SELECT sno FROM users WHERE username = ? AND is_verified = 1',
      [username]
    );

    if (verifiedUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'The username already exists, please try again!'
      });
    }

    // Check for existing email in verified accounts
    const [verifiedEmail] = await pool.query(
      'SELECT sno FROM users WHERE gmail = ? AND is_verified = 1',
      [gmail]
    );

    if (verifiedEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if this exact username+email combo exists unverified
    const [existingUnverified] = await pool.query(
      'SELECT sno FROM users WHERE username = ? AND gmail = ? AND is_verified = 0',
      [username, gmail]
    );

    if (existingUnverified.length > 0) {
      // Update the existing unverified record with new details
      await pool.query(
        `UPDATE users 
        SET password = ?, phone = ?, gender = ?, country = ?, 
            verification_token = ?, created_at = NOW()
        WHERE username = ? AND gmail = ? AND is_verified = 0`,
        [password, phone, gender, country, verificationToken, username, gmail]
      );

      // Resend verification email
      await sendVerificationEmail(gmail, username, verificationLink);
      
      return res.json({
        success: true,
        message: 'New verification email sent! Please check your inbox.'
      });
    }

    // Check if username exists unverified (with different email)
    const [usernameExists] = await pool.query(
      'SELECT sno FROM users WHERE username = ? AND is_verified = 0',
      [username]
    );

    if (usernameExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'The username already exists, please try again!'
      });
    }

    // Check if email exists unverified (with different username)
    const [emailExists] = await pool.query(
      'SELECT sno FROM users WHERE gmail = ? AND is_verified = 0',
      [gmail]
    );

    if (emailExists.length > 0) {
      // Delete the old unverified record with this email
      await pool.query(
        'DELETE FROM users WHERE gmail = ? AND is_verified = 0',
        [gmail]
      );
    }

    // New registration (or re-registration after deleting old unverified record)
    await pool.query(
      `INSERT INTO users 
      (username, password, gmail, phone, gender, country, verification_token, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, password, gmail, phone, gender, country, verificationToken, false]
    );

    await sendVerificationEmail(gmail, username, verificationLink);

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});



// Helper function for sending verification emails
async function sendVerificationEmail(gmail, username, verificationLink) {
  await transporter.sendMail({
    from: '"Your Service Name" <ariharan86400@gmail.com>',
    replyTo: 'ariharan86400@gmail.com',
    to: gmail,
    subject: 'Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Our Service!</h2>
        <p>Hello ${username},</p>
        <p>Please verify your email address to complete your registration:</p>
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Verify Email
        </a>
        <p>Or copy this link to your browser:</p>
        <p style="word-break: break-all;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'NodeMailer'
    }
  });
  console.log("Verification email sent to:", gmail);
}







// Email verification endpoint
app.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Invalid verification link');
  }

  try {
    const [result] = await pool.query(
      `UPDATE users 
      SET is_verified = TRUE, verification_token = NULL 
      WHERE verification_token = ? AND is_verified = FALSE`,
      [token]
    );

    if (result.affectedRows === 0) {
      return res.sendFile(path.join(__dirname, 'public', 'verification-failed.html'));
    }

    res.sendFile(path.join(__dirname, 'public', 'verification-success.html'));
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('Verification failed. Please try again.');
  }
});







// Resend verification endpoint
app.post('/api/resend-verification', async (req, res) => {
  const { email } = req.body;
  console.log("Resend request for:", email);

  try {
    const [users] = await pool.query(
      'SELECT username FROM users WHERE gmail = ? AND is_verified = FALSE',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified or not found'
      });
    }

    const user = users[0];
    const newToken = uuidv4();
    const verificationLink = `http://${req.headers.host}/verify-email?token=${newToken}`;

    await pool.query(
      'UPDATE users SET verification_token = ? WHERE gmail = ?',
      [newToken, email]
    );

    await transporter.sendMail({
      from: '"Your Service Name" <ariharan86400@gmail.com>',
      replyTo: 'ariharan86400@gmail.com',
      to: email,
      subject: 'New Verification Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Verification Link</h2>
          <p>Hello ${user.username},</p>
          <p>Here's your new verification link:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
            Verify Email
          </a>
          <p>Or copy this link to your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer'
      }
    });

    console.log("Resent verification email to:", email);

    res.json({
      success: true,
      message: 'New verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
