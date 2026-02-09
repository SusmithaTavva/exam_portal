const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

/**
 * GET /api/student/tests
 * Fetch all available tests
 */
router.get('/tests', verifyToken, async (req, res) => {
    try {
        // Fetch all tests with question count
        const result = await pool.query(`
            SELECT 
                t.id, 
                t.title, 
                t.description,
                t.created_at,
                (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as question_count
            FROM tests t
            ORDER BY t.created_at DESC
        `);

        // Transform data to match frontend expectations (adding placeholders for missing fields like duration/subject for now)
        const tests = result.rows.map(test => ({
            id: test.id,
            title: test.title,
            description: test.description,
            questions: parseInt(test.question_count),
            duration: '60 Minutes', // Placeholder: logic to store/fetch duration needs to be added to DB if dynamic
            subject: 'General', // Placeholder
            difficulty: 'Medium', // Placeholder
            color: 'bg-blue-50 border-blue-200' // Default styling
        }));

        res.json({
            success: true,
            tests: tests
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tests'
        });
    }
});

/**
 * GET /api/student/test/:testId
 * Fetch a specific test and its questions
 */
router.get('/test/:testId', verifyToken, async (req, res) => {
    const { testId } = req.params;

    try {
        // 1. Fetch Test Details
        const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);

        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        const test = testResult.rows[0];

        // 2. Fetch Questions (excluding correct_option to prevent cheating)
        // We select option_a, option_b, etc., but do NOT select correct_option
        const questionsResult = await pool.query(`
            SELECT 
                id, 
                question_text as question, 
                option_a, 
                option_b, 
                option_c, 
                option_d,
                marks
            FROM questions 
            WHERE test_id = $1
            ORDER BY id ASC
        `, [testId]);

        // Transform questions to frontend format
        const questions = questionsResult.rows.map(q => ({
            id: q.id,
            question: q.question,
            options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(opt => opt !== null && opt !== ''), // Filter out empty options if any
            marks: q.marks
        }));

        res.json({
            success: true,
            test: {
                id: test.id,
                title: test.title,
                description: test.description,
                questions: questions
            }
        });

    } catch (error) {
        console.error('Error fetching test details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test details'
        });
    }
});

module.exports = router;
