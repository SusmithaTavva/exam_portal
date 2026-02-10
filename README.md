# MCQ Exam Portal

A full-stack MCQ Exam Portal built with React, Node.js, Express, PostgreSQL, and Firebase Authentication.

---

## 🚀 For Deployment Team

**Implementing these changes on production?**  
👉 **See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step implementation guide with:
- Detailed file-by-file changes
- Exact code snippets to add/modify
- Deployment sequence and testing checklist
- Troubleshooting common issues

**For technical details:**  
📋 [CHANGELOG.md](./CHANGELOG.md) - Full feature documentation and API details  
📝 [MODIFIED_FILES.md](./MODIFIED_FILES.md) - Quick reference of all changed files

---

> **📋 Recent Updates**: See [CHANGELOG.md](./CHANGELOG.md) for detailed list of new features, modified files, and improvements.

## ✨ Key Highlights
- **Institute Tracking**: Student registrations now include Institute/University affiliation
- **Bulk & Single Question Upload**: Upload questions via CSV/Excel or add them one by one through API
- **Real-Time Test Management**: View, manage, and delete tests with live database updates
- **Dual Authentication**: Firebase for students, JWT for admins
- **Complete Database Schema**: 6 tables with proper relationships and cascade deletes
- **Admin Dashboard**: Fully functional with real-time data display and test management

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
- **Note**: New students must register with:
  - Full Name
  - Roll Number  
  - Email
  - Institute/University (Required)
  - Password

## Bulk Upload MCQ Questions

### Available Sample CSV Files

The project includes several pre-made CSV files with MCQ questions:

1. **mcq_questions_sample.csv** - Comprehensive set with 50 mixed topic questions
2. **programming_questions.csv** - 50 computer science and programming questions
3. **aptitude_questions.csv** - 50 quantitative aptitude and reasoning questions

### CSV Format

Your CSV file must follow this format:

```csv
Question,Option A,Option B,Option C,Option D,Correct Option,Marks
What is 2 + 2?,3,4,5,6,B,1
```

**Required Columns:**
- `Question` - The question text
- `Option A` - First option
- `Option B` - Second option
- `Correct Option` - Must be A, B, C, or D

**Optional Columns:**
- `Option C` - Third option
- `Option D` - Fourth option
- `Marks` - Points for the question (defaults to 1)

### How to Upload

1. Log in as admin at `http://localhost:5173/admin/login`
2. Navigate to the Question Upload section
3. Choose your CSV or Excel file
4. Enter a Test Name (required)
5. Add a Test Description (optional)
6. Click Upload

---

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Student registration (requires: full_name, email, roll_number, institute, password)
- `POST /api/login` - Student login
- `POST /api/admin/login` - Admin login (JWT)

### Admin - Test Management
- `GET /api/tests` - List all tests with question counts (Admin only)
- `DELETE /api/tests/:id` - Delete a test (Admin only)
- `POST /api/admin/upload/questions` - Bulk upload questions via CSV/Excel (Admin only)
- `POST /api/admin/upload/question` - Add single question (Admin only)

### Student - Tests
- `GET /api/student/tests` - Get available tests for students
- `GET /api/student/test/:id` - Get specific test with questions
- `POST /api/student/submit` - Submit test answers

### Health Check
- `GET /health` - Server health status

For detailed API documentation with request/response examples, see [CHANGELOG.md](./CHANGELOG.md#-how-to-use-new-features)

---

## 📂 Project Structure

```
mcq-v0/
├── backend/                    # Node.js + Express API
│   ├── config/                # Database and Firebase config
│   ├── middleware/            # Auth middleware (verifyToken, verifyAdmin)
│   ├── routes/                # API routes
│   │   ├── auth.js           # Student authentication
│   │   ├── adminAuth.js      # Admin authentication
│   │   ├── student.js        # Student endpoints
│   │   ├── upload.js         # Question upload (bulk & single)
│   │   └── tests.js          # Test management
│   ├── server.js             # Express server entry point
│   └── setup-database.js     # Database initialization script
│
├── mcq-exam-portal/           # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   │   ├── admin/       # Admin dashboard
│   │   │   └── ...          # Student pages
│   │   ├── config/          # Firebase config
│   │   └── hooks/           # Custom React hooks
│   └── ...
│
├── *.csv                      # Sample question files
├── README.md                  # This file
└── CHANGELOG.md              # Detailed feature updates

```