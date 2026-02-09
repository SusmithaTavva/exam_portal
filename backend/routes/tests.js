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

module.exports = router;
