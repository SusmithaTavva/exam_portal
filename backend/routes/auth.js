const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

/**
 * POST /api/register
 * Register a new student in PostgreSQL after Firebase registration
 * Frontend should register user in Firebase first, then call this endpoint
 */
router.post('/register', verifyToken, async (req, res) => {
    try {
        const { full_name, email, roll_number } = req.body;
        const firebase_uid = req.firebaseUid; // From verifyToken middleware

        // Validate required fields
        if (!full_name || !email || !roll_number) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: full_name, email, roll_number',
            });
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT * FROM students WHERE firebase_uid = $1 OR email = $2 OR roll_number = $3',
            [firebase_uid, email, roll_number]
        );

        if (existingUser.rows.length > 0) {
            const existing = existingUser.rows[0];

            if (existing.firebase_uid === firebase_uid) {
                return res.status(409).json({
                    success: false,
                    message: 'User already registered with this Firebase account',
                });
            }

            if (existing.email === email) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered',
                });
            }

            if (existing.roll_number === roll_number) {
                return res.status(409).json({
                    success: false,
                    message: 'Roll number already registered',
                });
            }
        }

        // Insert new student into database
        const result = await query(
            `INSERT INTO students (firebase_uid, full_name, email, roll_number) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, firebase_uid, full_name, email, roll_number, created_at`,
            [firebase_uid, full_name, email, roll_number]
        );

        const newUser = result.rows[0];

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: newUser.id,
                firebase_uid: newUser.firebase_uid,
                full_name: newUser.full_name,
                email: newUser.email,
                roll_number: newUser.roll_number,
                created_at: newUser.created_at,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle database-specific errors
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                success: false,
                message: 'User with this information already exists',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
            error: error.message,
        });
    }
});

/**
 * POST /api/login
 * Verify Firebase token and return student profile from PostgreSQL
 * Frontend should authenticate with Firebase first, then call this endpoint
 */
router.post('/login', verifyToken, async (req, res) => {
    try {
        const firebase_uid = req.firebaseUid; // From verifyToken middleware

        // Fetch student profile from database
        const result = await query(
            'SELECT id, firebase_uid, full_name, email, roll_number, created_at FROM students WHERE firebase_uid = $1',
            [firebase_uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found. Please register first.',
            });
        }

        const student = result.rows[0];

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: student.id,
                firebase_uid: student.firebase_uid,
                full_name: student.full_name,
                email: student.email,
                roll_number: student.roll_number,
                created_at: student.created_at,
            },
        });
    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            error: error.message,
        });
    }
});

/**
 * GET /api/profile
 * Get current user's profile (protected route example)
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const firebase_uid = req.firebaseUid;

        const result = await query(
            'SELECT id, firebase_uid, full_name, email, roll_number, created_at FROM students WHERE firebase_uid = $1',
            [firebase_uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
            });
        }

        return res.status(200).json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Profile fetch error:', error);

        return res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message,
        });
    }
});

module.exports = router;
