# Quick Start Guide - Institute Management

## 🚀 Quick Setup (5 minutes)

### 1. Run Migration
```bash
cd backend
node run-institutes-migration.js
```

### 2. Restart Servers
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd mcq-exam-portal
npm run dev
```

### 3. Test It Out
1. Login to admin dashboard
2. Click "Manage Institutes" tab
3. Add a test institute: "Test University"
4. Go to student registration and register with "test university"
5. Login as student - verify everything works!

---

## 📁 Files Changed

### New Files (Created)
```
backend/
  ├── routes/institutes.js
  ├── migrations/create-institutes-table.sql
  └── run-institutes-migration.js

mcq-v0/
  └── INSTITUTE_MANAGEMENT_FEATURE.md (this doc)
```

### Modified Files
```
backend/
  ├── server.js (lines ~11, ~39)
  └── routes/auth.js (lines ~1-140)

mcq-exam-portal/src/pages/admin/
  └── AdminDashboard.jsx (lines ~1-10, ~28-33, ~45-50, ~158-280, ~450-460, ~650-800)
```

---

## 🎯 Key Features Summary

✅ Admin can create institutes proactively  
✅ Students auto-link to existing institutes  
✅ Pre-assigned exams are visible to new students  
✅ Case-insensitive institute name matching  
✅ Protected deletion (can't delete with students)  

---

## 🔧 What Each File Does

### `backend/routes/institutes.js`
- API for creating, listing, and deleting institutes
- Handles student count and test assignment counts

### `backend/migrations/create-institutes-table.sql`
- Creates institutes table in database
- Migrates existing institutes from students table

### `backend/run-institutes-migration.js`
- Script to execute the migration
- Shows created institutes

### `backend/server.js` (modified)
- Added institutes routes

### `backend/routes/auth.js` (modified)
- Auto-creates institutes during student registration
- Auto-assigns pre-assigned tests to new students

### `AdminDashboard.jsx` (modified)
- New "Manage Institutes" tab
- UI for adding institutes
- Table showing all institutes
- Delete functionality

---

## 💡 Usage Examples

### Admin Workflow
1. Create institute → "MIT"
2. Upload test → "Java Basics"
3. Assign test to students in MIT
4. Student registers with "MIT"
5. Student sees "Java Basics" automatically

### Student Workflow
1. Register with institute "Stanford"
2. Login to dashboard
3. See any tests assigned to Stanford

---

## 🎓 Best Practices

1. ✅ Create commonly used institutes first
2. ✅ Use full official names (e.g., "Massachusetts Institute of Technology")
3. ✅ Don't worry about case - system handles it
4. ✅ Assign tests to institutes before semester starts
5. ✅ Students see tests immediately upon login

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Admin can access "Manage Institutes" tab
- [ ] Admin can add a new institute
- [ ] Admin can see student counts
- [ ] Admin can delete institute (with no students)
- [ ] Admin cannot delete institute with students
- [ ] Student registration works with existing institute
- [ ] Student registration works with new institute
- [ ] Student sees pre-assigned tests after login
- [ ] Case-insensitive matching works

---

## 🆘 Quick Troubleshooting

**Problem**: Migration fails  
**Solution**: Check database connection, ensure PostgreSQL is running

**Problem**: Can't delete institute  
**Solution**: Institute has students - this is by design

**Problem**: Student not seeing tests  
**Solution**: Verify test is assigned to institute, not just individual students

**Problem**: "Institute already exists"  
**Solution**: Normal - name already exists (case-insensitive)

---




