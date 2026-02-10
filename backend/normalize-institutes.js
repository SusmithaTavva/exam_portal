const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT || 5432,
});

const normalizeInstituteNames = async () => {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');
        console.log('📄 Normalizing institute names to lowercase...');

        // Update all institute names to lowercase
        const result = await client.query(`
            UPDATE students 
            SET institute = LOWER(institute)
            WHERE institute != LOWER(institute)
            RETURNING id, full_name, institute
        `);

        if (result.rows.length > 0) {
            console.log(`✅ Updated ${result.rows.length} student record(s):`);
            result.rows.forEach(row => {
                console.log(`   - ${row.full_name}: ${row.institute}`);
            });
        } else {
            console.log('ℹ️  All institute names are already normalized.');
        }

        // Show current institute distribution
        const institutes = await client.query(`
            SELECT institute, COUNT(*) as count
            FROM students
            GROUP BY institute
            ORDER BY institute
        `);

        console.log('\n📊 Current Institute Distribution:');
        institutes.rows.forEach(inst => {
            // Capitalize first letter for display
            const displayName = inst.institute.charAt(0).toUpperCase() + inst.institute.slice(1);
            console.log(`   - ${displayName}: ${inst.count} student(s)`);
        });

        console.log('\n✅ Normalization completed successfully!');

    } catch (err) {
        console.error('❌ Normalization failed:', err.message);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
};

normalizeInstituteNames();
