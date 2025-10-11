# Quick Reference - API Endpoints

## 🚀 Base URL
`http://localhost:5000`

---

## 📋 All Endpoints

### **Auth**
```http
POST /api/user/auth/signup
POST /api/user/auth/login
```

### **Levels (Admin)**
```http
GET    /api/admin/levels
POST   /api/admin/levels
DELETE /api/admin/levels/:level
```

### **Users (Admin)**
```http
GET  /api/admin/users
GET  /api/admin/users/:userId
POST /api/admin/users/:userId/add-xp
```

---

## 🎯 Quick Test Flow

### 1️⃣ Create Levels
```json
POST /api/admin/levels
{ "level": 1, "xpRequired": 100 }
{ "level": 2, "xpRequired": 200 }
{ "level": 3, "xpRequired": 300 }
```

### 2️⃣ Create User
```json
POST /api/user/auth/signup
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123"
}
```
**→ Copy userId from response**

### 3️⃣ Add XP (Auto Level-Up!)
```json
POST /api/admin/users/{userId}/add-xp
{ "xpAmount": 150 }
```

### 4️⃣ Check Result
```http
GET /api/admin/users/{userId}
```

---

## 📊 Expected Results

### Initial User State
```json
{
  "level": 1,
  "xp": 0,
  "xpForNextLevel": 100
}
```

### After Adding 150 XP
```json
{
  "level": 2,          // ✅ Auto leveled up!
  "xp": 50,            // ✅ 150 - 100 = 50 remaining
  "xpForNextLevel": 200 // ✅ Updated for level 3
}
```

---

## ⚡ Key Features

✅ **Auto Level-Up** - Users level up automatically when XP ≥ requirement  
✅ **Multiple Levels** - Can jump multiple levels in one XP addition  
✅ **Auto Sync** - Config updates automatically sync to users  
✅ **XP Carryover** - Remaining XP carries to next level  

---

## 🔍 Common Operations

### List All Users
```http
GET /api/admin/users
```

### List All Levels
```http
GET /api/admin/levels
```

### Update Level Config
```json
POST /api/admin/levels
{
  "level": 2,
  "xpRequired": 250,
  "syncExisting": true  // Auto-syncs users!
}
```

---

## 💻 Database Check

```javascript
// MongoDB Shell
db.users.find({}, { username: 1, level: 1, xp: 1, xpForNextLevel: 1 })
db.levelconfigs.find().sort({ level: 1 })
```

---

## 📖 Full Documentation

- **IMPLEMENTATION_SUMMARY.md** - Complete overview
- **XP_AUTO_LEVELUP_TESTING.md** - Detailed testing guide
- **POSTMAN_TESTING_GUIDE.md** - API testing examples
- **LEVEL_SYSTEM_CHANGES.md** - Technical changes explained

---

## ✨ Test in 3 Steps

1. **Setup**: Create levels 1-3
2. **User**: Signup & get userId
3. **Test**: Add 350 XP → Watch auto level-up to Level 3!

🎮 Happy Testing!
