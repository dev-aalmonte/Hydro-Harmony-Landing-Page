const express = require('express');
const cors = require('cors');
const path = require('path');
const emailjs = require('@emailjs/nodejs');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['POST', 'OPTIONS', 'GET'],
    credentials: true
}));

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// Initialize EmailJS
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// Root endpoint - serve index.html from pages folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, phone, poolType, title, message } = req.body;

        // Validate required fields
        if (!name || !email || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, email, title, message'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Rate limiting (basic check - could be improved with Redis)
        // For now, we'll just accept all requests

        // Send email via EmailJS
        await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            {
                USER_NAME: name,
                USER_EMAIL: email,
                USER_PHONE: phone || 'Not provided',
                POOL_TYPE: poolType || 'Not specified',
                TITLE: title,
                MESSAGE: message,
            }
        );

        res.json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('EmailJS Error:', error);

        // Don't expose internal error details to client
        res.status(500).json({
            success: false,
            error: 'Failed to send email. Please try again later.'
        });
    }
});

// Fallback to index.html for any unmatched routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    console.log(`✓ Email endpoint: POST http://localhost:${PORT}/api/send-email`);
});

module.exports = app;
