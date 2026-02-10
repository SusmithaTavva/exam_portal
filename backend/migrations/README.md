# Database Migrations

This directory contains SQL migration scripts to update the database schema.

## How to Run Migrations

### Option 1: Using psql command line
```bash
psql -U your_username -d your_database_name -f add-institute-column.sql
```

### Option 2: Using pgAdmin
1. Open pgAdmin and connect to your database
2. Open the Query Tool
3. Load the migration file
4. Execute the query

### Option 3: Using Node.js migration script
```bash
node run-migration.js add-institute-column.sql
```

## Available Migrations

### add-institute-column.sql
- **Date**: 2026-02-10
- **Purpose**: Adds institute/university field to students table
- **Impact**: Adds a new mandatory field for student registration
- **Safe to run**: Yes - handles existing data with default values
