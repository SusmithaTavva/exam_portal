const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

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

/**
 * POST /api/student/create
 * Create a new student manually (admin only)
 */
router.post('/create', verifyAdmin, async (req, res) => {
    try {
        const { full_name, email, roll_number, institute } = req.body;

        // Validate required fields
        if (!full_name || !email || !institute) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, and institute are required'
            });
        }

        // Check if student with same email already exists
        const existingStudent = await pool.query(
            'SELECT id FROM students WHERE email = $1',
            [email]
        );

        if (existingStudent.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }

        // Insert new student (without firebase_uid - manual creation)
        const result = await pool.query(`
            INSERT INTO students (full_name, email, roll_number, institute, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, full_name, email, roll_number, institute, created_at
        `, [full_name, email, roll_number || null, institute.toLowerCase()]);

        const newStudent = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            student: newStudent
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create student',
            error: error.message
        });
    }
});

/**
 * DELETE /api/student/:id
 * Delete a single student (admin only)
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete student and all associated test assignments
        const result = await pool.query(
            'DELETE FROM students WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student',
            error: error.message
        });
    }
});

/**
 * DELETE /api/student/institute/:instituteName/all
 * Delete all students from a specific institute (admin only)
 */
router.delete('/institute/:instituteName/all', verifyAdmin, async (req, res) => {
    try {
        const { instituteName } = req.params;

        const result = await pool.query(
            'DELETE FROM students WHERE LOWER(institute) = LOWER($1) RETURNING *',
            [instituteName]
        );

        res.json({
            success: true,
            message: `Successfully deleted ${result.rowCount} student(s) from ${instituteName}`,
            deleted_count: result.rowCount
        });
    } catch (error) {
        console.error('Error deleting students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete students',
            error: error.message
        });
    }
});

module.exports = router;
