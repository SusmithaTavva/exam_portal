# Quick Reference - Files Changed

**For your teammate implementing on deployed website**  
**Date**: February 9, 2026

---

## 📁 All Modified Files At A Glance

| # | File Path | Change Type | Priority | Description |
|---|-----------|-------------|----------|-------------|
| 1 | `backend/config/firebase.js` | REPLACE | HIGH ⚠️ | Switch to Firebase Admin SDK |
| 2 | `backend/routes/student.js` | FIX | MEDIUM | Fix middleware import path (1 line) |
| 3 | `backend/routes/upload.js` | ADD | MEDIUM | Add single question endpoint |
| 4 | `backend/routes/tests.js` | NEW FILE | HIGH ⚠️ | Create tests API (GET/DELETE) |
| 5 | `backend/server.js` | ADD | HIGH ⚠️ | Register tests routes (2 lines) |
| 6 | `backend/.env` | ADD | HIGH ⚠️ | Add JWT_SECRET variable |
| 7 | `backend/setup-database.js` | NO CHANGE | INFO | Already complete (verify only) |
| 8 | `mcq-exam-portal/src/config/firebase.js` | UPDATE | HIGH ⚠️ | Add Firebase credentials |
| 9 | `mcq-exam-portal/src/pages/admin/AdminDashboard.jsx` | MAJOR | HIGH ⚠️ | Connect to real API + fix bugs |

**Total**: 9 files (7 backend, 2 frontend)

---

## 🎯 What Each File Does

### Backend Files

#### 1. `backend/config/firebase.js` 
**Replace entire file**  
- Uses Firebase Admin SDK for server-side auth
- Reads serviceAccountKey.json
- Required for student token verification

#### 2. `backend/routes/student.js`
**Change 1 line**  
- Line 4: Fix import from `../middleware/auth` → `../middleware/verifyToken`
- Prevents server crash from missing module

#### 3. `backend/routes/upload.js`
**Add new endpoint before module.exports**  
- New route: `POST /api/admin/upload/question`
- Add single questions without CSV
- Can create test or add to existing

#### 4. `backend/routes/tests.js`
**Create new file**  
- Route: `GET /api/tests` - List all tests
- Route: `DELETE /api/tests/:id` - Delete test
- Required for admin dashboard functionality

#### 5. `backend/server.js`
**Add 2 lines**  
- Line 11: Import tests routes
- Line 36: Register `/api/tests` endpoint
- Connects tests.js to server

#### 6. `backend/.env`
**Add 1 line**  
- Add: `JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2026`
- CRITICAL for admin authentication
- Generate stronger secret for production!

#### 7. `backend/setup-database.js`
**No changes needed**  
- Already has all 6 tables
- Run `npm run setup-db` to verify

### Frontend Files

#### 8. `mcq-exam-portal/src/config/firebase.js`
**Update credentials object**  
- Replace placeholder values with real Firebase config
- Get from Firebase Console → Project Settings
- Required for student login/register

#### 9. `mcq-exam-portal/src/pages/admin/AdminDashboard.jsx`
**Major refactor - multiple changes**  
- Add fetchTests() function to call API
- Add handleDeleteTest() function
- Update useEffect to load real data
- Fix tests state (remove mock data)
- Update UI to show loading/empty states
- Fix JSX syntax errors

---

## 🔥 Critical Files (Must Update First)

**Priority Order for Deployment:**

1️⃣ **backend/.env** - Add JWT_SECRET (server won't work without it)  
2️⃣ **backend/config/firebase.js** - Replace with Admin SDK  
3️⃣ **backend/routes/tests.js** - Create new file  
4️⃣ **backend/server.js** - Register routes  
5️⃣ **mcq-exam-portal/src/config/firebase.js** - Add credentials  
6️⃣ **mcq-exam-portal/src/pages/admin/AdminDashboard.jsx** - Update UI  
7️⃣ **backend/routes/student.js** - Fix import  
8️⃣ **backend/routes/upload.js** - Add endpoint  

---

## 📝 Quick Commands

```bash
# Backup database
pg_dump exam_portal > backup_$(date +%Y%m%d).sql

# Run database setup
cd backend && npm run setup-db

# Restart backend
pm2 restart backend
# OR
npm start

# Build frontend
cd mcq-exam-portal && npm run build

# Test backend
curl http://localhost:5000/health
```

---

## ✅ Testing After Deployment

Test these in order:
1. ✅ Backend starts without errors
2. ✅ Admin can login (admin@example.com / admin123)
3. ✅ Admin dashboard shows real tests
4. ✅ Can delete a test from dashboard
5. ✅ Students can register
6. ✅ API endpoint: `GET /api/tests` returns data
7. ✅ API endpoint: `POST /api/admin/upload/question` works
8. ✅ No console errors in browser

---

## 🆘 If Something Breaks

**Check these first:**
1. Backend console logs for errors
2. Browser console (F12) for frontend errors
3. Database connection (check .env variables)
4. JWT_SECRET is set in .env
5. Firebase credentials are correct

**Common fixes:**
- `Cannot find module` → Check file paths and imports
- `Invalid API key` → Update Firebase credentials
- `401 Unauthorized` → Check JWT_SECRET in .env
- Mock data showing → Update AdminDashboard.jsx

**Rollback:**
```bash
# Restore database
psql exam_portal < backup_YYYYMMDD.sql

# Restore code from backup
mv backend_backup backend
```

---

## 📚 Full Documentation

- **Implementation Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) ⭐ START HERE
- **Feature Details**: [CHANGELOG.md](./CHANGELOG.md)
- **File Summary**: [MODIFIED_FILES.md](./MODIFIED_FILES.md)
- **Setup Instructions**: [README.md](./README.md)

---

**Need Help?**  
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions with complete code snippets.
