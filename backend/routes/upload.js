const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const stream = require('stream');
const { pool } = require('../config/db');
const verifyAdmin = require('../middleware/verifyAdmin');

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * POST /api/admin/upload/questions
 * Upload a bulk file of questions
 */
router.post('/questions', verifyAdmin, upload.single('file'), async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { testName, testDescription } = req.body;
        if (!testName) {
            return res.status(400).json({ success: false, message: 'Test Name is required' });
        }

        let data = [];

        // Check file type
        // Note: mimetype for CSV can vary (text/csv, application/vnd.ms-excel, etc.)
        const isCsv = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';

        if (isCsv) {
            // Parse CSV using csv-parser
            const bufferStream = new stream.PassThrough();
            bufferStream.end(req.file.buffer);

            await new Promise((resolve, reject) => {
                bufferStream
                    .pipe(csv())
                    .on('data', (row) => data.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            // Parse Excel using xlsx
            try {
                const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                data = xlsx.utils.sheet_to_json(sheet);
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid Excel file format' });
            }
        }



        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'File is empty' });
        }

        // Start Transaction
        await client.query('BEGIN');

        // 1. Create Test
        const testResult = await client.query(
            'INSERT INTO tests (title, description) VALUES ($1, $2) RETURNING id',
            [testName, testDescription || '']
        );
        const testId = testResult.rows[0].id;

        // 2. Insert Questions
        let insertedCount = 0;
        for (const row of data) {
            // Normalize keys to handle case sensitivity and spaces
            const getVal = (key) => {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
                for (const k of Object.keys(row)) {
                    if (k.toLowerCase().replace(/\s+/g, '') === normalizedKey) return row[k];
                }
                return undefined;
            };

            const questionText = getVal('question');
            const optionA = getVal('optiona');
            const optionB = getVal('optionb');
            const optionC = getVal('optionc');
            const optionD = getVal('optiond');
            const correctOption = getVal('correctoption'); // matches 'Correct Option' -> 'correctoption'
            const marks = getVal('marks') || 1;

            if (questionText && optionA && optionB && correctOption) {
                await client.query(
                    `INSERT INTO questions 
                    (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        testId,
                        questionText,
                        optionA,
                        optionB,
                        optionC || '',
                        optionD || '',
                        correctOption.toString().replace(/[^A-D]/gi, '').toUpperCase(), // Clean input to just A, B, C, or D
                        marks
                    ]
                );
                insertedCount++;
            } else {
                // console.warn('Skipping invalid row:', row);
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Successfully created test "${testName}" with ${insertedCount} questions.`,
            testId: testId,
            questionsCount: insertedCount
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/admin/upload/question
 * Add a single question to a test
 * Body: { testId, questionText, optionA, optionB, optionC, optionD, correctOption, marks }
 */
router.post('/question', verifyAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            testId,
            testName,
            testDescription,
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            marks
        } = req.body;

        // Validation
        if (!questionText || !optionA || !optionB || !correctOption) {
            return res.status(400).json({
                success: false,
                message: 'Question text, Option A, Option B, and Correct Option are required'
            });
        }

        // Validate correct option is A, B, C, or D
        const cleanCorrectOption = correctOption.toString().toUpperCase().trim();
        if (!['A', 'B', 'C', 'D'].includes(cleanCorrectOption)) {
            return res.status(400).json({
                success: false,
                message: 'Correct option must be A, B, C, or D'
            });
        }

        await client.query('BEGIN');

        let finalTestId = testId;

        // If no testId provided, create a new test
        if (!finalTestId) {
            if (!testName) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Either testId or testName is required'
                });
            }

            const testResult = await client.query(
                'INSERT INTO tests (title, description) VALUES ($1, $2) RETURNING id',
                [testName, testDescription || '']
            );
            finalTestId = testResult.rows[0].id;
        } else {
            // Verify test exists
            const testCheck = await client.query('SELECT id FROM tests WHERE id = $1', [finalTestId]);
            if (testCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Test not found'
                });
            }
        }

        // Insert the question
        const result = await client.query(
            `INSERT INTO questions 
            (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id`,
            [
                finalTestId,
                questionText,
                optionA,
                optionB,
                optionC || '',
                optionD || '',
                cleanCorrectOption,
                marks || 1
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            questionId: result.rows[0].id,
            testId: finalTestId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Single Question Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add question',
            error: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
