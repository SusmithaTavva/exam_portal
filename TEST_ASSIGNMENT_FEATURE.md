# Test Assignment Feature - Implementation Guide

## Overview
This document describes the institute-based test assignment feature added to the MCQ Exam Portal admin dashboard.

## Features Implemented

### 1. Institute-Based Student Grouping
- Admin can view all institutes from which students have registered
- Students are automatically grouped by their institute
- Each institute shows the student count

### 2. Student Selection Interface
- **Grouped Selection**: Select all students from an institute with a single checkbox
- **Individual Selection**: Select specific students within an institute
- Expandable/collapsible institute sections
- Visual indicators for partial selection (indeterminate checkbox state)
- Student details shown: Name, Roll Number, Email

### 3. Test Assignment
- Assign tests to selected students (individual or grouped)
- Multiple students can be assigned to a test at once
- Test assignments are tracked in the database
- Students can only see tests assigned to them

### 4. Student Access Control
- Students only see tests that have been assigned to them
- Access control prevents students from accessing unassigned tests
- Assignment history tracked with timestamps

## Database Schema

### New Table: `test_assignments`
```sql
CREATE TABLE test_assignments (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(test_id, student_id)
);
```

**Indexes:**
- `idx_test_assignments_student` on `student_id`
- `idx_test_assignments_test` on `test_id`

## API Endpoints

### Admin Endpoints

#### 1. Get All Institutes with Student Counts
```
GET /api/tests/institutes
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "institutes": [
    {
      "institute": "MIT",
      "student_count": "5",
      "student_names": "John Doe, Jane Smith, ..."
    }
  ]
}
```

#### 2. Get Students by Institute
```
GET /api/tests/institutes/:instituteName/students
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "institute": "MIT",
  "students": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@mit.edu",
      "roll_number": "2024CS001",
      "institute": "MIT",
      "created_at": "2026-02-10T..."
    }
  ]
}
```

#### 3. Assign Test to Students
```
POST /api/tests/assign
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "test_id": 1,
  "student_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test assigned to 3 student(s)",
  "assigned_count": 3
}
```

#### 4. Get Test Assignments
```
GET /api/tests/:testId/assignments
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "test_id": "1",
  "assignments": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@mit.edu",
      "roll_number": "2024CS001",
      "institute": "MIT",
      "assigned_at": "2026-02-10T...",
      "is_active": true
    }
  ]
}
```

### Student Endpoints (Modified)

#### 1. Get Assigned Tests
```
GET /api/student/tests
Authorization: Bearer <student_token>
```

**Behavior Changed:**
- Previously: Returned all tests
- Now: Returns only tests assigned to the logged-in student

#### 2. Get Test Details
```
GET /api/student/test/:testId
Authorization: Bearer <student_token>
```

**Behavior Changed:**
- Previously: Returned any test
- Now: Returns test only if assigned to the logged-in student
- Returns 403 Forbidden if test not assigned

## User Interface

### Admin Dashboard - Assign Tests Tab

**Location:** Admin Dashboard → Assign Tests tab

**Components:**
1. **Test Selection Dropdown**
   - Lists all available tests
   - Shows question count for each test

2. **Institute List**
   - Shows all institutes with student counts
   - Expandable/collapsible sections
   - "Select All" checkbox for each institute

3. **Student List (per institute)**
   - Individual checkboxes for each student
   - Displays: Name, Roll Number, Email
   - Hover effect for better UX

4. **Selected Students Counter**
   - Shows count of selected students
   - Updates in real-time

5. **Assign Button**
   - Disabled when no test or no students selected
   - Shows loading state during assignment
   - Success/error feedback

### Student Dashboard

**Changes:**
- Only shows assigned tests in the test list
- Empty state message if no tests assigned
- Cannot access unassigned test URLs directly

## Migration Guide

### For Existing Installations

Run the migration script:
```bash
cd backend
node create-test-assignments-table.js
```

This creates:
- `test_assignments` table
- Required indexes

### For New Installations

The `setup-database.js` script now includes the `test_assignments` table automatically.

## Usage Workflow

### Admin Workflow

1. **Navigate to Assign Tests Tab**
   - Click "Assign Tests" in admin dashboard

2. **Select a Test**
   - Choose from the dropdown
   - Only tests with questions can be assigned

3. **Select Students**
   - Option A: Click institute name to expand
   - Click "Select All" to select all students from that institute
   - Option B: Select individual students by checking their checkboxes

4. **Assign Test**
   - Click "Assign Test to X Student(s)" button
   - Confirm the assignment
   - Receive success confirmation

5. **View Assignments**
   - Students will now see the assigned test
   - Multiple tests can be assigned to same students

### Student Workflow

1. **Login to Student Dashboard**
   - See only tests assigned to them

2. **Take Test**
   - Click on assigned test
   - Cannot access unassigned test URLs

## Features & Benefits

### For Admins
✅ Organize students by institute
✅ Bulk assign tests to multiple students
✅ Fine-grained control over test access
✅ Track which tests are assigned to which students
✅ Easy to assign tests to entire institutes

### For Students
✅ See only relevant tests
✅ Cleaner dashboard
✅ No confusion about which tests to take
✅ Better organization

### For System
✅ Access control enforced at API level
✅ Efficient database queries with indexes
✅ Scalable architecture
✅ Prevents unauthorized test access

## Technical Details

### Frontend Components Modified
- `AdminDashboard.jsx` - Added "Assign Tests" tab with full UI

### Backend Routes Modified
- `routes/tests.js` - Added 4 new endpoints
- `routes/student.js` - Modified 2 existing endpoints for access control

### Database Changes
- Added `test_assignments` table
- Added 2 indexes for performance
- Updated `setup-database.js` for new installations

### State Management
- React hooks for institute/student selection
- Checkbox state management
- Loading states for async operations

## Error Handling

### API Errors
- 400: Missing required fields
- 403: Test not assigned to student
- 404: Test/Student not found
- 500: Server error

### UI Feedback
- Loading spinners during data fetch
- Success/error alerts
- Disabled states for invalid actions
- Visual feedback for selections

## Performance Considerations

- Lazy loading of students (fetched only when institute expanded)
- Database indexes on foreign keys
- Efficient bulk insert for assignments
- Minimal re-renders with proper state management

## Future Enhancements

Possible improvements:
- [ ] Schedule test assignments (start/end dates)
- [ ] Bulk unassign functionality
- [ ] Assignment history and audit log
- [ ] Email notifications for assignments
- [ ] Test assignment analytics
- [ ] Export assignment reports
- [ ] Student groups beyond institutes

## Testing Checklist

- [ ] Admin can view institutes
- [ ] Institute expansion loads students
- [ ] Select all checkbox works
- [ ] Individual selection works
- [ ] Test assignment succeeds
- [ ] Students see assigned tests only
- [ ] Students cannot access unassigned tests
- [ ] Assignment persists across sessions
- [ ] Multiple assignments work correctly
- [ ] UI shows proper loading states

## Support

For issues or questions:
1. Check the API response in browser DevTools
2. Check backend logs for errors
3. Verify database has `test_assignments` table
4. Ensure admin is authenticated

---

**Version:** 1.0  
**Date:** February 10, 2026  
**Last Updated:** February 10, 2026
