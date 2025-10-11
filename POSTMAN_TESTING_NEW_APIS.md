# Postman Testing Guide - New APIs (Currency Symbol & Dashboard)

## 🎯 Testing Overview

This guide covers testing for:
1. **Updated Signup API** - Now includes currencySymbol field
2. **New Dashboard API** - Complete user data for dashboard display

---

## 📋 Prerequisites

- Postman installed
- Server running on `http://localhost:5000`
- MongoDB connected

---

## 1️⃣ Test Updated Signup API

### **Endpoint Details**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/user/auth/signup`
- **Auth:** None required

### **Test Case 1: Successful Signup with Currency Symbol**

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "password123",
  "country": "United States",
  "currency": "USD",
  "currencySymbol": "$"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "user": {
    "id": "67056f8a9b2c3d4e5f6a7b8c",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "country": "United States",
    "currency": "USD",
    "currencySymbol": "$"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **What to Verify:**
- Status code is 201
- Response includes `currencySymbol: "$"`
- Token is generated
- User ID is returned

---

### **Test Case 2: Signup with Different Currencies**

**Test with Euro (€):**
```json
{
  "email": "marie@example.com",
  "username": "marieeu",
  "password": "password123",
  "country": "France",
  "currency": "EUR",
  "currencySymbol": "€"
}
```

**Test with Indian Rupee (₹):**
```json
{
  "email": "raj@example.com",
  "username": "rajindia",
  "password": "password123",
  "country": "India",
  "currency": "INR",
  "currencySymbol": "₹"
}
```

**Test with British Pound (£):**
```json
{
  "email": "james@example.com",
  "username": "jamesuk",
  "password": "password123",
  "country": "United Kingdom",
  "currency": "GBP",
  "currencySymbol": "£"
}
```

**Test with Japanese Yen (¥):**
```json
{
  "email": "yuki@example.com",
  "username": "yukijp",
  "password": "password123",
  "country": "Japan",
  "currency": "JPY",
  "currencySymbol": "¥"
}
```

---

### **Test Case 3: Missing Currency Symbol (Should Fail)**

**Request Body:**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "country": "Canada",
  "currency": "CAD"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Country, currency, and currency symbol are required."
}
```

✅ **What to Verify:**
- Status code is 400
- Error message mentions currency symbol requirement

---

### **Test Case 4: Invalid Currency Code (Should Fail)**

**Request Body:**
```json
{
  "email": "test2@example.com",
  "username": "testuser2",
  "password": "password123",
  "country": "Canada",
  "currency": "CA",
  "currencySymbol": "$"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Currency must be a valid 3-letter code (e.g., USD, EUR, INR)."
}
```

✅ **What to Verify:**
- Status code is 400
- Currency validation works correctly

---

## 2️⃣ Test Dashboard API

### **Setup: Get User ID**

Before testing the dashboard API, you need a user ID. Use one of these methods:

**Method 1: From Signup Response**
- Copy the `id` from the signup response above

**Method 2: List All Users**
- **GET** `http://localhost:5000/api/admin/users`
- Copy any user's `_id` from the response

---

### **Endpoint Details**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/admin/users/dashboard/:userId`
- **Auth:** None required (currently)

### **Test Case 1: Get Dashboard Data for New User**

**URL Example:**
```
http://localhost:5000/api/admin/users/dashboard/67056f8a9b2c3d4e5f6a7b8c
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "userInfo": {
      "id": "67056f8a9b2c3d4e5f6a7b8c",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "country": "United States",
      "currency": "USD",
      "currencySymbol": "$",
      "createdAt": "2025-10-08T13:50:00.000Z",
      "updatedAt": "2025-10-08T13:50:00.000Z"
    },
    "gamificationStats": {
      "level": 1,
      "xp": 0,
      "xpForNextLevel": 100,
      "xpProgress": 0,
      "totalCompletedChallenges": 0
    },
    "completedChallenges": []
  }
}
```

✅ **What to Verify:**
- Status code is 200
- `userInfo` contains all user fields including `currencySymbol`
- `gamificationStats.level` is 1 (new user)
- `gamificationStats.xp` is 0
- `gamificationStats.xpProgress` is 0
- `completedChallenges` is empty array

---

### **Test Case 2: Dashboard After Adding XP**

**Step 1: Add XP to User**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/admin/users/67056f8a9b2c3d4e5f6a7b8c/add-xp`
- **Body:**
```json
{
  "xpAmount": 75
}
```

**Step 2: Check Dashboard Again**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/admin/users/dashboard/67056f8a9b2c3d4e5f6a7b8c`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "userInfo": {
      "id": "67056f8a9b2c3d4e5f6a7b8c",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "country": "United States",
      "currency": "USD",
      "currencySymbol": "$",
      "createdAt": "2025-10-08T13:50:00.000Z",
      "updatedAt": "2025-10-08T13:55:00.000Z"
    },
    "gamificationStats": {
      "level": 1,
      "xp": 75,
      "xpForNextLevel": 100,
      "xpProgress": 75.0,
      "totalCompletedChallenges": 0
    },
    "completedChallenges": []
  }
}
```

✅ **What to Verify:**
- `gamificationStats.xp` is now 75
- `gamificationStats.xpProgress` is 75.0 (75% progress)
- User still at level 1 (hasn't reached 100 XP yet)

---

### **Test Case 3: Dashboard After Level Up**

**Step 1: Add More XP to Trigger Level Up**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/admin/users/67056f8a9b2c3d4e5f6a7b8c/add-xp`
- **Body:**
```json
{
  "xpAmount": 150
}
```

**Step 2: Check Dashboard**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/admin/users/dashboard/67056f8a9b2c3d4e5f6a7b8c`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "userInfo": {
      "id": "67056f8a9b2c3d4e5f6a7b8c",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "country": "United States",
      "currency": "USD",
      "currencySymbol": "$",
      "createdAt": "2025-10-08T13:50:00.000Z",
      "updatedAt": "2025-10-08T14:00:00.000Z"
    },
    "gamificationStats": {
      "level": 2,
      "xp": 225,
      "xpForNextLevel": 200,
      "xpProgress": 12.5,
      "totalCompletedChallenges": 0
    },
    "completedChallenges": []
  }
}
```

✅ **What to Verify:**
- `gamificationStats.level` is now 2
- `gamificationStats.xp` is 225 (75 + 150)
- `gamificationStats.xpProgress` is 12.5 (25/200 = 12.5%)
- User leveled up successfully

---

### **Test Case 4: Dashboard with Completed Challenges**

**Step 1: Create a Challenge (Admin)**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/admin/challenges`
- **Body:**
```json
{
  "challengeName": "Complete Budget Tutorial",
  "challengeDescription": "Learn how to create your first budget",
  "xpReward": 100
}
```

**Copy the challenge ID from response**

**Step 2: User Completes the Challenge**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/user/my-challenges/{challengeId}/complete`
- **Headers:** `Authorization: Bearer {user-token}`

**Step 3: Check Dashboard**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/admin/users/dashboard/67056f8a9b2c3d4e5f6a7b8c`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "userInfo": {
      "id": "67056f8a9b2c3d4e5f6a7b8c",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "country": "United States",
      "currency": "USD",
      "currencySymbol": "$",
      "createdAt": "2025-10-08T13:50:00.000Z",
      "updatedAt": "2025-10-08T14:05:00.000Z"
    },
    "gamificationStats": {
      "level": 2,
      "xp": 325,
      "xpForNextLevel": 200,
      "xpProgress": 62.5,
      "totalCompletedChallenges": 1
    },
    "completedChallenges": [
      {
        "challengeId": "67056fab9b2c3d4e5f6a7b9d",
        "challengeName": "Complete Budget Tutorial",
        "challengeDescription": "Learn how to create your first budget",
        "xpReward": 100,
        "completedAt": "2025-10-08T14:05:00.000Z"
      }
    ]
  }
}
```

✅ **What to Verify:**
- `gamificationStats.totalCompletedChallenges` is 1
- `completedChallenges` array has one item
- Challenge details are populated correctly
- XP increased by the challenge reward

---

### **Test Case 5: Invalid User ID (Should Fail)**

**URL:**
```
http://localhost:5000/api/admin/users/dashboard/invaliduserid123
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found"
}
```

✅ **What to Verify:**
- Status code is 404
- Appropriate error message

---

## 🔄 Complete Testing Flow

### **Flow 1: New User Journey**

```
1. POST /api/user/auth/signup (with currencySymbol)
   ↓ Copy user ID and token
2. GET /api/admin/users/dashboard/:userId
   ↓ Verify initial state (level 1, 0 XP)
3. POST /api/admin/users/:userId/add-xp
   ↓ Add 75 XP
4. GET /api/admin/users/dashboard/:userId
   ↓ Verify xpProgress is 75%
5. POST /api/admin/users/:userId/add-xp
   ↓ Add 150 XP (trigger level up)
6. GET /api/admin/users/dashboard/:userId
   ↓ Verify level 2, correct XP progress
```

---

### **Flow 2: Challenge Completion Journey**

```
1. POST /api/admin/challenges (create challenge)
   ↓ Copy challenge ID
2. POST /api/user/my-challenges/:id/complete
   ↓ Complete challenge (use token)
3. GET /api/admin/users/dashboard/:userId
   ↓ Verify completedChallenges array populated
4. Verify totalCompletedChallenges count
5. Verify XP increased by challenge reward
```

---

## 📊 Postman Collection Structure

**Recommended Organization:**

```
📁 Gamified Budgeting App
│
├── 📁 Authentication
│   ├── Signup (with Currency Symbol)
│   ├── Signup - USD
│   ├── Signup - EUR
│   ├── Signup - INR
│   └── Login
│
├── 📁 User Dashboard
│   ├── Get Dashboard Data
│   ├── Dashboard - After XP Addition
│   ├── Dashboard - After Level Up
│   ├── Dashboard - With Challenges
│   └── Dashboard - Invalid User ID
│
├── 📁 User Management
│   ├── List All Users
│   ├── Get User By ID
│   └── Add XP to User
│
└── 📁 Challenges
    ├── Create Challenge
    ├── List Challenges
    ├── Complete Challenge
    └── User's Completed Challenges
```

---

## 🎯 XP Progress Calculation Explained

The `xpProgress` field shows percentage progress toward the next level:

**Formula:** `(currentXP % xpForNextLevel) / xpForNextLevel * 100`

**Examples:**

| Current XP | XP for Next Level | XP Progress | Explanation |
|------------|-------------------|-------------|-------------|
| 0 | 100 | 0% | No progress yet |
| 50 | 100 | 50% | Halfway to next level |
| 75 | 100 | 75% | 75% complete |
| 225 | 200 | 12.5% | Level 2 with 25 XP (25/200) |
| 350 | 300 | 16.67% | 50 XP toward next level |

---

## ✅ Testing Checklist

### **Signup API:**
- [ ] Signup with USD and $ symbol
- [ ] Signup with EUR and € symbol
- [ ] Signup with INR and ₹ symbol
- [ ] Signup with GBP and £ symbol
- [ ] Signup with JPY and ¥ symbol
- [ ] Signup without currencySymbol (should fail)
- [ ] Signup with invalid currency code (should fail)
- [ ] Verify currencySymbol in response

### **Dashboard API:**
- [ ] Get dashboard for new user (level 1, 0 XP)
- [ ] Verify all userInfo fields present
- [ ] Verify currencySymbol displayed correctly
- [ ] Dashboard after adding XP
- [ ] Verify xpProgress calculation
- [ ] Dashboard after level up
- [ ] Dashboard with completed challenges
- [ ] Verify totalCompletedChallenges count
- [ ] Verify completedChallenges array populated
- [ ] Invalid user ID returns 404
- [ ] Verify challenge details in completedChallenges

---

## 💡 Tips for Postman Testing

### **1. Environment Variables**
Create environment variables for reusability:
- `baseUrl`: `http://localhost:5000`
- `userId`: Copy from signup response
- `token`: Copy from login/signup response
- `challengeId`: Copy from create challenge response

**Usage in URL:**
```
{{baseUrl}}/api/admin/users/dashboard/{{userId}}
```

### **2. Tests Scripts**
Add test scripts to verify responses automatically:

```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

pm.test("Currency symbol is present", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.userInfo.currencySymbol).to.exist;
});

pm.test("XP progress is calculated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.gamificationStats.xpProgress).to.be.a('number');
});
```

### **3. Save Token Automatically**
In signup/login request, add this test script:

```javascript
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.token);
pm.environment.set("userId", jsonData.user.id);
```

### **4. Pre-request Scripts**
For challenge completion, add pre-request script:

```javascript
console.log("Using token:", pm.environment.get("token"));
console.log("Challenge ID:", pm.environment.get("challengeId"));
```

---

## 🚀 Ready to Test!

You now have comprehensive test cases for:
- ✅ Updated signup with currency symbol
- ✅ Complete dashboard API
- ✅ All edge cases and error scenarios

**Start Testing:**
1. Import this guide into Postman as documentation
2. Create requests following the examples
3. Run tests in sequence
4. Verify all responses match expected results

Happy Testing! 🎉
