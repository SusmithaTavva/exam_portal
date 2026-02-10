const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT || 5432,
});

const createTestAssignmentsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        // Check if table already exists
        const checkTable = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'test_assignments'
        `);

        if (checkTable.rows.length > 0) {
            console.log('ℹ️  test_assignments table already exists. No migration needed.');
            return;
        }

        console.log('📄 Creating test_assignments table...');

        await client.query(`
            CREATE TABLE test_assignments (
                id SERIAL PRIMARY KEY,
                test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(test_id, student_id)
            )
        `);
        
        console.log('✅ Table created successfully');

        // Create index for faster lookups
        await client.query(`
            CREATE INDEX idx_test_assignments_student ON test_assignments(student_id);
        `);
        
        await client.query(`
            CREATE INDEX idx_test_assignments_test ON test_assignments(test_id);
        `);

        console.log('✅ Indexes created');
        console.log('✅ Migration completed successfully!');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
};

createTestAssignmentsTable();
