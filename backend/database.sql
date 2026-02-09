-- MCQ Exam Portal Database Schema
-- Database: exam_portal

-- Create the students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on firebase_uid for faster lookups
CREATE INDEX idx_students_firebase_uid ON students(firebase_uid);

-- Create index on email for faster lookups
CREATE INDEX idx_students_email ON students(email);

-- Create index on roll_number for faster lookups
CREATE INDEX idx_students_roll_number ON students(roll_number);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create additional tables for exams, questions, etc. (extend as needed)
-- CREATE TABLE IF NOT EXISTS exams (
--     id SERIAL PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     description TEXT,
--     duration_minutes INTEGER NOT NULL,
--     created_by INTEGER REFERENCES students(id),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
