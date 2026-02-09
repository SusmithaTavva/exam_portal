# MCQ Exam Portal

A full-stack MCQ Exam Portal built with React, Node.js, Express, PostgreSQL, and Firebase Authentication.

## Features
- **Student Portal**: Take exams, view results, and track progress.
- **Admin/Instructor Dashboard**: Create and manage exams, view student performance, and manage users.
- **Secure Authentication**: Firebase Auth for Students, JWT for Admins.

## Prerequisites

Before identifying the setup, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

#### Environment Configuration
Create a `.env` file in the `backend` directory based on `.env.example`:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL credentials:
```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=exam_portal
DB_PASSWORD=your_password
DB_PORT=5432

# Firebase
# Place your serviceAccountKey.json in the backend folder
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```
> **Note**: You need a `serviceAccountKey.json` from your Firebase project settings. Place it in the `backend/` root.

#### Database Initialization
Run the setup script to create tables and seed a default admin:
```bash
# Ensure your PostgreSQL server is running and the database 'exam_portal' exists
# If not, create it: createdb exam_portal

npm run setup-db
```
This script will:
- Create `students` and `admins` tables.
- Create a default admin account.

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:
```bash
cd ../mcq-exam-portal
npm install
```

#### Environment Configuration
Create a `.env` file in the `mcq-exam-portal` directory:
```bash
cp .env.example .env 2>/dev/null || type nul > .env 
# (Or just create .env manually)
```
Add the following:
```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Start Backend
In the `backend` directory:
```bash
npm run dev
# Server running on http://localhost:5000
```

### Start Frontend
In the `mcq-exam-portal` directory:
```bash
npm run dev
# App running on http://localhost:5173
```

## Login Credentials

### Admin Login
- **URL**: `http://localhost:5173/admin/login`
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Student Login
- **URL**: `http://localhost:5173/login`
- **Method**: Sign in via Google (Firebase Auth).
- **Note**: New students must register their Roll Number after Google Sign-in.
