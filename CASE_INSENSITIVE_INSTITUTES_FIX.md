# Case-Insensitive Institute Names - Fix

## Problem
Institute names were being treated as case-sensitive, resulting in duplicate entries:
- "Parul" (2 students)
- "PARUL" (1 student)

Both should be grouped together as one institute.

## Solution Implemented

### 1. Backend Changes

#### Registration Endpoint ([backend/routes/auth.js](../backend/routes/auth.js))
- **Change**: Convert institute name to lowercase before storing
- **Code**: `const normalizedInstitute = institute.trim().toLowerCase();`
- **Effect**: All new registrations store institute names in lowercase

#### Institute Grouping API ([backend/routes/tests.js](../backend/routes/tests.js))
- **Change**: Group by `LOWER(institute)` in SQL query
- **Effect**: Institutes are grouped case-insensitively
- **Example**: "MIT", "mit", "Mit" all grouped together

#### Students by Institute API ([backend/routes/tests.js](../backend/routes/tests.js))
- **Change**: Use case-insensitive comparison `WHERE LOWER(institute) = LOWER($1)`
- **Effect**: Fetching students works regardless of case used in request

### 2. Frontend Changes

#### Registration Component ([mcq-exam-portal/src/components/Register.jsx](../mcq-exam-portal/src/components/Register.jsx))
- **Change**: Convert to lowercase before sending to API
- **Code**: `institute: formData.institute.trim().toLowerCase()`
- **Added**: Helper text explaining the field

#### Admin Dashboard ([mcq-exam-portal/src/pages/admin/AdminDashboard.jsx](../mcq-exam-portal/src/pages/admin/AdminDashboard.jsx))
- **Added**: `capitalizeInstitute()` helper function
- **Change**: Display institutes with proper capitalization
- **Example**: Database has "parul" → Display shows "Parul"

#### Student Dashboard ([mcq-exam-portal/src/pages/Dashboard.jsx](../mcq-exam-portal/src/pages/Dashboard.jsx))
- **Added**: Same `capitalizeInstitute()` helper function
- **Change**: Display institute with proper formatting
- **Example**: "mit" → "Mit"

### 3. Data Normalization Script

#### Created: `backend/normalize-institutes.js`
- **Purpose**: Fix existing data with mixed case
- **Action**: Converts all existing institute names to lowercase
- **Usage**: `node normalize-institutes.js`

**Results from running the script:**
```
✅ Updated 5 student record(s):
   - Susmitha Tavva: not specified
   - AAA: parul
   - BBB: parul
   - CCC: shnoor
   - DDD: parul

📊 Current Institute Distribution:
   - Not specified: 1 student(s)
   - Parul: 3 student(s)  ← Fixed! Was split as "Parul" and "PARUL"
   - Shnoor: 1 student(s)
```

## How It Works Now

### User Registration Flow
1. User types institute name: **"PARUL INSTITUTE"**
2. Frontend converts to lowercase: **"parul institute"**
3. Backend stores in database: **"parul institute"**
4. Display shows properly formatted: **"Parul Institute"**

### Admin View
1. Database has multiple case variations → All grouped together
2. API returns lowercase: **"parul"**
3. UI displays capitalized: **"Parul"**
4. Students from "Parul", "PARUL", "parul" all show under one institute

### Database Storage
**Before Fix:**
```
Parul     | 2 students
PARUL     | 1 student
```

**After Fix:**
```
parul     | 3 students  ← All merged
```

## Files Modified

1. `backend/routes/auth.js` - Normalize on registration
2. `backend/routes/tests.js` - Case-insensitive queries
3. `mcq-exam-portal/src/components/Register.jsx` - Lowercase conversion
4. `mcq-exam-portal/src/pages/admin/AdminDashboard.jsx` - Display formatting
5. `mcq-exam-portal/src/pages/Dashboard.jsx` - Display formatting
6. `backend/normalize-institutes.js` - **NEW** Data migration script

## Benefits

✅ **No Duplicates**: "MIT", "mit", "Mit" are all the same institute
✅ **Consistent Grouping**: Students properly grouped by institute
✅ **Better UX**: Users don't need to worry about capitalization
✅ **Clean Display**: Institute names still look nice with proper capitalization
✅ **Backward Compatible**: Existing data normalized automatically

## Testing

### Test Case 1: New Registration
- Register with "HARVARD UNIVERSITY" ✅
- Register with "harvard university" ✅
- Register with "Harvard University" ✅
- **Result**: All 3 students grouped under "Harvard University"

### Test Case 2: Admin View
- View institutes list ✅
- **Result**: Shows "Harvard University" (1 group, 3 students)
- Click to expand ✅
- **Result**: Shows all 3 students

### Test Case 3: Existing Data
- Run normalization script ✅
- **Result**: "Parul" and "PARUL" merged into "parul"
- Admin dashboard ✅
- **Result**: Shows as "Parul" with correct student count

## Migration for Existing Installations

```bash
cd backend
node normalize-institutes.js
```

This is a **one-time operation** that:
- Converts all existing institute names to lowercase
- Shows before/after statistics
- Safe to run multiple times (idempotent)

## Future Enhancements

Possible improvements:
- [ ] Institute autocomplete with existing institutes
- [ ] Suggest matching institutes while typing
- [ ] Admin ability to merge institutes manually
- [ ] Institute aliases (e.g., "MIT" = "Massachusetts Institute of Technology")

---

**Issue**: Fixed ✅  
**Date**: February 10, 2026  
**Impact**: All institute names now case-insensitive  
**Migration**: Required (run normalize-institutes.js)
