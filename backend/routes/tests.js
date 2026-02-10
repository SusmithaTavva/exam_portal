const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyAdmin = require('../middleware/verifyAdmin');

/**
 * GET /api/tests
 * Fetch all tests with question counts
 */
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id,
                t.title,
                t.description,
                t.created_at,
                COUNT(q.id) as question_count
            FROM tests t
            LEFT JOIN questions q ON t.id = q.test_id
            GROUP BY t.id, t.title, t.description, t.created_at
            ORDER BY t.created_at DESC
        `);

        res.json({
            success: true,
            tests: result.rows
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tests',
            error: error.message
        });
    }
});

/**
 * DELETE /api/tests/:id
 * Delete a test and all its questions
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        res.json({
            success: true,
            message: 'Test deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete test',
            error: error.message
        });
    }
});

/**
 * GET /api/tests/institutes
 * Fetch all institutes with their student counts
 */
router.get('/institutes', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                LOWER(institute) as institute,
                COUNT(*) as student_count,
                STRING_AGG(full_name, ', ') as student_names
            FROM students
            GROUP BY LOWER(institute)
            ORDER BY LOWER(institute) ASC
        `);

        res.json({
            success: true,
            institutes: result.rows
        });
    } catch (error) {
        console.error('Error fetching institutes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch institutes',
            error: error.message
        });
    }
});

/**
 * GET /api/tests/institutes/:instituteName/students
 * Fetch all students from a specific institute
 */
router.get('/institutes/:instituteName/students', verifyAdmin, async (req, res) => {
    try {
        const { instituteName } = req.params;
        
        const result = await pool.query(`
            SELECT 
                id,
                full_name,
                email,
                roll_number,
                institute,
                created_at
            FROM students
            WHERE LOWER(institute) = LOWER($1)
            ORDER BY full_name ASC
        `, [instituteName]);

        res.json({
            success: true,
            institute: instituteName,
            students: result.rows
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
});

/**
 * POST /api/tests/assign
 * Assign a test to specific students
 */
router.post('/assign', verifyAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { test_id, student_ids } = req.body;

        if (!test_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'test_id and student_ids array are required'
            });
        }

        // Verify test exists
        const testCheck = await client.query('SELECT id FROM tests WHERE id = $1', [test_id]);
        if (testCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        await client.query('BEGIN');

        // Create test_assignments table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_assignments (
                id SERIAL PRIMARY KEY,
                test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(test_id, student_id)
            )
        `);

        // Insert assignments (on conflict, update assigned_at)
        const insertPromises = student_ids.map(student_id =>
            client.query(`
                INSERT INTO test_assignments (test_id, student_id, is_active)
                VALUES ($1, $2, true)
                ON CONFLICT (test_id, student_id) 
                DO UPDATE SET assigned_at = CURRENT_TIMESTAMP, is_active = true
            `, [test_id, student_id])
        );

        await Promise.all(insertPromises);
        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Test assigned to ${student_ids.length} student(s)`,
            assigned_count: student_ids.length
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error assigning test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign test',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/tests/:testId/assignments
 * Get all students assigned to a specific test
 */
router.get('/:testId/assignments', verifyAdmin, async (req, res) => {
    try {
        const { testId } = req.params;

        const result = await pool.query(`
            SELECT 
                s.id,
                s.full_name,
                s.email,
                s.roll_number,
                s.institute,
                ta.assigned_at,
                ta.is_active
            FROM test_assignments ta
            JOIN students s ON ta.student_id = s.id
            WHERE ta.test_id = $1 AND ta.is_active = true
            ORDER BY s.institute, s.full_name
        `, [testId]);

        res.json({
            success: true,
            test_id: testId,
            assignments: result.rows
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignments',
            error: error.message
        });
    }
});

module.exports = router;
