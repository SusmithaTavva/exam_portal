const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

/**
 * GET /api/student/tests
 * Fetch tests assigned to the logged-in student
 */
router.get('/tests', verifyToken, async (req, res) => {
    try {
        const firebase_uid = req.firebaseUid;

        // First, get the student ID from firebase_uid
        const studentResult = await pool.query(
            'SELECT id FROM students WHERE firebase_uid = $1',
            [firebase_uid]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const studentId = studentResult.rows[0].id;

        // Fetch tests assigned to this student
        const result = await pool.query(`
            SELECT 
                t.id, 
                t.title, 
                t.description,
                t.created_at,
                (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as question_count,
                ta.assigned_at
            FROM tests t
            INNER JOIN test_assignments ta ON t.id = ta.test_id
            WHERE ta.student_id = $1 AND ta.is_active = true
            ORDER BY ta.assigned_at DESC
        `, [studentId]);

        // Transform data to match frontend expectations
        const tests = result.rows.map(test => ({
            id: test.id,
            title: test.title,
            description: test.description,
            questions: parseInt(test.question_count),
            duration: '60 Minutes', // Placeholder
            subject: 'General', // Placeholder
            difficulty: 'Medium', // Placeholder
            color: 'bg-blue-50 border-blue-200', // Default styling
            assignedAt: test.assigned_at
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
 * Fetch a specific test and its questions (only if assigned to the student)
 */
router.get('/test/:testId', verifyToken, async (req, res) => {
    const { testId } = req.params;
    const firebase_uid = req.firebaseUid;

    try {
        // Get student ID
        const studentResult = await pool.query(
            'SELECT id FROM students WHERE firebase_uid = $1',
            [firebase_uid]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const studentId = studentResult.rows[0].id;

        // Check if test is assigned to this student
        const assignmentCheck = await pool.query(
            'SELECT * FROM test_assignments WHERE test_id = $1 AND student_id = $2 AND is_active = true',
            [testId, studentId]
        );

        if (assignmentCheck.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'This test is not assigned to you' 
            });
        }

        // Fetch Test Details
        const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);

        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        const test = testResult.rows[0];

        // Fetch Questions (excluding correct_option to prevent cheating)
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
            options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(opt => opt !== null && opt !== ''), // Filter out empty options
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
