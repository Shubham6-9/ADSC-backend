# Goals API Documentation

Complete guide for testing Goal Management APIs in Postman.

---

## 🔐 Authentication

All goal endpoints require JWT authentication. Include this header in all requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📚 Table of Contents

1. [Create Goal](#1-create-goal)
2. [Get All Goals](#2-get-all-goals)
3. [Get Single Goal](#3-get-single-goal)
4. [Filtering & Sorting](#filtering--sorting)
5. [Validation Examples](#validation-examples)
6. [Error Scenarios](#error-scenarios)
7. [Testing Examples](#testing-examples)

---

## 1. Create Goal

### Endpoint: `POST /api/user/goals`

**Description:** Create a new savings goal. The backend automatically associates the goal with the authenticated user and their username.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Buy a Bike",
  "description": "Mountain bike for weekend rides",
  "targetAmount": 50000,
  "targetDate": "2026-03-01",
  "priority": "high",
  "category": "Transport",
  "savedAmount": 5000
}
```

**Field Descriptions:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | String | ✅ Yes | - | Goal title/name |
| `description` | String | ❌ No | "" | Detailed description |
| `targetAmount` | Number | ✅ Yes | - | Target savings amount (must be > 0) |
| `targetDate` | String (ISO) | ❌ No | - | Target completion date |
| `priority` | String | ❌ No | "medium" | Priority: "low", "medium", "high" |
| `category` | String | ❌ No | "General" | Goal category |
| `savedAmount` | Number | ❌ No | 0 | Already saved amount (must be >= 0) |

**Success Response (201):**
```json
{
  "success": true,
  "goal": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "user": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "title": "Buy a Bike",
    "description": "Mountain bike for weekend rides",
    "targetAmount": 50000,
    "savedAmount": 5000,
    "targetDate": "2026-03-01T00:00:00.000Z",
    "priority": "high",
    "category": "Transport",
    "isAchieved": false,
    "progress": 10,
    "createdAt": "2025-10-11T05:00:00.000Z",
    "updatedAt": "2025-10-11T05:00:00.000Z"
  }
}
```

**Calculated Fields:**
- `progress`: Automatically calculated as `(savedAmount / targetAmount) * 100`
- `isAchieved`: Automatically set to `true` when `savedAmount >= targetAmount`

---

### Example Requests

#### Example 1: Simple Goal (Minimal Fields)
```json
{
  "title": "Emergency Fund",
  "targetAmount": 100000
}
```

**Result:** Creates goal with default values (priority: "medium", category: "General", savedAmount: 0)

---

#### Example 2: Complete Goal
```json
{
  "title": "New Laptop",
  "description": "MacBook Pro for development work",
  "targetAmount": 150000,
  "targetDate": "2025-12-31",
  "priority": "high",
  "category": "Technology",
  "savedAmount": 30000
}
```

**Result:** Progress = 20% (30000/150000)

---

#### Example 3: Vacation Goal
```json
{
  "title": "Europe Trip",
  "description": "2-week vacation in Europe",
  "targetAmount": 300000,
  "targetDate": "2026-06-01",
  "priority": "medium",
  "category": "Travel",
  "savedAmount": 0
}
```

---

#### Example 4: Education Goal
```json
{
  "title": "Online Course",
  "description": "Full-stack web development bootcamp",
  "targetAmount": 25000,
  "targetDate": "2025-11-30",
  "priority": "high",
  "category": "Education"
}
```

---

## 2. Get All Goals

### Endpoint: `GET /api/user/goals`

**Description:** Retrieve goals for the authenticated user with filtering, pagination, and sorting options.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | "active" | Filter: "active", "achieved", "all" |
| `page` | Number | 1 | Page number for pagination |
| `limit` | Number | 20 | Items per page (max: 200) |
| `sortBy` | String | "-createdAt" | Sort fields (comma-separated) |
| `category` | String | - | Filter by category |
| `priority` | String | - | Filter by priority: "low", "medium", "high" |
| `q` | String | - | Search in goal titles |

---

### Example 1: Get Active Goals (Default)

**Request:**
```
GET /api/user/goals
```

**Response (200):**
```json
{
  "success": true,
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "goals": [
    {
      "_id": "671d5e3f2a1b3c4d5e6f7890",
      "user": "68e560e46a0d9cb847fa080d",
      "username": "johndoe",
      "title": "Buy a Bike",
      "description": "Mountain bike",
      "targetAmount": 50000,
      "savedAmount": 10000,
      "targetDate": "2026-03-01T00:00:00.000Z",
      "priority": "high",
      "category": "Transport",
      "isAchieved": false,
      "progress": 20,
      "createdAt": "2025-10-11T05:00:00.000Z"
    }
  ]
}
```

---

### Example 2: Get Achieved Goals

**Request:**
```
GET /api/user/goals?status=achieved
```

**Result:** Returns only goals where `isAchieved = true`

---

### Example 3: Get All Goals (Active + Achieved)

**Request:**
```
GET /api/user/goals?status=all
```

**Result:** Returns all goals regardless of status

---

### Example 4: Filter by Category

**Request:**
```
GET /api/user/goals?category=Travel
```

**Result:** Returns only travel-related goals

---

### Example 5: Filter by Priority

**Request:**
```
GET /api/user/goals?priority=high
```

**Result:** Returns only high-priority goals

---

### Example 6: Search Goals

**Request:**
```
GET /api/user/goals?q=bike
```

**Result:** Returns goals with "bike" in the title (case-insensitive)

---

### Example 7: Sort by Progress

**Request:**
```
GET /api/user/goals?sortBy=progress
```

**Result:** Goals sorted by progress (lowest to highest)

---

### Example 8: Combined Filters

**Request:**
```
GET /api/user/goals?status=active&priority=high&category=Technology&sortBy=-progress
```

**Result:** Active high-priority technology goals, sorted by highest progress first

---

## 3. Get Single Goal

### Endpoint: `GET /api/user/goals/:id`

**Description:** Get details of a specific goal by its ID (owner only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example Request:**
```
GET /api/user/goals/671d5e3f2a1b3c4d5e6f7890
```

**Success Response (200):**
```json
{
  "success": true,
  "goal": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "user": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "title": "Buy a Bike",
    "description": "Mountain bike for weekend rides",
    "targetAmount": 50000,
    "savedAmount": 15000,
    "targetDate": "2026-03-01T00:00:00.000Z",
    "priority": "high",
    "category": "Transport",
    "isAchieved": false,
    "progress": 30,
    "createdAt": "2025-10-11T05:00:00.000Z",
    "updatedAt": "2025-10-11T06:30:00.000Z"
  }
}
```

---

## 4. Update Goal (Add Savings)

### Endpoint: `PATCH /api/user/goals/:id`

**Description:** Update a goal's saved amount. Automatically marks goal as achieved when saved amount reaches or exceeds target amount.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "savedAmount": 20000
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `savedAmount` | Number | ✅ Yes | New total saved amount (must be >= 0) |

**Example Request:**
```
PATCH /api/user/goals/671d5e3f2a1b3c4d5e6f7890
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Goal updated successfully",
  "goal": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "user": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "title": "Buy a Bike",
    "description": "Mountain bike for weekend rides",
    "targetAmount": 50000,
    "savedAmount": 20000,
    "targetDate": "2026-03-01T00:00:00.000Z",
    "priority": "high",
    "category": "Transport",
    "isAchieved": false,
    "progress": 40,
    "createdAt": "2025-10-11T05:00:00.000Z",
    "updatedAt": "2025-10-11T07:00:00.000Z"
  }
}
```

**Note:** When `savedAmount >= targetAmount`, the goal is automatically marked as achieved (`isAchieved: true`).

---

## 5. Get Total Savings

### Endpoint: `GET /api/user/goals/summary/total-savings`

**Description:** Get total savings across all goals and budgets, with breakdown by category.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "totalSavings": 85000,
  "breakdown": {
    "fromGoals": 55000,
    "fromBudgets": 30000
  },
  "goalsByCategory": [
    {
      "_id": "Transport",
      "totalSaved": 20000,
      "totalTarget": 50000,
      "count": 1
    },
    {
      "_id": "Travel",
      "totalSaved": 15000,
      "totalTarget": 100000,
      "count": 2
    },
    {
      "_id": "Emergency",
      "totalSaved": 20000,
      "totalTarget": 50000,
      "count": 1
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `totalSavings` | Number | Total savings from both goals and budgets |
| `breakdown.fromGoals` | Number | Total saved in all goals |
| `breakdown.fromBudgets` | Number | Total savings from all budgets |
| `goalsByCategory` | Array | Breakdown of goals by category |

---

## Filtering & Sorting

### Status Options

| Status | Description |
|--------|-------------|
| `active` | Goals not yet achieved (default) |
| `achieved` | Goals where savedAmount >= targetAmount |
| `all` | Both active and achieved goals |

---

### Sort Options

| Sort Field | Description |
|------------|-------------|
| `createdAt` | Oldest first |
| `-createdAt` | Newest first (default) |
| `progress` | Lowest progress first |
| `-progress` | Highest progress first |
| `targetAmount` | Lowest target first |
| `-targetAmount` | Highest target first |
| `targetDate` | Earliest date first |
| `-targetDate` | Latest date first |

**Multiple sorts:** Separate with commas: `sortBy=priority,-progress`

---

### Priority Levels

- `low` - Nice to have
- `medium` - Important (default)
- `high` - Critical/urgent

---

### Category Examples

Common goal categories:
- `General` - Miscellaneous goals (default)
- `Technology` - Gadgets, laptops, phones
- `Travel` - Vacations, trips
- `Transport` - Vehicles, bikes
- `Education` - Courses, books
- `Health` - Gym, medical
- `Home` - Furniture, appliances
- `Emergency` - Emergency funds

---

## Validation Examples

### ✅ Valid Goal (Minimal)

```json
{
  "title": "New Phone",
  "targetAmount": 30000
}
```

**Result:** ✅ Created with defaults

---

### ✅ Valid Goal (Complete)

```json
{
  "title": "Dream Vacation",
  "description": "Trip to Bali",
  "targetAmount": 200000,
  "targetDate": "2026-12-31",
  "priority": "medium",
  "category": "Travel",
  "savedAmount": 50000
}
```

**Result:** ✅ Created with progress = 25%

---

### ✅ Achieved Goal

```json
{
  "title": "Emergency Fund",
  "targetAmount": 50000,
  "savedAmount": 50000
}
```

**Result:** ✅ Created with `isAchieved = true`, `progress = 100`

---

## Error Scenarios

### Error 1: Missing Title

**Request:**
```json
{
  "targetAmount": 50000
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "title is required and must be a non-empty string"
}
```

---

### Error 2: Empty Title

**Request:**
```json
{
  "title": "   ",
  "targetAmount": 50000
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "title is required and must be a non-empty string"
}
```

---

### Error 3: Invalid Target Amount (Zero)

**Request:**
```json
{
  "title": "Buy a Car",
  "targetAmount": 0
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "targetAmount is required and must be a number > 0"
}
```

---

### Error 4: Negative Target Amount

**Request:**
```json
{
  "title": "Buy a Car",
  "targetAmount": -50000
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "targetAmount is required and must be a number > 0"
}
```

---

### Error 5: Invalid Saved Amount (Negative)

**Request:**
```json
{
  "title": "Buy a Bike",
  "targetAmount": 50000,
  "savedAmount": -5000
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "savedAmount must be a non-negative number"
}
```

---

### Error 6: Invalid Target Date

**Request:**
```json
{
  "title": "New Laptop",
  "targetAmount": 80000,
  "targetDate": "invalid-date"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "targetDate must be a valid date if provided"
}
```

---

### Error 7: Invalid Priority

**Request:**
```json
{
  "title": "New Phone",
  "targetAmount": 30000,
  "priority": "urgent"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "priority must be one of 'low','medium','high'"
}
```

---

### Error 8: Invalid Goal ID

**Request:**
```
GET /api/user/goals/invalid-id
```

**Response (400):**
```json
{
  "success": false,
  "message": "Invalid goal id"
}
```

---

### Error 9: Goal Not Found

**Request:**
```
GET /api/user/goals/507f1f77bcf86cd799439011
```
*(Non-existent ID or not owned by user)*

**Response (404):**
```json
{
  "success": false,
  "message": "Goal not found"
}
```

---

### Error 10: Unauthorized (No Token)

**Request:** No Authorization header

**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Testing Examples

### Complete Test Flow

#### Step 1: Login
```
POST /api/user/auth/login
Body: { "emailOrUsername": "johndoe", "password": "John@123" }
```
**Copy the token from response**

---

#### Step 2: Create First Goal
```
POST /api/user/goals
Headers: Authorization: Bearer YOUR_TOKEN
Body:
{
  "title": "Emergency Fund",
  "description": "6 months of expenses",
  "targetAmount": 300000,
  "priority": "high",
  "category": "Emergency",
  "savedAmount": 50000
}
```

**Result:** Goal created with 16.67% progress

---

#### Step 3: Create More Goals

**Travel Goal:**
```json
{
  "title": "Japan Trip",
  "description": "2-week vacation",
  "targetAmount": 250000,
  "targetDate": "2026-05-01",
  "priority": "medium",
  "category": "Travel"
}
```

**Tech Goal:**
```json
{
  "title": "New MacBook",
  "targetAmount": 150000,
  "priority": "high",
  "category": "Technology",
  "savedAmount": 75000
}
```

**Education Goal:**
```json
{
  "title": "MBA Course",
  "targetAmount": 500000,
  "targetDate": "2027-01-01",
  "priority": "medium",
  "category": "Education"
}
```

---

#### Step 4: Get All Active Goals
```
GET /api/user/goals
```

**Result:** See all incomplete goals

---

#### Step 5: Get High Priority Goals
```
GET /api/user/goals?priority=high
```

**Result:** See only urgent goals

---

#### Step 6: Search for Goals
```
GET /api/user/goals?q=trip
```

**Result:** Find "Japan Trip" goal

---

#### Step 7: Sort by Progress
```
GET /api/user/goals?sortBy=-progress
```

**Result:** See goals with highest progress first

---

#### Step 8: Get Goal Details
```
GET /api/user/goals/{goal_id}
```
*(Use _id from create response)*

**Result:** See detailed information

---

## Use Cases

### 1. Goal Dashboard
Get all active goals sorted by priority:
```
GET /api/user/goals?status=active&sortBy=priority,-progress
```

---

### 2. Achievement Tracking
Get completed goals:
```
GET /api/user/goals?status=achieved
```

---

### 3. Category Analysis
Get all travel goals:
```
GET /api/user/goals?category=Travel
```

---

### 4. Priority Planning
Get high-priority incomplete goals:
```
GET /api/user/goals?status=active&priority=high
```

---

### 5. Progress Monitoring
Get goals sorted by progress:
```
GET /api/user/goals?sortBy=-progress&limit=5
```

---

## Response Fields

### Goal Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Unique goal ID |
| `user` | String | User ID (automatically set) |
| `username` | String | Username (automatically set) |
| `title` | String | Goal title |
| `description` | String | Goal description |
| `targetAmount` | Number | Target savings amount |
| `savedAmount` | Number | Current saved amount |
| `targetDate` | Date | Target completion date (optional) |
| `priority` | String | Priority level: "low", "medium", "high" |
| `category` | String | Goal category |
| `isAchieved` | Boolean | Auto-set when savedAmount >= targetAmount |
| `progress` | Number | Auto-calculated: (savedAmount/targetAmount) * 100 |
| `createdAt` | Date | When goal was created |
| `updatedAt` | Date | Last update timestamp |

---

## Postman Tips

### Save Token

**After login, add this test script:**
```javascript
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
});
```

---

### Save Goal ID

**After creating goal:**
```javascript
pm.test("Goal created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.environment.set("goal_id", jsonData.goal._id);
});
```

---

### Auto-add Authorization

**Collection-level Pre-request Script:**
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token')
});
```

---

## Base URL

All endpoints use the base URL:
```
http://localhost:5000
```

Or your deployed URL:
```
https://your-domain.com
```

---

## Related Endpoints

- **Login:** `POST /api/user/auth/login`
- **Signup:** `POST /api/user/auth/signup`
- **Create Budget:** `POST /api/user/budget`
- **Add Expense:** `POST /api/user/expense`

---

**Last Updated:** October 11, 2025
