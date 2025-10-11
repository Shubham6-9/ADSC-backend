# 📋 Complete API Summary

## Goals API Endpoints

### 1. Create Goal
- **Endpoint:** `POST /api/user/goals`
- **Auth:** Required
- **Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "targetAmount": "number (required, > 0)",
  "targetDate": "ISO date string (optional)",
  "priority": "low|medium|high (optional, default: medium)",
  "category": "string (optional, default: General)",
  "savedAmount": "number (optional, >= 0, default: 0)"
}
```

### 2. Get All Goals
- **Endpoint:** `GET /api/user/goals`
- **Auth:** Required
- **Query Params:**
  - `status` - active|achieved|all (default: active)
  - `page` - number (default: 1)
  - `limit` - number (default: 20, max: 200)
  - `sortBy` - field names (e.g., "-createdAt", "progress")
  - `category` - string filter
  - `priority` - low|medium|high filter
  - `q` - search in title

### 3. Get Single Goal
- **Endpoint:** `GET /api/user/goals/:id`
- **Auth:** Required

### 4. Update Goal (Add Savings) ✨ NEW
- **Endpoint:** `PATCH /api/user/goals/:id`
- **Auth:** Required
- **Body:**
```json
{
  "savedAmount": "number (required, >= 0)"
}
```
- **Auto-achieves goal** when savedAmount >= targetAmount

### 5. Get Total Savings ✨ NEW
- **Endpoint:** `GET /api/user/goals/summary/total-savings`
- **Auth:** Required
- **Returns:**
  - Total savings from goals
  - Total savings from budgets
  - Combined total
  - Breakdown by goal category

---

## Budget API Endpoints

### 1. Create Budget
- **Endpoint:** `POST /api/user/budget`
- **Auth:** Required

### 2. Get All Budgets
- **Endpoint:** `GET /api/user/budget`
- **Auth:** Required

### 3. Get Active Budgets
- **Endpoint:** `GET /api/user/budget/active`
- **Auth:** Required
- Returns only budgets where current date is between startDate and endDate

### 4. Get Single Budget
- **Endpoint:** `GET /api/user/budget/:id`
- **Auth:** Required

### 5. Update Budget Spent
- **Endpoint:** `PATCH /api/user/budget/:id/spent`
- **Auth:** Required
- **Body:**
```json
{
  "amountSpent": "number (required)"
}
```

### 6. Get Budget Summary
- **Endpoint:** `GET /api/user/budget/summary`
- **Auth:** Required

---

## Expense API Endpoints

### 1. Add Expense
- **Endpoint:** `POST /api/user/expense`
- **Auth:** Required
- **Body:**
```json
{
  "date": "ISO date string (required)",
  "category": "string (required)",
  "amount": "number (required, >= 0)",
  "notes": "string (optional)"
}
```

### 2. Get All Expenses
- **Endpoint:** `GET /api/user/expense`
- **Auth:** Required
- **Query Params:**
  - `page` - number
  - `limit` - number (max: 200)
  - `category` - string filter
  - `from` - ISO date (start date)
  - `to` - ISO date (end date)
  - `sortBy` - field names (default: "-date")

---

## User & Leaderboard API Endpoints

### 1. Signup
- **Endpoint:** `POST /api/user/auth/signup`
- **Body:**
```json
{
  "email": "string",
  "username": "string",
  "password": "string",
  "country": "string",
  "currency": "string",
  "currencySymbol": "string"
}
```

### 2. Login
- **Endpoint:** `POST /api/user/auth/login`
- **Body:**
```json
{
  "emailOrUsername": "string",
  "password": "string"
}
```

### 3. Get Leaderboard
- **Endpoint:** `GET /api/user/leaderboard`
- **Auth:** Required

### 4. Get My Rank
- **Endpoint:** `GET /api/user/leaderboard/my-rank`
- **Auth:** Required

---

## 🎯 New Features Implemented

### ✅ Manual Savings Addition
- Frontend: "Add Savings" button on each goal card
- Backend: `PATCH /api/user/goals/:id` endpoint
- Features:
  - Update saved amount
  - Auto-achievement when target reached
  - Real-time progress calculation

### ✅ Total Savings Summary
- Frontend: Available for dashboard integration
- Backend: `GET /api/user/goals/summary/total-savings` endpoint
- Features:
  - Combined savings from goals and budgets
  - Category-wise breakdown
  - Analytics ready

### ✅ Budget Expiry Prompt
- Frontend: Auto-prompt when budget expires with savings
- Features:
  - Allocate to specific goal
  - Keep as general savings
  - One-time prompt per budget

---

## 📝 Notes

1. All endpoints require JWT authentication via `Authorization: Bearer TOKEN` header
2. User context is automatically extracted from JWT token
3. All amounts are in the user's selected currency
4. Dates should be in ISO 8601 format
5. Progress is automatically calculated: `(savedAmount / targetAmount) * 100`
6. Goals are auto-marked as achieved when `savedAmount >= targetAmount`
