# XP & Auto Level-Up Testing Guide

## New Features Added ✨

1. **Auto Level-Up**: When users gain XP, they automatically level up if they meet requirements
2. **Multiple Level-Ups**: Users can level up multiple times in one XP addition
3. **Admin XP Management**: Admin can add XP to any user for testing
4. **Auto Re-evaluation**: When admin updates level configs, existing users auto level-up if they qualify

---

## Base URL
`http://localhost:5000`

---

## Complete Testing Flow

### **Step 1: Setup Level Configuration**

#### 1.1 Create Level Configs
```http
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 1,
  "xpRequired": 100
}
```

```http
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 2,
  "xpRequired": 200
}
```

```http
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 3,
  "xpRequired": 300
}
```

```http
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 4,
  "xpRequired": 500
}
```

---

### **Step 2: Create Test Users**

#### 2.1 Create User 1
```http
POST http://localhost:5000/api/user/auth/signup
Content-Type: application/json

{
  "email": "testuser1@example.com",
  "username": "testuser1",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered sucessfully.",
  "user": {
    "id": "675abc123...",  // ← Copy this userId for next steps
    "email": "testuser1@example.com",
    "username": "testuser1"
  },
  "token": "eyJhbGc..."
}
```

#### 2.2 Create User 2
```http
POST http://localhost:5000/api/user/auth/signup
Content-Type: application/json

{
  "email": "testuser2@example.com",
  "username": "testuser2",
  "password": "password123"
}
```

---

### **Step 3: View All Users**

```http
GET http://localhost:5000/api/admin/users
```

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "_id": "675abc123...",
      "email": "testuser1@example.com",
      "username": "testuser1",
      "level": 1,
      "xp": 0,
      "xpForNextLevel": 100
    },
    {
      "_id": "675abc456...",
      "email": "testuser2@example.com",
      "username": "testuser2",
      "level": 1,
      "xp": 0,
      "xpForNextLevel": 100
    }
  ]
}
```

---

### **Step 4: Test Auto Level-Up (Single Level)**

#### 4.1 Add 50 XP (Not Enough to Level Up)
```http
POST http://localhost:5000/api/admin/users/675abc123.../add-xp
Content-Type: application/json

{
  "xpAmount": 50
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "XP added successfully",
  "user": {
    "_id": "675abc123...",
    "level": 1,
    "xp": 50,
    "xpForNextLevel": 100
  },
  "xpAdded": 50,
  "levelsGained": 0,
  "levelUps": [],
  "previousLevel": 1,
  "currentLevel": 1
}
```

#### 4.2 Add 60 XP (Enough to Level Up!)
```http
POST http://localhost:5000/api/admin/users/675abc123.../add-xp
Content-Type: application/json

{
  "xpAmount": 60
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "XP added! User leveled up 1 time(s)!",
  "user": {
    "_id": "675abc123...",
    "level": 2,           // ← Leveled up from 1 to 2!
    "xp": 10,             // ← 50 + 60 = 110, minus 100 for level up = 10 remaining
    "xpForNextLevel": 200 // ← Now needs 200 XP for level 3
  },
  "xpAdded": 60,
  "levelsGained": 1,
  "levelUps": [
    {
      "fromLevel": 1,
      "toLevel": 2,
      "xpConsumed": 100,
      "xpRemaining": 10
    }
  ],
  "previousLevel": 1,
  "currentLevel": 2
}
```

---

### **Step 5: Test Multiple Level-Ups**

#### 5.1 Add 700 XP to User 2 (Should Jump Multiple Levels)
```http
POST http://localhost:5000/api/admin/users/675abc456.../add-xp
Content-Type: application/json

{
  "xpAmount": 700
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "XP added! User leveled up 3 time(s)!",
  "user": {
    "_id": "675abc456...",
    "level": 4,           // ← Jumped from level 1 to 4!
    "xp": 100,            // ← Remaining XP
    "xpForNextLevel": 500 // ← XP needed for level 5 (if it exists)
  },
  "xpAdded": 700,
  "levelsGained": 3,
  "levelUps": [
    {
      "fromLevel": 1,
      "toLevel": 2,
      "xpConsumed": 100,
      "xpRemaining": 600
    },
    {
      "fromLevel": 2,
      "toLevel": 3,
      "xpConsumed": 200,
      "xpRemaining": 400
    },
    {
      "fromLevel": 3,
      "toLevel": 4,
      "xpConsumed": 300,
      "xpRemaining": 100
    }
  ],
  "previousLevel": 1,
  "currentLevel": 4
}
```

**Calculation:**
- Started: Level 1, 0 XP
- Added: 700 XP
- Level 1 → 2: Consumed 100 XP, remaining 600
- Level 2 → 3: Consumed 200 XP, remaining 400
- Level 3 → 4: Consumed 300 XP, remaining 100
- Final: Level 4 with 100 XP

---

### **Step 6: Test Auto Level-Up on Config Update**

#### 6.1 Create User 3 with XP
```http
POST http://localhost:5000/api/user/auth/signup
Content-Type: application/json

{
  "email": "testuser3@example.com",
  "username": "testuser3",
  "password": "password123"
}
```

#### 6.2 Give User 3 Some XP (150 XP at Level 1)
```http
POST http://localhost:5000/api/admin/users/{userId}/add-xp
Content-Type: application/json

{
  "xpAmount": 150
}
```

User should now be at:
- Level: 2
- XP: 50
- xpForNextLevel: 200

#### 6.3 Update Level 2 to Require Only 50 XP (Down from 200)
```http
POST http://localhost:5000/api/admin/levels
Content-Type: application/json

{
  "level": 2,
  "xpRequired": 50,
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
    "xpRequired": 50
  },
  "syncResult": {
    "matchedCount": 1,    // User at level 1 updated
    "modifiedCount": 1,
    "affectedLevel": 1
  },
  "reevalResult": {
    "processed": 1,       // User 3 re-evaluated
    "updatedCount": 1,    // User 3 leveled up!
    "errors": []
  }
}
```

#### 6.4 Verify User 3 Auto Leveled Up
```http
GET http://localhost:5000/api/admin/users/{userId}
```

**Expected:**
- User 3 should now be at **Level 3** (auto leveled up from 2 to 3)
- XP: 0 (50 XP was consumed for level up)
- xpForNextLevel: 300

---

### **Step 7: Get Single User Details**

```http
GET http://localhost:5000/api/admin/users/675abc123...
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "_id": "675abc123...",
    "email": "testuser1@example.com",
    "username": "testuser1",
    "level": 2,
    "xp": 10,
    "xpForNextLevel": 200,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## All Available Routes

### **User Management Routes**
```
GET    /api/admin/users                    - List all users
GET    /api/admin/users/:userId            - Get single user
POST   /api/admin/users/:userId/add-xp     - Add XP to user (auto level-up)
```

### **Level Config Routes**
```
GET    /api/admin/levels                   - List all levels
POST   /api/admin/levels                   - Create/Update level
DELETE /api/admin/levels/:level            - Delete level
```

### **Auth Routes**
```
POST   /api/user/auth/signup               - Create new user
POST   /api/user/auth/login                - Login user
```

---

## Testing Scenarios Summary

### ✅ Scenario 1: Basic XP Addition
- Add XP that doesn't trigger level up
- User XP increases, level stays same

### ✅ Scenario 2: Single Level-Up
- Add enough XP to level up once
- User levels up, excess XP carries over

### ✅ Scenario 3: Multiple Level-Ups
- Add large amount of XP
- User jumps multiple levels
- XP is consumed correctly for each level

### ✅ Scenario 4: Auto Level-Up on Config Update
- User has XP but config didn't exist
- Admin creates/updates level config with lower requirement
- User automatically levels up if they qualify

### ✅ Scenario 5: XP Tracking
- Verify `levelUps` array shows all transitions
- Check XP consumed at each level
- Confirm remaining XP is correct

---

## Database Verification

### Check User Data
```javascript
db.users.find({}, { 
  email: 1, 
  username: 1, 
  level: 1, 
  xp: 1, 
  xpForNextLevel: 1 
}).pretty()
```

### Check Who Leveled Up Recently
```javascript
db.users.find({ level: { $gt: 1 } }).sort({ updatedAt: -1 })
```

### Find Users by Level
```javascript
db.users.find({ level: 2 })
```

---

## Expected Behavior Summary

1. **XP Addition**
   - ✅ XP is added to user's current XP
   - ✅ System checks if user can level up
   - ✅ Levels up automatically if XP >= xpRequired
   - ✅ Handles multiple level-ups in single addition

2. **Level-Up Process**
   - ✅ Consumes XP equal to xpRequired for current level
   - ✅ Increments level by 1
   - ✅ Remaining XP carries forward
   - ✅ Updates xpForNextLevel based on new level

3. **Config Updates**
   - ✅ Updates users at (level - 1) with new xpForNextLevel
   - ✅ Re-evaluates users to check if they can now level up
   - ✅ Automatically levels up qualifying users

4. **Edge Cases**
   - ✅ No level config exists: Uses fallback values
   - ✅ User at max level: XP accumulates but no level up
   - ✅ Negative/zero XP: Request rejected

---

## Quick Test Commands (Copy-Paste Ready)

Replace `{userId}` with actual user ID from signup response.

```bash
# Add small XP (no level up)
curl -X POST http://localhost:5000/api/admin/users/{userId}/add-xp \
  -H "Content-Type: application/json" \
  -d '{"xpAmount": 50}'

# Add enough for 1 level up
curl -X POST http://localhost:5000/api/admin/users/{userId}/add-xp \
  -H "Content-Type: application/json" \
  -d '{"xpAmount": 150}'

# Add enough for multiple level ups
curl -X POST http://localhost:5000/api/admin/users/{userId}/add-xp \
  -H "Content-Type: application/json" \
  -d '{"xpAmount": 700}'

# Get user details
curl http://localhost:5000/api/admin/users/{userId}

# List all users
curl http://localhost:5000/api/admin/users
```

---

## Troubleshooting

### Issue: User not leveling up
- ✅ Check if level config exists for target level
- ✅ Verify XP is >= xpRequired
- ✅ Check database for actual user XP value

### Issue: Wrong xpForNextLevel
- ✅ Ensure level config for next level exists
- ✅ Verify syncExisting=true when updating configs
- ✅ Check if getXpForNextLevel is using correct level

### Issue: Multiple level-ups not working
- ✅ Ensure all intermediate level configs exist
- ✅ Check while loop in addXp service
- ✅ Verify XP calculation is correct

---

## Success Indicators

✅ User XP increases when added
✅ User levels up automatically when XP >= requirement
✅ Multiple level-ups work in single XP addition
✅ xpForNextLevel updates based on new level
✅ Excess XP carries over correctly
✅ Config updates trigger auto level-up for qualifying users
✅ levelUps array shows complete level-up history
