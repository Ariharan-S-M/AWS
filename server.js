const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const session = require('express-session');
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
    user: process.env.EMAIL_USER || 'ariharan86400@gmail.com',
    pass: process.env.EMAIL_PASS || 'efxjqsryflqkdcdx'
  }
});

// Middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session?.authenticated) {
    return next();
  }
  res.status(401).redirect('/');
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Login endpoint
app.post('/api/logUsers', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.query(
      'SELECT sno, username, password, gmail, phone, gender, country, is_verified FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const user = users[0];
    
    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    req.session.authenticated = true;
    req.session.user = {
      id: user.sno,
      username: user.username,
      email: user.gmail,
      phone: user.phone,
      gender: user.gender,
      country: user.country
    };

    res.json({
      success: true,
      message: 'Login successful',
      redirect: '/logged/dashboard.html'
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});

// Protected routes
app.get('/logged/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logged', 'dashboard.html'));
});

app.get('/api/user-data', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Logout failed' 
      });
    }
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, gmail, phone, gender, country } = req.body;
  const verificationToken = uuidv4();
  const verificationLink = `http://${req.headers.host}/verify-email?token=${verificationToken}`;

  try {
    const [existingUser] = await pool.query(
      'SELECT sno FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const [existingEmail] = await pool.query(
      'SELECT sno FROM users WHERE gmail = ?',
      [gmail]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    await pool.query(
      `INSERT INTO users 
      (username, password, gmail, phone, gender, country, verification_token, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, password, gmail, phone, gender, country, verificationToken, 0]
    );

    await transporter.sendMail({
      from: '"Game Platform" <ariharan86400@gmail.com>',
      to: gmail,
      subject: 'Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Welcome to our platform!</h2>
          <p>Please verify your email by clicking this link:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>Or copy this URL: ${verificationLink}</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Email verification endpoint
app.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Invalid verification link');
  }

  try {
    const [result] = await pool.query(
      `UPDATE users 
       SET is_verified = 1, verification_token = NULL 
       WHERE verification_token = ? AND is_verified = 0`,
      [token]
    );

    if (result.affectedRows === 0) {
      return res.sendFile(path.join(__dirname, 'public', 'verification-failed.html'));
    }

    res.sendFile(path.join(__dirname, 'public', 'verification-success.html'));
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('Verification failed');
  }
});

// Resend verification email
app.post('/api/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await pool.query(
      'SELECT username, verification_token FROM users WHERE gmail = ? AND is_verified = 0',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email not found or already verified'
      });
    }

    const user = users[0];
    const verificationLink = `http://${req.headers.host}/verify-email?token=${user.verification_token}`;

    await transporter.sendMail({
      from: '"Game Platform" <ariharan86400@gmail.com>',
      to: email,
      subject: 'Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Verification Email</h2>
          <p>Here's your verification link:</p>
          <a href="${verificationLink}">Verify Email</a>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Verification email resent'
    });
  } catch (error) {
    console.error('Resend error:', error);
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