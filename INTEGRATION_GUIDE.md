# MCQ Exam Portal - Institute Management Integration Guide

## Overview
This guide documents all database changes and file modifications for the complete institute management system that allows admins to:
- Manage institutes (CRUD operations)
- Assign exams to institutes without waiting for student registration
- Manage students manually per institute
- View and manage assigned tests per institute

---

## 🗄️ Database Changes

### 1. New Tables Created

#### `institutes` Table
```sql
CREATE TABLE institutes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `institute_test_assignments` Table
```sql
CREATE TABLE institute_test_assignments (
    id SERIAL PRIMARY KEY,
    institute_id INTEGER REFERENCES institutes(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, test_id)
);
```

### 2. Existing Tables Altered

#### `students` Table Constraints Modified
```sql
-- Made firebase_uid nullable (for admin-created students)
ALTER TABLE students ALTER COLUMN firebase_uid DROP NOT NULL;

-- Made roll_number nullable (optional field)
ALTER TABLE students ALTER COLUMN roll_number DROP NOT NULL;
```

---

## 📁 Backend Files Added/Modified

### 1. NEW: `backend/routes/institutes.js` (358 lines)
**Purpose**: Complete institute management with test assignment capabilities

**Key Endpoints**:
- `GET /api/institutes` - List all institutes with assigned test counts
- `POST /api/institutes` - Create new institute
- `PUT /api/institutes/:id` - Update institute
- `DELETE /api/institutes/:id` - Delete institute
- `POST /api/institutes/:id/assign-test` - Assign test to institute
- `GET /api/institutes/:id/assigned-tests` - Get assigned tests for institute
- `DELETE /api/institutes/:id/unassign-test/:testId` - Remove test assignment

**Features**:
- Case-insensitive institute name handling
- Duplicate prevention
- Cascade deletion of assignments
- Complex joins for counting assigned tests

### 2. ENHANCED: `backend/routes/student.js` (280+ lines)
**Purpose**: Student lifecycle management including admin-created students

**New Endpoints Added**:
- `POST /api/student/create` - Admin creates student manually
- `DELETE /api/student/:id` - Delete individual student
- `DELETE /api/student/institute/:instituteName/all` - Delete all students from institute

**Features**:
- Manual student creation without Firebase authentication
- Bulk deletion capabilities
- Institute-specific student management

### 3. ENHANCED: `backend/routes/tests.js`
**New Endpoint Added**:
- `GET /api/tests/institutes` - Get institutes list for test assignment
- `GET /api/tests/institutes/:instituteName/students` - Get students by institute

**Integration Points**:
- Links test assignment system with institute management
- Provides institute data for frontend dropdowns

---

## 🎨 Frontend Files Modified

### 1. MAJOR UPDATE: `mcq-exam-portal/src/pages/admin/AdminDashboard.jsx` (1400+ lines)

**New Features Added**:

#### A. Institute Management Tab
- Full CRUD operations for institutes
- Delete confirmation dialogs
- Institute list with assigned test counts
- Real-time updates

#### B. Enhanced Assign Tests Tab
- Institute-based test assignment
- Direct navigation (no popups)
- Works without registered students
- Institute filtering and search

#### C. Student Management Per Institute
- **Add Student Form**: Create students manually
- **Individual Delete**: Remove specific students
- **Bulk Delete**: Remove all students from institute
- **Student List**: View all students per institute

**Key UI Components**:
- Tabbed interface for different admin functions
- Modal dialogs for confirmations and forms
- Expandable institute sections
- Action buttons for each institute
- Real-time count updates

**State Management**:
- `institutes` - Institute list with counts
- `selectedInstitute` - Current institute selection
- `showStudentModal` - Student management modal state
- `students` - Students list per institute
- Form states for create/edit operations

---

## 🔧 Integration Steps

### 1. Database Setup
```sql
-- Run these SQL commands in your PostgreSQL database:

-- Create institutes table
CREATE TABLE institutes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create institute_test_assignments table
CREATE TABLE institute_test_assignments (
    id SERIAL PRIMARY KEY,
    institute_id INTEGER REFERENCES institutes(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, test_id)
);

-- Alter students table
ALTER TABLE students ALTER COLUMN firebase_uid DROP NOT NULL;
ALTER TABLE students ALTER COLUMN roll_number DROP NOT NULL;
```

### 2. Backend Integration
1. **Copy** `backend/routes/institutes.js` to your routes folder
2. **Merge** changes from `backend/routes/student.js` (specifically the new endpoints)
3. **Merge** changes from `backend/routes/tests.js` (new institutes endpoints)
4. **Update** your main server file to include institute routes:
   ```javascript
   app.use('/api/institutes', require('./routes/institutes'));
   ```

### 3. Frontend Integration
1. **Replace** your `AdminDashboard.jsx` with the updated version
2. **Ensure** you have these dependencies in package.json:
   - `lucide-react` (for icons)
   - `react-router-dom` (for navigation)

### 4. Environment Configuration
No additional environment variables needed. Uses existing database connection.

---

## 🧪 Testing Checklist

### Institute Management
- [ ] Create new institute
- [ ] Update institute name
- [ ] Delete institute (with confirmation)
- [ ] View institute list with assigned test counts

### Test Assignment
- [ ] Assign test to institute with no students
- [ ] Assign multiple tests to same institute
- [ ] View assigned tests for institute
- [ ] Delete assigned test from institute

### Student Management
- [ ] Create student manually (admin-created)
- [ ] Delete individual student
- [ ] Delete all students from institute
- [ ] View student list per institute

### Data Integrity
- [ ] Institute deletion cascades to assignments
- [ ] Student deletion updates counts
- [ ] Duplicate institute names prevented
- [ ] Case-insensitive institute handling

---

## 📊 API Reference

### Institute Endpoints
```
GET    /api/institutes                                 # List all institutes
POST   /api/institutes                                 # Create institute
PUT    /api/institutes/:id                             # Update institute  
DELETE /api/institutes/:id                             # Delete institute
POST   /api/institutes/:id/assign-test                 # Assign test
GET    /api/institutes/:id/assigned-tests              # Get assigned tests
DELETE /api/institutes/:id/unassign-test/:testId       # Remove assignment
```

### Student Management Endpoints
```
POST   /api/student/create                             # Create student (admin)
DELETE /api/student/:id                                # Delete student
DELETE /api/student/institute/:instituteName/all       # Delete all students
```

### Enhanced Test Endpoints
```
GET    /api/tests/institutes                           # Get institutes list
GET    /api/tests/institutes/:instituteName/students   # Get students by institute
```

---

## 🔄 Database Relationships

```
institutes (1) ←→ (M) institute_test_assignments (M) ←→ (1) tests
    ↓
students (M) → (1) institutes (via institute name)
```

**Key Points**:
- Institute deletion cascades to assignments
- Students link to institutes via name (case-insensitive)
- Tests can be assigned to multiple institutes
- Institutes can have multiple test assignments

---

## 📝 Notes for Team

1. **Database Constraints**: `firebase_uid` and `roll_number` are now nullable in students table
2. **Admin Creation**: Students can be created without Firebase authentication
3. **Case Handling**: All institute operations are case-insensitive
4. **Cascade Deletion**: Deleting institutes removes all related assignments
5. **No Student Dependency**: Tests can be assigned to institutes without registered students

**Migration Safe**: All changes are backward compatible with existing functionality.