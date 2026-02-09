const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import configurations
const { pool } = require('./config/db');
require('./config/firebase'); // Initialize Firebase Admin SDK

// Import routes
const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const uploadRoutes = require('./routes/upload');
const studentRoutes = require('./routes/student');
const testsRoutes = require('./routes/tests');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// ... (health checks)

// API Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tests', testsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Database health check
app.get('/health/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.status(200).json({
            success: true,
            message: 'Database connection is healthy',
            timestamp: result.rows[0].now,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
        });
    }
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminAuthRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server gracefully');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});

module.exports = app;
