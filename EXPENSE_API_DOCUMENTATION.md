# Expense API Documentation

Complete guide for testing Expense Management APIs in Postman.

---

## 🔐 Authentication

All expense endpoints require JWT authentication. Include this header in all requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📚 Table of Contents

1. [Add Expense](#1-add-expense)
2. [Get All Expenses](#2-get-all-expenses)
3. [Filtering & Sorting](#filtering--sorting)
4. [Validation Examples](#validation-examples)
5. [Error Scenarios](#error-scenarios)
6. [Testing Examples](#testing-examples)

---

## 1. Add Expense

### Endpoint: `POST /api/user/expense`

**Description:** Create a new expense entry. The backend automatically associates the expense with the authenticated user.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2025-10-10",
  "category": "food",
  "amount": 200,
  "notes": "Lunch with friends"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | String (ISO) | ✅ Yes | Date of expense (YYYY-MM-DD or ISO string) |
| `category` | String | ✅ Yes | Expense category (e.g., "food", "transport") |
| `amount` | Number | ✅ Yes | Expense amount (must be >= 0) |
| `notes` | String | ❌ No | Additional notes or description |

**Success Response (201):**
```json
{
  "success": true,
  "expense": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "user": "68e560e46a0d9cb847fa080d",
    "date": "2025-10-10T00:00:00.000Z",
    "category": "food",
    "amount": 200,
    "notes": "Lunch with friends",
    "createdAt": "2025-10-10T12:30:00.000Z",
    "updatedAt": "2025-10-10T12:30:00.000Z"
  }
}
```

---

### Example Requests

#### Example 1: Basic Food Expense
```json
{
  "date": "2025-10-10",
  "category": "food",
  "amount": 250,
  "notes": "Dinner at restaurant"
}
```

#### Example 2: Transport Expense
```json
{
  "date": "2025-10-09",
  "category": "transport",
  "amount": 50,
  "notes": "Uber ride to office"
}
```

#### Example 3: Entertainment Expense (No Notes)
```json
{
  "date": "2025-10-08",
  "category": "entertainment",
  "amount": 500
}
```

#### Example 4: Shopping Expense
```json
{
  "date": "2025-10-07",
  "category": "shopping",
  "amount": 1500,
  "notes": "New shoes and shirt"
}
```

---

## 2. Get All Expenses

### Endpoint: `GET /api/user/expense`

**Description:** Retrieve expenses for the authenticated user with pagination, filtering, and sorting options.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Page number for pagination |
| `limit` | Number | 25 | Items per page (max: 200) |
| `category` | String | - | Filter by category |
| `from` | String (ISO) | - | Start date (inclusive) |
| `to` | String (ISO) | - | End date (inclusive) |
| `sortBy` | String | "-date" | Sort fields (comma-separated) |

---

### Example 1: Get All Expenses (Default)

**Request:**
```
GET /api/user/expense
```

**Response (200):**
```json
{
  "success": true,
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  },
  "expenses": [
    {
      "_id": "671d5e3f2a1b3c4d5e6f7890",
      "user": "68e560e46a0d9cb847fa080d",
      "date": "2025-10-10T00:00:00.000Z",
      "category": "food",
      "amount": 200,
      "notes": "Lunch with friends",
      "createdAt": "2025-10-10T12:30:00.000Z"
    },
    {
      "_id": "671d6a2e3b1c4d5e6f7g8901",
      "user": "68e560e46a0d9cb847fa080d",
      "date": "2025-10-09T00:00:00.000Z",
      "category": "transport",
      "amount": 50,
      "notes": "Taxi",
      "createdAt": "2025-10-09T08:15:00.000Z"
    }
  ]
}
```

---

### Example 2: Get Expenses with Pagination

**Request:**
```
GET /api/user/expense?page=2&limit=10
```

**Result:** Returns expenses 11-20

---

### Example 3: Filter by Category

**Request:**
```
GET /api/user/expense?category=food
```

**Result:** Returns only food expenses

---

### Example 4: Filter by Date Range

**Request:**
```
GET /api/user/expense?from=2025-10-01&to=2025-10-31
```

**Result:** Returns expenses from October 2025

---

### Example 5: Filter by Category and Date Range

**Request:**
```
GET /api/user/expense?category=transport&from=2025-10-01&to=2025-10-31
```

**Result:** Returns only transport expenses in October 2025

---

### Example 6: Sort by Amount (Highest First)

**Request:**
```
GET /api/user/expense?sortBy=-amount
```

**Result:** Returns expenses sorted by amount (highest to lowest)

---

### Example 7: Multiple Sort Fields

**Request:**
```
GET /api/user/expense?sortBy=category,-amount
```

**Result:** Sorts by category (A-Z), then by amount (highest to lowest) within each category

---

## Filtering & Sorting

### Sort Options

| Sort Field | Description |
|------------|-------------|
| `date` | Oldest first |
| `-date` | Newest first (default) |
| `amount` | Lowest first |
| `-amount` | Highest first |
| `category` | A-Z |
| `-category` | Z-A |

**Multiple sorts:** Separate with commas: `sortBy=category,-amount`

---

### Category Examples

Common expense categories:
- `food` - Meals, groceries, dining
- `transport` - Uber, taxi, gas, public transit
- `entertainment` - Movies, games, subscriptions
- `shopping` - Clothes, electronics, misc items
- `bills` - Utilities, rent, phone
- `health` - Medical, pharmacy, gym
- `education` - Books, courses, tuition
- `other` - Miscellaneous expenses

---

## Validation Examples

### ✅ Valid Expense

```json
{
  "date": "2025-10-10",
  "category": "food",
  "amount": 150,
  "notes": "Grocery shopping"
}
```

**Result:** ✅ Created successfully

---

### ✅ Valid Expense (No Notes)

```json
{
  "date": "2025-10-10",
  "category": "transport",
  "amount": 30
}
```

**Result:** ✅ Created successfully (notes optional)

---

### ✅ Valid Expense (Zero Amount)

```json
{
  "date": "2025-10-10",
  "category": "food",
  "amount": 0,
  "notes": "Free meal"
}
```

**Result:** ✅ Created successfully (amount can be 0)

---

## Error Scenarios

### Error 1: Missing Date

**Request:**
```json
{
  "category": "food",
  "amount": 100
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "date is required (ISO string)"
}
```

---

### Error 2: Invalid Date Format

**Request:**
```json
{
  "date": "invalid-date",
  "category": "food",
  "amount": 100
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "date must be a valid date"
}
```

---

### Error 3: Missing Category

**Request:**
```json
{
  "date": "2025-10-10",
  "amount": 100
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "category is required and must be a non-empty string"
}
```

---

### Error 4: Empty Category

**Request:**
```json
{
  "date": "2025-10-10",
  "category": "   ",
  "amount": 100
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "category is required and must be a non-empty string"
}
```

---

### Error 5: Missing Amount

**Request:**
```json
{
  "date": "2025-10-10",
  "category": "food"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "amount is required and must be a non-negative number"
}
```

---

### Error 6: Negative Amount

**Request:**
```json
{
  "date": "2025-10-10",
  "category": "food",
  "amount": -50
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "amount is required and must be a non-negative number"
}
```

---

### Error 7: Invalid Amount Type

**Request:**
```json
{
  "date": "2025-10-10",
  "category": "food",
  "amount": "not-a-number"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "amount is required and must be a non-negative number"
}
```

---

### Error 8: Unauthorized (No Token)

**Request:** No Authorization header

**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### Error 9: Invalid Date Range (Get Expenses)

**Request:**
```
GET /api/user/expense?from=invalid-date
```

**Response (400):**
```json
{
  "success": false,
  "message": "from must be a valid date"
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

#### Step 2: Add First Expense
```
POST /api/user/expense
Headers: Authorization: Bearer YOUR_TOKEN
Body:
{
  "date": "2025-10-01",
  "category": "food",
  "amount": 500,
  "notes": "Monthly groceries"
}
```

---

#### Step 3: Add More Expenses
```json
// Transport
{
  "date": "2025-10-02",
  "category": "transport",
  "amount": 150,
  "notes": "Gas"
}

// Entertainment
{
  "date": "2025-10-03",
  "category": "entertainment",
  "amount": 300,
  "notes": "Movie tickets"
}

// Shopping
{
  "date": "2025-10-04",
  "category": "shopping",
  "amount": 2000,
  "notes": "New phone"
}
```

---

#### Step 4: Get All Expenses
```
GET /api/user/expense
```

**Result:** See all your expenses

---

#### Step 5: Filter by Category
```
GET /api/user/expense?category=food
```

**Result:** See only food expenses

---

#### Step 6: Get October Expenses
```
GET /api/user/expense?from=2025-10-01&to=2025-10-31
```

**Result:** See all October expenses

---

#### Step 7: Get Highest Expenses First
```
GET /api/user/expense?sortBy=-amount&limit=5
```

**Result:** Top 5 highest expenses

---

## Use Cases

### 1. Daily Expense Tracking
Add expenses throughout the day:
```
POST /api/user/expense
```

---

### 2. Monthly Expense Report
Get all expenses for a month:
```
GET /api/user/expense?from=2025-10-01&to=2025-10-31
```

---

### 3. Category-wise Analysis
Get all food expenses:
```
GET /api/user/expense?category=food
```

---

### 4. Budget Monitoring
Get current month expenses:
```
GET /api/user/expense?from=2025-10-01&sortBy=-amount
```

---

### 5. Expense History
Get all expenses with pagination:
```
GET /api/user/expense?page=1&limit=50
```

---

## Response Fields

### Expense Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Unique expense ID |
| `user` | String | User ID (automatically set) |
| `date` | Date | Expense date |
| `category` | String | Expense category |
| `amount` | Number | Expense amount |
| `notes` | String | Additional notes (optional) |
| `createdAt` | Date | When expense was created |
| `updatedAt` | Date | Last update timestamp |

---

## Postman Tips

### Save Token as Environment Variable

**After login, add this test script:**
```javascript
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
});
```

---

### Auto-add Authorization Header

**Collection-level Pre-request Script:**
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token')
});
```

---

### Test Expense Creation

**Test Script:**
```javascript
pm.test("Expense created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.expense).to.have.property('_id');
    pm.environment.set("expense_id", jsonData.expense._id);
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
- **Get Budgets:** `GET /api/user/budget`

---

**Last Updated:** October 11, 2025
