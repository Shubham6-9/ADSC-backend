# Budget API Documentation

Complete guide for testing Budget APIs in Postman.

---

## 🔐 Authentication

All budget endpoints require JWT authentication. Include this header in all requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

To get a token, use the login endpoint first.

---

## 📚 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Budget CRUD Operations](#budget-crud-operations)
3. [Budget Summary & Analytics](#budget-summary--analytics)
4. [Spending Management](#spending-management)
5. [Validation Examples](#validation-examples)
6. [Error Scenarios](#error-scenarios)

---

## Authentication Endpoints

### 1. User Signup

**Endpoint:** `POST /api/user/auth/signup`

**Request Body:**
```json
{
  "email": "john@example.com",
  "username": "johndoe",
  "password": "John@123",
  "country": "USA",
  "currency": "USD",
  "currencySymbol": "$"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "68e560e46a0d9cb847fa080d",
    "email": "john@example.com",
    "username": "johndoe",
    "country": "USA",
    "currency": "USD"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. User Login

**Endpoint:** `POST /api/user/auth/login`

**Request Body:**
```json
{
  "emailOrUsername": "johndoe",
  "password": "John@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "68e560e46a0d9cb847fa080d",
    "email": "john@example.com",
    "username": "johndoe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**📝 Note:** Copy the `token` value and use it in all subsequent budget API requests.

---

## Budget CRUD Operations

### 3. Create Yearly Overall Budget

**Endpoint:** `POST /api/user/budget`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "2025 Overall Budget",
  "budgetType": "overall",
  "budgetAmount": 120000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "budgetDuration": "yearly"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "budget": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "user": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "title": "2025 Overall Budget",
    "budgetType": "overall",
    "budgetAmount": 120000,
    "spent": 0,
    "savings": 120000,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z",
    "budgetDuration": "yearly",
    "createdAt": "2025-10-10T10:00:00.000Z",
    "updatedAt": "2025-10-10T10:00:00.000Z"
  },
  "totalSavings": 120000
}
```

---

### 4. Create Yearly Category Budget

**Endpoint:** `POST /api/user/budget`

**Request Body:**
```json
{
  "title": "2025 Grocery Budget",
  "budgetType": "category",
  "categoryName": "groceries",
  "budgetAmount": 60000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "budgetDuration": "yearly"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "budget": {
    "_id": "671d6a8b3d2e4f5g6h7i8901",
    "user": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "title": "2025 Grocery Budget",
    "budgetType": "category",
    "categoryName": "groceries",
    "budgetAmount": 60000,
    "spent": 0,
    "savings": 60000,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z",
    "budgetDuration": "yearly"
  },
  "totalSavings": 180000
}
```

---

### 5. Create Monthly Budget (Linked to Yearly)

**Endpoint:** `POST /api/user/budget`

**Request Body:**
```json
{
  "title": "January 2025 Budget",
  "budgetType": "overall",
  "budgetAmount": 10000,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "budgetDuration": "monthly"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "budget": {
    "_id": "671d7b9c4e3f5g6h7i8j9012",
    "user": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "title": "January 2025 Budget",
    "budgetType": "overall",
    "budgetAmount": 10000,
    "spent": 0,
    "savings": 10000,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T00:00:00.000Z",
    "budgetDuration": "monthly"
  },
  "totalSavings": 190000
}
```

**📝 Validation:** 
- If yearly "overall" budget exists, validates dates are within yearly range
- Validates monthly amount doesn't exceed remaining yearly budget

---

### 6. Create Monthly Category Budget

**Endpoint:** `POST /api/user/budget`

**Request Body:**
```json
{
  "title": "January Groceries",
  "budgetType": "category",
  "categoryName": "groceries",
  "budgetAmount": 5000,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "budgetDuration": "monthly"
}
```

**Success Response (201):** Similar structure as above

---

### 7. Create Weekly Budget

**Endpoint:** `POST /api/user/budget`

**Request Body:**
```json
{
  "title": "Week 1 January 2025",
  "budgetType": "overall",
  "budgetAmount": 2500,
  "startDate": "2025-01-01",
  "endDate": "2025-01-07",
  "budgetDuration": "weekly"
}
```

**Success Response (201):** Similar structure as above

---

### 8. Create Custom Budget

**Endpoint:** `POST /api/user/budget`

**Request Body:**
```json
{
  "title": "Vacation Budget",
  "budgetType": "category",
  "categoryName": "vacation",
  "budgetAmount": 15000,
  "startDate": "2025-06-01",
  "endDate": "2025-06-15",
  "budgetDuration": "custom"
}
```

**Success Response (201):** Similar structure as above

---

### 9. Get All Budgets

**Endpoint:** `GET /api/user/budget`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "budgets": [
    {
      "_id": "671d5e3f2a1b3c4d5e6f7890",
      "username": "johndoe",
      "title": "2025 Overall Budget",
      "budgetType": "overall",
      "budgetAmount": 120000,
      "spent": 0,
      "savings": 120000,
      "budgetDuration": "yearly"
    },
    {
      "_id": "671d7b9c4e3f5g6h7i8j9012",
      "username": "johndoe",
      "title": "January 2025 Budget",
      "budgetType": "overall",
      "budgetAmount": 10000,
      "spent": 0,
      "savings": 10000,
      "budgetDuration": "monthly"
    }
  ],
  "totalSavings": 130000
}
```

---

### 10. Get Active Budgets Only

**Endpoint:** `GET /api/user/budget/active`

**Description:** Fetches only budgets that are currently active. A budget is considered "active" when the current date falls between its `startDate` and `endDate`.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "budgets": [
    {
      "_id": "671d7b9c4e3f5g6h7i8j9012",
      "username": "johndoe",
      "title": "January 2025 Budget",
      "budgetType": "overall",
      "budgetAmount": 10000,
      "spent": 2000,
      "savings": 8000,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T00:00:00.000Z",
      "budgetDuration": "monthly"
    },
    {
      "_id": "671d8c0d5f4g6h7i8j9k0123",
      "username": "johndoe",
      "title": "2025 Grocery Budget",
      "budgetType": "category",
      "categoryName": "groceries",
      "budgetAmount": 60000,
      "spent": 5000,
      "savings": 55000,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T00:00:00.000Z",
      "budgetDuration": "yearly"
    }
  ],
  "totalSavings": 130000
}
```

**Use Cases:**
- Display current budgets in dashboard
- Show only relevant budgets to users
- Filter out expired or future budgets
- Track active spending limits

**Example Scenarios:**

**Scenario 1:** Today is January 15, 2025
- ✅ Returns: January 2025 budget (1st - 31st)
- ✅ Returns: 2025 yearly budget (Jan 1 - Dec 31)
- ❌ Excludes: February 2025 budget (future)
- ❌ Excludes: December 2024 budget (expired)

**Scenario 2:** User has no active budgets
```json
{
  "success": true,
  "count": 0,
  "budgets": [],
  "totalSavings": 0
}
```

---

### 11. Get Single Budget by ID

**Endpoint:** `GET /api/user/budget/{budget_id}`

**Example:** `GET /api/user/budget/671d5e3f2a1b3c4d5e6f7890`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "budget": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "username": "johndoe",
    "title": "2025 Overall Budget",
    "budgetType": "overall",
    "budgetAmount": 120000,
    "spent": 0,
    "savings": 120000,
    "budgetDuration": "yearly"
  }
}
```

---

## Budget Summary & Analytics

### 11. Get Budget Summary

**Endpoint:** `GET /api/user/budget/summary`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "summary": [
    {
      "yearlyBudget": {
        "_id": "671d5e3f2a1b3c4d5e6f7890",
        "username": "johndoe",
        "title": "2025 Overall Budget",
        "budgetType": "overall",
        "budgetAmount": 120000,
        "spent": 0,
        "savings": 120000
      },
      "monthlyBudgets": [
        {
          "_id": "671d7b9c4e3f5g6h7i8j9012",
          "title": "January 2025 Budget",
          "budgetAmount": 10000,
          "spent": 0,
          "savings": 10000,
          "startDate": "2025-01-01T00:00:00.000Z",
          "endDate": "2025-01-31T00:00:00.000Z"
        },
        {
          "_id": "671d8c0d5f4g6h7i8j9k0123",
          "title": "February 2025 Budget",
          "budgetAmount": 8000,
          "spent": 0,
          "savings": 8000,
          "startDate": "2025-02-01T00:00:00.000Z",
          "endDate": "2025-02-28T00:00:00.000Z"
        }
      ],
      "totalAllocatedMonthly": 18000,
      "remainingBudget": 102000,
      "allocationPercentage": "15.00"
    }
  ]
}
```

**📝 Description:** 
- Shows all yearly budgets
- Lists corresponding monthly budgets
- Calculates total allocated and remaining amounts
- Shows allocation percentage

---

## Spending Management

### 12. Record Spending on Budget

**Endpoint:** `PATCH /api/user/budget/{budget_id}/spent`

**Example:** `PATCH /api/user/budget/671d7b9c4e3f5g6h7i8j9012/spent`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "amountSpent": 2000
}
```

**Success Response (200):**
```json
{
  "success": true,
  "budget": {
    "_id": "671d7b9c4e3f5g6h7i8j9012",
    "username": "johndoe",
    "title": "January 2025 Budget",
    "budgetType": "overall",
    "budgetAmount": 10000,
    "spent": 2000,
    "savings": 8000,
    "budgetDuration": "monthly"
  },
  "totalSavings": 128000
}
```

**📝 Description:**
- Increments the `spent` field
- Automatically recalculates `savings` (budgetAmount - spent)
- Updates total savings

---

## Validation Examples

### ✅ Valid Scenarios

#### Scenario 1: Monthly Budget Within Yearly Range
```json
// Yearly Budget: 2025-01-01 to 2025-12-31
// Monthly Budget: 2025-01-01 to 2025-01-31
// ✅ Success - January is within 2025
```

#### Scenario 2: Multiple Categories Same Dates
```json
// Category Budget 1: Groceries Yearly (2025-01-01 to 2025-12-31)
// Category Budget 2: Entertainment Yearly (2025-01-01 to 2025-12-31)
// ✅ Success - Different categories allowed
```

#### Scenario 3: Same Category Different Durations
```json
// Category Budget 1: Groceries Yearly (2025-01-01 to 2025-12-31)
// Category Budget 2: Groceries Monthly (2025-01-01 to 2025-01-31)
// ✅ Success - Different durations allowed
```

---

### ❌ Error Scenarios

#### Error 1: Monthly Budget Outside Yearly Range

**Request:**
```json
{
  "title": "December 2024 Budget",
  "budgetType": "overall",
  "budgetAmount": 10000,
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "budgetDuration": "monthly"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Monthly budget dates (2024-12-01 to 2024-12-31) must fall within yearly budget dates (2025-01-01 to 2025-12-31)"
}
```

---

#### Error 2: Monthly Budget Exceeds Remaining Yearly

**Scenario:**
- Yearly Budget: 120,000
- Already Allocated: 100,000
- Remaining: 20,000
- Trying to create: 30,000

**Request:**
```json
{
  "title": "March 2025 Budget",
  "budgetType": "overall",
  "budgetAmount": 30000,
  "startDate": "2025-03-01",
  "endDate": "2025-03-31",
  "budgetDuration": "monthly"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Monthly budget (30000) exceeds remaining yearly budget (20000). Yearly: 120000, Already allocated: 100000"
}
```

---

#### Error 3: Duplicate Overall Budget (Same Dates)

**Request:** Creating second overall monthly budget with same dates

**Error Response (400):**
```json
{
  "success": false,
  "message": "An overall monthly budget with these dates already exists. Please use different dates or update the existing budget."
}
```

---

#### Error 4: Duplicate Category Budget (Same Duration)

**Request:** Creating second "groceries" yearly budget

**Error Response (400):**
```json
{
  "success": false,
  "message": "A yearly budget for category 'groceries' already exists. You can only have one yearly budget per category."
}
```

---

#### Error 5: Invalid Budget Amount

**Request:**
```json
{
  "title": "Test Budget",
  "budgetType": "overall",
  "budgetAmount": -5000,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "budgetDuration": "monthly"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "budgetAmount must be a positive number"
}
```

---

#### Error 6: Start Date After End Date

**Request:**
```json
{
  "title": "Test Budget",
  "budgetType": "overall",
  "budgetAmount": 10000,
  "startDate": "2025-12-31",
  "endDate": "2025-01-01",
  "budgetDuration": "monthly"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "startDate cannot be after endDate"
}
```

---

#### Error 7: Unauthorized (No Token)

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

#### Error 8: Budget Not Found

**Request:** `GET /api/user/budget/invalid_id_or_another_users_budget`

**Error Response (404):**
```json
{
  "success": false,
  "message": "Budget not found"
}
```

---

## Complete Test Flow

### Flow 1: Basic Budget Setup

1. **Login** → Get JWT token
2. **Create Yearly Budget** (120,000 overall)
3. **Create Monthly Budget** (10,000 for January)
4. **Create Another Monthly** (8,000 for February)
5. **Get Summary** → See allocation (18,000 used, 102,000 remaining)
6. **Record Spending** on January budget (2,000)
7. **Get Summary Again** → See updated spending

---

### Flow 2: Category Budgets

1. **Login**
2. **Create Yearly Category Budget** (Groceries: 60,000)
3. **Create Monthly Category Budget** (January Groceries: 5,000)
4. **Create Another Category Budget** (Entertainment: 24,000)
5. **Get All Budgets** → See all budgets
6. **Get Summary** → See both category summaries

---

### Flow 3: Validation Testing

1. **Create Yearly Budget** (2025-01-01 to 2025-12-31, 50,000)
2. **Try Invalid Date Range** → 2024-12-01 to 2024-12-31 ❌
3. **Create Valid Monthly** → 30,000 ✅
4. **Try Exceeding Amount** → 25,000 ❌ (only 20,000 remaining)
5. **Create Valid Amount** → 15,000 ✅
6. **Try Duplicate Dates** → ❌

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

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

---

## Notes

1. **JWT Token Expiry:** Tokens may expire. If you get 401 errors, login again to get a new token.

2. **Date Format:** Use ISO 8601 format for dates: `YYYY-MM-DD`

3. **Budget IDs:** Always use valid MongoDB ObjectIDs for budget operations

4. **User Isolation:** Users can only access their own budgets (enforced by authentication)

5. **Automatic Calculations:**
   - `savings` is automatically calculated as `budgetAmount - spent`
   - `totalSavings` aggregates all budget savings for the user

6. **Username Field:** Automatically populated from authenticated user

---

## Postman Collection Tips

### Setting Up Environment Variables

Create environment variables in Postman:

```
base_url = http://localhost:5000
token = (set after login)
budget_id = (set after creating budget)
```

### Pre-request Script for Token

Add this to collection pre-request script:
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token')
});
```

### Test Script Examples

**Save token after login:**
```javascript
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
});
```

**Save budget ID after creation:**
```javascript
pm.test("Budget created", function () {
    var jsonData = pm.response.json();
    pm.environment.set("budget_id", jsonData.budget._id);
});
```

---

## Support

For issues or questions, contact the development team.

**Last Updated:** October 10, 2025
