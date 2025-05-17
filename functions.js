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

function register(username, password, gmail, phone, gender, country) {
    const insert = 'INSERT INTO users (username, password, gmail, phone, gender, country) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [username, password, gmail, phone, gender, country];
    
    pool.query(insert, values, (err, results) => {
        if (err) {
            console.error("DB Insertion Error:", err);
        }
        console.log("user inserted:", results);
    });
}

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ariharan86400@gmail.com',
        pass: 'efxjqsryflqkdcdx'
    }
});

function mail(from, to, subject, text) {
    const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Email Not Sent:', error);
        }
        console.log('✅ Email sent:', info.response);
    });
}

module.exports = { register, mail };