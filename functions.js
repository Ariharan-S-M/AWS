const { createPool } = require('mysql');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Database connection
const pool = createPool({
    host: "database-1.c1g4e2uw4ua7.ap-south-1.rds.amazonaws.com",
    user: "ariharan",
    password: "BLUEdragon100!",
    database: "firstdatabase", 
    connectionLimit: 10,
    connectTimeout: 20000,
});

// Verify connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to database');
    connection.release();
});

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ariharan86400@gmail.com',
        pass: 'efxjqsryflqkdcdx'
    }
});

// Add these new functions for verification
async function createUnverifiedUser(username, password, gmail, phone, gender, country, verificationToken) {
    return new Promise((resolve, reject) => {
        const insert = `INSERT INTO users 
            (username, password, gmail, phone, gender, country, verification_token, is_verified) 
            VALUES (?, ?, ?, ?, ?, ?, ?, false)`;
        const values = [username, password, gmail, phone, gender, country, verificationToken];
        
        pool.query(insert, values, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function verifyUser(token) {
    return new Promise((resolve, reject) => {
        pool.query(
            'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = ?',
            [token],
            (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            }
        );
    });
}

async function sendVerificationEmail(email, token) {
    const verificationLink = `http://13.126.122.0:3000/verify?token=${token}`;
    
    const mailOptions = {
        from: 'ariharan86400@gmail.com',
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return reject(error);
            resolve(info);
        });
    });
}

module.exports = { 
    createUnverifiedUser, 
    verifyUser, 
    sendVerificationEmail 
};