const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Debug: Log directory and files
const projectRoot = __dirname;
console.log('🗂️  Project root:', projectRoot);
console.log('📁 Contents of project root:');
try {
    const files = fs.readdirSync(projectRoot);
    files.forEach(f => console.log('   -', f));
} catch (err) {
    console.error('❌ Error reading directory:', err.message);
}

// Serve static files from project root
const staticPath = path.join(__dirname);
console.log('📁 Serving static files from:', staticPath);
app.use(express.static(staticPath));

// Explicit routes for static assets (fallback)
app.use('/css', express.static(path.join(__dirname, 'css'), { dotfiles: 'allow' }));
app.use('/js', express.static(path.join(__dirname, 'js'), { dotfiles: 'allow' }));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { dotfiles: 'allow' }));

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`📍 ${req.method} ${req.path}`);
    next();
});

// Initialize EmailJS
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// Root endpoint - serve index.html from pages folder
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'pages', 'index.html');
    console.log('📄 Serving index.html from:', indexPath);
    res.sendFile(indexPath);
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

// Log 404 requests for debugging
app.use((req, res, next) => {
    console.log(`⚠️  404 - File not found: ${req.method} ${req.path}`);
    next();
});

// Fallback to index.html for any unmatched routes (SPA support)
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'pages', 'index.html');
    console.log(`↩️  Fallback: Serving index.html for route: ${req.path}`);
    res.sendFile(indexPath);
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
