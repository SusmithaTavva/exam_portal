const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

const createTables = async () => {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        // 1. Create Students Table
        console.log('Creating students table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                firebase_uid VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                roll_number VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Indices for students
        await client.query(`CREATE INDEX IF NOT EXISTS idx_students_firebase_uid ON students(firebase_uid);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);`);

        // 2. Create Admins Table
        console.log('Creating admins table...');
        // Note: Matching schema required by adminAuth.js (email, full_name, password_hash)
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Seed Default Admin
        const defaultAdminEmail = 'admin@example.com';
        const defaultAdminPassword = 'admin123';
        const defaultAdminName = 'System Admin';

        const adminCheck = await client.query('SELECT * FROM admins WHERE email = $1', [defaultAdminEmail]);

        if (adminCheck.rows.length === 0) {
            console.log(`Seeding default admin (${defaultAdminEmail})...`);
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(defaultAdminPassword, salt);

            await client.query(
                'INSERT INTO admins (email, password_hash, full_name) VALUES ($1, $2, $3)',
                [defaultAdminEmail, hash, defaultAdminName]
            );
            console.log(`✅ Default admin created: ${defaultAdminEmail} / ${defaultAdminPassword}`);
        } else {
            console.log('ℹ️ Default admin already exists.');
        }

        console.log('✅ Database setup completed successfully!');

    } catch (err) {
        console.error('❌ Error creating tables:', err);
    } finally {
        client.release();
        pool.end();
    }
};

createTables();
