# Postman Testing Guide - Level System

## Base URL
Assuming your server runs on: `http://localhost:5000`

---

## Test Scenario: Complete Level System Flow

### **Step 1: Create Level Configurations**

#### 1.1 Create Level 1
```
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 1,
  "xpRequired": 100,
  "syncExisting": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Level saved and users synced",
  "levelConfig": {
    "_id": "...",
    "level": 1,
    "xpRequired": 100,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "syncResult": {
    "matchedCount": 0,
    "modifiedCount": 0
  }
}
```
*Note: matchedCount is 0 because there are no users at level 0*

---

#### 1.2 Create Level 2
```
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 2,
  "xpRequired": 200,
  "syncExisting": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Level saved and users synced",
  "levelConfig": {
    "level": 2,
    "xpRequired": 200
  },
  "syncResult": {
    "matchedCount": 0,
    "modifiedCount": 0,
    "affectedLevel": 1
  }
}
```
*Note: If any users exist at level 1, they will be updated to xpForNextLevel = 200*

---

#### 1.3 Create Level 3
```
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 3,
  "xpRequired": 300,
  "syncExisting": true
}
```

---

#### 1.4 List All Levels (Verify Creation)
```
GET http://localhost:5000/api/admin/levels
```

**Expected Response:**
```json
{
  "success": true,
  "levels": [
    { "level": 1, "xpRequired": 100 },
    { "level": 2, "xpRequired": 200 },
    { "level": 3, "xpRequired": 300 }
  ]
}
```

---

### **Step 2: Create a User**

#### 2.1 Signup New User
```
POST http://localhost:5000/api/user/auth/signup
Content-Type: application/json

{
  "email": "testuser@example.com",
  "username": "testuser",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered sucessfully.",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "username": "testuser"
  },
  "token": "eyJhbGc..."
}
```

---

### **Step 3: Verify User XP Data**

You'll need to check the database directly or create a GET user endpoint. In MongoDB:

```javascript
db.users.findOne({ email: "testuser@example.com" })
```

**Expected User Document:**
```json
{
  "_id": "...",
  "email": "testuser@example.com",
  "username": "testuser",
  "level": 1,
  "xp": 0,
  "xpForNextLevel": 200  // ← Should be 200 from Level 2 config!
}
```

---

### **Step 4: Test Level Update & Auto-Sync**

#### 4.1 Update Level 2 XP Requirement
```
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 2,
  "xpRequired": 250,
  "syncExisting": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Level saved and users synced",
  "levelConfig": {
    "level": 2,
    "xpRequired": 250
  },
  "syncResult": {
    "matchedCount": 1,      // ← Should match users at level 1
    "modifiedCount": 1,     // ← testuser was updated
    "affectedLevel": 1
  },
  "reevalResult": {
    "processed": 1,
    "updatedCount": 0,
    "errors": []
  }
}
```

#### 4.2 Verify User Was Updated
Check database again:
```json
{
  "email": "testuser@example.com",
  "level": 1,
  "xp": 0,
  "xpForNextLevel": 250  // ← Should now be 250!
}
```

---

### **Step 5: Test Multiple Users Scenario**

#### 5.1 Create More Users
```
POST http://localhost:5000/api/user/auth/signup
Content-Type: application/json

{
  "email": "user2@example.com",
  "username": "user2",
  "password": "password123"
}
```

```
POST http://localhost:5000/api/user/auth/signup
Content-Type: application/json

{
  "email": "user3@example.com",
  "username": "user3",
  "password": "password123"
}
```

#### 5.2 Update Level 2 Again
```
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 2,
  "xpRequired": 350,
  "syncExisting": true
}
```

**Expected Response:**
```json
{
  "syncResult": {
    "matchedCount": 3,    // ← All 3 users at level 1
    "modifiedCount": 3,   // ← All 3 updated
    "affectedLevel": 1
  }
}
```

---

### **Step 6: Test Delete Level**

#### 6.1 Delete Level 3
```
DELETE http://localhost:5000/api/admin/levels/3
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Level deleted",
  "deleted": {
    "level": 3,
    "xpRequired": 300
  }
}
```

**Note:** Users are NOT automatically updated when a level is deleted (by design).

---

## Testing Checklist

- [ ] Create Level 1 (100 XP)
- [ ] Create Level 2 (200 XP)
- [ ] Create Level 3 (300 XP)
- [ ] Verify levels list correctly
- [ ] Create new user - check `xpForNextLevel` = 200
- [ ] Update Level 2 to 250 XP
- [ ] Verify user's `xpForNextLevel` updated to 250
- [ ] Create more users
- [ ] Update Level 2 again - verify all users at level 1 updated
- [ ] Delete a level - verify it's removed

---

## Direct Database Verification Queries

### Check All Users
```javascript
db.users.find({}, { email: 1, level: 1, xp: 1, xpForNextLevel: 1 }).pretty()
```

### Check All Level Configs
```javascript
db.levelconfigs.find({}).sort({ level: 1 }).pretty()
```

### Count Users Per Level
```javascript
db.users.aggregate([
  { $group: { _id: "$level", count: { $sum: 1 }, avgXp: { $avg: "$xp" } } },
  { $sort: { _id: 1 } }
])
```

---

## Troubleshooting

### Issue: `xpForNextLevel` not updating
- Check that `syncExisting` is `true` in the request
- Verify users exist at the correct level
- Check server logs for errors

### Issue: Users not created with correct `xpForNextLevel`
- Ensure Level 2 config exists before signup
- Check if Level 2 has `xpRequired` set
- Verify `DEFAULT_XP_NEXT_LEVEL` in .env as fallback

### Issue: Authentication errors
- Remove `authMiddleware` from routes if testing without auth
- Or create admin user and include JWT token in headers:
  ```
  Authorization: Bearer <your-token>
  ```

---

## Expected Flow Summary

1. **Admin creates Level 2 (200 XP)**
   → All Level 1 users get `xpForNextLevel = 200`

2. **New user signs up**
   → Starts at Level 1 with `xpForNextLevel = 200`

3. **Admin updates Level 2 to 250 XP**
   → All Level 1 users automatically get `xpForNextLevel = 250`

4. **System maintains consistency**
   → No manual database cleanup needed!
