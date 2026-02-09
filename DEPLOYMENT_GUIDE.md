# Implementation Guide for Deployment Team

**Project**: MCQ Exam Portal  
**Date**: February 9, 2026  
**Branch**: master  
**Purpose**: Guide for implementing recent updates on production/deployed website

---

## 🎯 Overview of Changes

This document provides step-by-step instructions for implementing new features that have been added to the MCQ Exam Portal. All changes are production-ready and tested locally.

### New Features Added:
1. **Tests Management API** - View and delete tests via API
2. **Single Question Upload** - Add individual questions through API
3. **Real-time Admin Dashboard** - Live test display with database integration
4. **Firebase Authentication** - Complete student authentication setup
5. **Enhanced Database** - Proper schema with cascade relationships

---

## 📋 Prerequisites for Deployment

Before implementing these changes, ensure you have:
- [ ] Access to production server
- [ ] Database backup created
- [ ] Node.js backend server access
- [ ] React frontend deployment access
- [ ] Firebase console access (for credentials)
- [ ] PostgreSQL database access

---

## 🗂️ Files Modified - Detailed Breakdown

### BACKEND FILES (7 files total)

---

#### 1. `backend/config/firebase.js`
**Location**: `/backend/config/firebase.js`  
**Type**: COMPLETE REPLACEMENT  
**Priority**: HIGH - Must update before starting server

**What Changed**:
- Replaced client-side Firebase SDK with Firebase Admin SDK
- Now uses server-side authentication via service account

**Action Required**:
1. Replace entire file content with:
```javascript
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Path to your service account key JSON file
const serviceAccountPath = path.join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        projectId: process.env.FIREBASE_PROJECT_ID || 'shnoor-exam'
    });
}

// Export admin instance for use in other modules
module.exports = admin;
```

2. Ensure `serviceAccountKey.json` exists in `/backend/` directory
3. Update `.env` if needed: `FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json`

**Why This Matters**: Backend needs server-side Firebase Admin SDK, not client SDK. This enables token verification for student authentication.

---

#### 2. `backend/routes/student.js`
**Location**: `/backend/routes/student.js`  
**Type**: ONE LINE CHANGE  
**Priority**: MEDIUM

**What Changed**:
Line 4: Fixed middleware import path

**Action Required**:
Find line 4 (after the requires section at top):
```javascript
// BEFORE (INCORRECT):
const verifyToken = require('../middleware/auth');

// AFTER (CORRECT):
const verifyToken = require('../middleware/verifyToken');
```

**Why This Matters**: Incorrect import path causes server crash. Must match actual middleware file name.

---

#### 3. `backend/routes/upload.js`
**Location**: `/backend/routes/upload.js`  
**Type**: NEW ENDPOINT ADDED  
**Priority**: MEDIUM

**What Changed**:
Added single question upload endpoint at the END of file (before `module.exports`)

**Action Required**:
1. Open the file and scroll to the bottom
2. Find the line `module.exports = router;`
3. ADD THIS ENTIRE BLOCK **BEFORE** that line:

```javascript
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
```

4. Keep `module.exports = router;` at the very end

**Why This Matters**: Enables API endpoint for adding single questions without CSV upload.

---

#### 4. `backend/routes/tests.js`
**Location**: `/backend/routes/tests.js`  
**Type**: NEW FILE  
**Priority**: HIGH

**What Changed**:
Completely new file with tests management endpoints

**Action Required**:
1. Create NEW file at path: `/backend/routes/tests.js`
2. Copy this ENTIRE content:

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const verifyAdmin = require('../middleware/verifyAdmin');

/**
 * GET /api/tests
 * Get all tests with question counts
 */
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id,
                t.title,
                t.description,
                t.created_at,
                COUNT(q.id)::text as question_count
            FROM tests t
            LEFT JOIN questions q ON t.id = q.test_id
            GROUP BY t.id, t.title, t.description, t.created_at
            ORDER BY t.created_at DESC
        `);

        res.json(result.rows);
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
 * Delete a test by ID (CASCADE deletes questions automatically)
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM tests WHERE id = $1 RETURNING id',
            [id]
        );

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
```

**Why This Matters**: Provides API to view and delete tests from admin dashboard.

---

#### 5. `backend/server.js`
**Location**: `/backend/server.js`  
**Type**: TWO LINES ADDED  
**Priority**: HIGH

**What Changed**:
Added import and route registration for tests API

**Action Required**:

**Step 1**: Find the routes import section (around line 8-15):
```javascript
// EXISTING imports
const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const studentRoutes = require('./routes/student');
const uploadRoutes = require('./routes/upload');

// ADD THIS LINE (around line 11):
const testsRoutes = require('./routes/tests');
```

**Step 2**: Find the routes registration section (around line 30-38):
```javascript
// EXISTING route registrations
app.use('/api', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin/upload', uploadRoutes);

// ADD THIS LINE (around line 36):
app.use('/api/tests', testsRoutes);
```

**Why This Matters**: Registers the new tests API routes so they're accessible.

---

#### 6. `backend/.env`
**Location**: `/backend/.env`  
**Type**: ONE LINE ADDED  
**Priority**: HIGH - SECURITY CRITICAL

**What Changed**:
Added JWT secret for admin token signing

**Action Required**:
1. Open `/backend/.env` file
2. Add this line anywhere (preferably after DB credentials):

```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2026
```

3. **IMPORTANT FOR PRODUCTION**: Generate a stronger secret:
```bash
# On production server, generate a random secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

4. Replace the value with the generated secret

**Why This Matters**: Required for admin JWT token generation. Weak secret = security vulnerability.

---

#### 7. `backend/setup-database.js`
**Location**: `/backend/setup-database.js`  
**Type**: NO CHANGES NEEDED  
**Priority**: INFO ONLY

**What Changed**:
Already contains all necessary database schemas

**Action Required**:
- **NO CHANGES NEEDED**
- File already has all 6 tables (students, admins, tests, questions, student_responses, test_attempts)
- Just verify tables exist by running: `npm run setup-db`

**Why This Matters**: Confirms database schema is already complete.

---

### FRONTEND FILES (2 files total)

---

#### 8. `mcq-exam-portal/src/config/firebase.js`
**Location**: `/mcq-exam-portal/src/config/firebase.js`  
**Type**: UPDATE CREDENTIALS  
**Priority**: HIGH - AUTHENTICATION CRITICAL

**What Changed**:
Updated placeholders with actual Firebase project credentials

**Action Required**:
1. Open the file
2. Find the `firebaseConfig` object
3. Replace with YOUR Firebase project credentials:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBiIyPB-41cjLPBB0UGIq2uPG9_Eld5K38",
    authDomain: "shnoor-exam.firebaseapp.com",
    projectId: "shnoor-exam",
    storageBucket: "shnoor-exam.firebasestorage.app",
    messagingSenderId: "219634149933",
    appId: "1:219634149933:web:65282df2b729edb82426a4",
    measurementId: "G-5K1Q6KS44E"
};
```

**IMPORTANT**: If deploying to different Firebase project:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Your apps → Web app
4. Copy the config object
5. Replace the values above

**Why This Matters**: Without correct credentials, student authentication will fail with "invalid API key" error.

---

#### 9. `mcq-exam-portal/src/pages/admin/AdminDashboard.jsx`
**Location**: `/mcq-exam-portal/src/pages/admin/AdminDashboard.jsx`  
**Type**: MAJOR UPDATE - MULTIPLE CHANGES  
**Priority**: HIGH

**What Changed**:
1. Changed tests state initialization
2. Added isLoadingTests state
3. Added fetchTests() function
4. Added handleDeleteTest() function
5. Modified useEffect to call fetchTests()
6. Updated UI to display real data
7. Fixed JSX syntax errors

**Action Required**:

This is a large file. **Recommended approach**: Replace the entire file OR make these specific changes:

**Option 1: Full Replacement (RECOMMENDED)**
1. Backup current AdminDashboard.jsx
2. Replace with the complete updated version from repository
3. Test admin dashboard functionality

**Option 2: Manual Changes**
If you must update manually, make these changes:

**Change 1** (Line ~13): Update tests state initialization
```javascript
// BEFORE:
const [tests, setTests] = useState([
  { id: 1, name: 'JavaScript Basics', questions: 30, attempts: 145, avgScore: 78 },
  // ... mock data
]);

// AFTER:
const [tests, setTests] = useState([]);
const [isLoadingTests, setIsLoadingTests] = useState(false);
```

**Change 2** (Line ~24): Update useEffect
```javascript
// BEFORE:
useEffect(() => {
  // Empty or mock data
}, []);

// AFTER:
useEffect(() => {
  fetchTests();
}, []);
```

**Change 3** (Line ~78): ADD fetchTests function
```javascript
const fetchTests = async () => {
  setIsLoadingTests(true);
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('http://localhost:5000/api/tests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setTests(data);
    } else {
      console.error('Failed to fetch tests');
    }
  } catch (error) {
    console.error('Error fetching tests:', error);
  } finally {
    setIsLoadingTests(false);
  }
};
```

**Change 4** (Line ~98): ADD handleDeleteTest function
```javascript
const handleDeleteTest = async (testId, testTitle) => {
  if (!window.confirm(`Are you sure you want to delete "${testTitle}"?\n\nThis will permanently delete the test and all its questions.`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`http://localhost:5000/api/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      fetchTests(); // Refresh the list
      alert('Test deleted successfully');
    } else {
      alert('Failed to delete test');
    }
  } catch (error) {
    console.error('Error deleting test:', error);
    alert('Error deleting test');
  }
};
```

**Change 5** (Lines ~313-378): UPDATE Existing Tests section UI
Replace the entire "Existing Tests" section with:
```javascript
{/* Existing Tests */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-bold text-gray-900 mb-4">Existing Tests</h2>
  
  {isLoadingTests ? (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      <span className="ml-3 text-gray-600">Loading tests...</span>
    </div>
  ) : tests.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      <FileSpreadsheet className="mx-auto mb-3 text-gray-300" size={48} />
      <p>No tests uploaded yet</p>
      <p className="text-sm mt-1">Upload a CSV file above to create your first test</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tests.map((test) => (
            <tr key={test.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{test.title}</td>
              <td className="px-4 py-3 text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {test.question_count} questions
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 text-sm">
                {new Date(test.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <button 
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    title="View Questions"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTest(test.id, test.title)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Delete Test"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

**Why This Matters**: Connects admin dashboard to real database instead of showing mock data. Critical for actual functionality.

---

## 🔄 Deployment Sequence (Step-by-Step)

### Phase 1: Backup (CRITICAL - DO FIRST)
```bash
# 1. Backup database
pg_dump exam_portal > backup_$(date +%Y%m%d).sql

# 2. Backup current code
cp -r /path/to/backend /path/to/backend_backup
cp -r /path/to/frontend /path/to/frontend_backup
```

### Phase 2: Database
```bash
# 1. Navigate to backend
cd /path/to/backend

# 2. Run database setup (if not already run)
npm run setup-db

# 3. Verify tables exist
psql -d exam_portal -c "\dt"
# Should show: students, admins, tests, questions, student_responses, test_attempts
```

### Phase 3: Backend Updates
```bash
# 1. Update files in this order:
# - backend/.env (add JWT_SECRET)
# - backend/config/firebase.js (replace entire file)
# - backend/routes/student.js (fix import)
# - backend/routes/tests.js (create new file)
# - backend/routes/upload.js (add new endpoint)
# - backend/server.js (add 2 lines)

# 2. Install dependencies (if needed)
npm install

# 3. Restart backend server
pm2 restart backend
# OR
npm start
```

### Phase 4: Frontend Updates
```bash
# 1. Update files:
# - mcq-exam-portal/src/config/firebase.js (update credentials)
# - mcq-exam-portal/src/pages/admin/AdminDashboard.jsx (major update)

# 2. Rebuild frontend
npm run build

# 3. Deploy build folder to hosting
# (Copy dist/ folder to web server)
```

### Phase 5: Testing
```bash
# 1. Test backend health
curl http://your-domain.com/health

# 2. Test admin login
# Login at: http://your-domain.com/admin/login
# Credentials: admin@example.com / admin123

# 3. Test new APIs
# GET /api/tests
# DELETE /api/tests/:id
# POST /api/admin/upload/question

# 4. Test student registration
# Register at: http://your-domain.com/register
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend server starts without errors
- [ ] Database has all 6 tables
- [ ] Admin can login successfully
- [ ] Admin dashboard displays real tests (not mock data)
- [ ] Can delete a test from dashboard
- [ ] Can upload CSV file with questions
- [ ] Students can register with Firebase
- [ ] Students can login successfully
- [ ] All console errors are resolved
- [ ] API endpoints respond correctly:
  - [ ] GET /health → 200 OK
  - [ ] GET /api/tests → Returns test list
  - [ ] POST /api/admin/upload/question → Creates question
  - [ ] DELETE /api/tests/:id → Deletes test

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find package 'firebase'"
**Cause**: Wrong Firebase SDK in backend  
**Solution**: Ensure backend/config/firebase.js uses `firebase-admin`, not `firebase`

### Issue 2: "Invalid API Key" error in frontend
**Cause**: Wrong Firebase credentials  
**Solution**: Update mcq-exam-portal/src/config/firebase.js with correct credentials from Firebase Console

### Issue 3: Admin dashboard shows mock data
**Cause**: Old AdminDashboard.jsx not updated  
**Solution**: Ensure fetchTests() function exists and is called in useEffect

### Issue 4: "Cannot read property 'release' of undefined"
**Cause**: Missing tests.js route file  
**Solution**: Create backend/routes/tests.js with complete code

### Issue 5: JWT errors on admin endpoints
**Cause**: Missing JWT_SECRET in .env  
**Solution**: Add `JWT_SECRET=...` to backend/.env file

### Issue 6: Port 5000 already in use
**Solution**:
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>
```

---

## 📞 Support Information

**Files to check if something breaks**:
1. Backend logs: `/backend/logs/` or console output
2. Frontend console: Browser DevTools → Console tab
3. Database logs: PostgreSQL logs

**Rollback procedure**:
```bash
# 1. Restore database
psql exam_portal < backup_YYYYMMDD.sql

# 2. Restore code
rm -rf /path/to/backend
mv /path/to/backend_backup /path/to/backend

# 3. Restart services
pm2 restart all
```

---

## 📊 Summary

**Total Files to Modify**: 9 files
- Backend: 7 files (6 modified, 1 new)
- Frontend: 2 files (both modified)

**Estimated Deployment Time**: 30-45 minutes  
**Estimated Testing Time**: 15-20 minutes  
**Downtime Required**: 5-10 minutes (during server restart)

**Risk Level**: Medium  
**Recommendation**: Deploy during low-traffic hours

---

**Document Version**: 1.0  
**Last Updated**: February 9, 2026  
**Prepared By**: Development Team  
**For Questions**: Refer to CHANGELOG.md for technical details
