const express = require('express');
const cors = require('cors');
const path = require('path');
const { register, mail } = require('./functions');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve all static files (HTML, CSS, JSON) from the current directory
app.use(express.static(__dirname));

// Route for root (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Optional: if you want to be explicit for signup.html
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// API endpoint to handle registration
app.post('/api/register', async (req, res) => {
    const { username, password, gmail, phone, gender, country } = req.body;

    try {
        // Insert into DB
        await register(username, password, gmail, phone, gender, country);

        // Send confirmation email
        await mail(
            'ariharan86400@gmail.com',
            gmail,
            'Registration Confirmation',
            `Hello ${username}, you have been successfully registered.`
        );

        res.json({ message: 'Registered successfully and email sent!' });
    } catch (error) {
        console.error('Error during registration process:', error);

        // Send an error response
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

