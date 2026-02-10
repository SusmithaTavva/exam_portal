const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD), // Ensure password is a string
    port: process.env.DB_PORT || 5432,
});

const addInstituteColumn = async () => {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        // Check if column already exists
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='students' AND column_name='institute'
        `);

        if (checkColumn.rows.length > 0) {
            console.log('ℹ️  Institute column already exists. No migration needed.');
            return;
        }

        console.log('📄 Adding institute column to students table...');

        // Add institute column (allowing NULL initially for existing records)
        await client.query(`
            ALTER TABLE students 
            ADD COLUMN institute VARCHAR(255);
        `);
        console.log('✅ Column added');

        // Update existing records with a default value
        await client.query(`
            UPDATE students 
            SET institute = 'Not Specified' 
            WHERE institute IS NULL;
        `);
        console.log('✅ Existing records updated');

        // Make the column NOT NULL after setting defaults
        await client.query(`
            ALTER TABLE students 
            ALTER COLUMN institute SET NOT NULL;
        `);
        console.log('✅ Column set to NOT NULL');

        // Verify the change
        const result = await client.query(`
            SELECT COUNT(*) as total_students, 
                   COUNT(institute) as students_with_institute 
            FROM students;
        `);
        
        console.log('✅ Migration completed successfully!');
        console.log(`📊 Total students: ${result.rows[0].total_students}`);
        console.log(`📊 Students with institute: ${result.rows[0].students_with_institute}`);

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
};

addInstituteColumn();
