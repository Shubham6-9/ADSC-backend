# Leaderboard API Documentation

Complete guide for testing Leaderboard APIs in Postman.

---

## 🏆 Overview

The leaderboard system ranks users based on their **XP (Experience Points)**. Users with the highest XP appear at the top, making the app competitive and engaging.

---

## 📚 Table of Contents

1. [Get Full Leaderboard](#1-get-full-leaderboard)
2. [Get My Rank](#2-get-my-rank)
3. [Get Top Users](#3-get-top-users)
4. [Use Cases](#use-cases)
5. [Testing Examples](#testing-examples)

---

## 1. Get Full Leaderboard

**Endpoint:** `GET /api/user/leaderboard`

**Description:** Returns paginated leaderboard with all users sorted by XP (highest first).

**Authentication:** Not required (public endpoint)

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | Number | 1 | - | Page number for pagination |
| `limit` | Number | 50 | 100 | Number of users per page |

**Example Request:**

```
GET http://localhost:5000/api/user/leaderboard?page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  },
  "leaderboard": [
    {
      "rank": 1,
      "username": "budgetpro",
      "xp": 5420,
      "level": 12,
      "country": "USA",
      "joinedAt": "2024-12-01T00:00:00.000Z"
    },
    {
      "rank": 2,
      "username": "savingsking",
      "xp": 4850,
      "level": 11,
      "country": "Canada",
      "joinedAt": "2024-11-15T00:00:00.000Z"
    },
    {
      "rank": 3,
      "username": "moneymaster",
      "xp": 4320,
      "level": 10,
      "country": "UK",
      "joinedAt": "2025-01-05T00:00:00.000Z"
    },
    {
      "rank": 4,
      "username": "frugalfox",
      "xp": 3900,
      "level": 9,
      "country": "India",
      "joinedAt": "2024-12-20T00:00:00.000Z"
    },
    {
      "rank": 5,
      "username": "smartspender",
      "xp": 3650,
      "level": 9,
      "country": "Australia",
      "joinedAt": "2025-01-10T00:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `rank` | Number | User's position on leaderboard |
| `username` | String | User's display name |
| `xp` | Number | User's total experience points |
| `level` | Number | User's current level |
| `country` | String | User's country |
| `joinedAt` | Date | When user registered |

---

## 2. Get My Rank

**Endpoint:** `GET /api/user/leaderboard/my-rank`

**Description:** Returns the authenticated user's rank on the leaderboard.

**Authentication:** ✅ Required

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example Request:**

```
GET http://localhost:5000/api/user/leaderboard/my-rank
```

**Success Response (200):**
```json
{
  "success": true,
  "myRank": {
    "rank": 47,
    "username": "johndoe",
    "xp": 2150,
    "level": 7,
    "country": "USA",
    "totalUsers": 150,
    "percentile": "68.67"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `rank` | Number | Your position on leaderboard |
| `username` | String | Your username |
| `xp` | Number | Your total XP |
| `level` | Number | Your current level |
| `country` | String | Your country |
| `totalUsers` | Number | Total users in system |
| `percentile` | String | Top X% of users (higher is better) |

**Percentile Explanation:**
- `100.00%` = Top 1% (rank 1)
- `90.00%` = Top 10%
- `50.00%` = Middle of the pack
- `10.00%` = Bottom 10%

---

## 3. Get Top Users

**Endpoint:** `GET /api/user/leaderboard/top`

**Description:** Returns top N users with highest XP.

**Authentication:** Not required (public endpoint)

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | Number | 10 | 50 | Number of top users to return |

**Example Request:**

```
GET http://localhost:5000/api/user/leaderboard/top?limit=5
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "leaderboard": [
    {
      "rank": 1,
      "username": "budgetpro",
      "xp": 5420,
      "level": 12,
      "country": "USA",
      "joinedAt": "2024-12-01T00:00:00.000Z"
    },
    {
      "rank": 2,
      "username": "savingsking",
      "xp": 4850,
      "level": 11,
      "country": "Canada",
      "joinedAt": "2024-11-15T00:00:00.000Z"
    },
    {
      "rank": 3,
      "username": "moneymaster",
      "xp": 4320,
      "level": 10,
      "country": "UK",
      "joinedAt": "2025-01-05T00:00:00.000Z"
    },
    {
      "rank": 4,
      "username": "frugalfox",
      "xp": 3900,
      "level": 9,
      "country": "India",
      "joinedAt": "2024-12-20T00:00:00.000Z"
    },
    {
      "rank": 5,
      "username": "smartspender",
      "xp": 3650,
      "level": 9,
      "country": "Australia",
      "joinedAt": "2025-01-10T00:00:00.000Z"
    }
  ]
}
```

---

## Use Cases

### 1. **Homepage/Dashboard Widget**
Display top 10 users to showcase leaderboard
```
GET /api/user/leaderboard/top?limit=10
```

### 2. **Full Leaderboard Page**
Show paginated full leaderboard with navigation
```
GET /api/user/leaderboard?page=1&limit=50
```

### 3. **User Profile - Show Rank**
Display user's current rank and percentile
```
GET /api/user/leaderboard/my-rank
```

### 4. **Hall of Fame**
Show all-time top 3 users
```
GET /api/user/leaderboard/top?limit=3
```

---

## Testing Examples

### Test Scenario 1: View Full Leaderboard

**Step 1:** Get first page
```
GET http://localhost:5000/api/user/leaderboard?page=1&limit=20
```

**Step 2:** Get second page
```
GET http://localhost:5000/api/user/leaderboard?page=2&limit=20
```

**Result:** See ranks 1-20 on page 1, ranks 21-40 on page 2

---

### Test Scenario 2: Check My Rank

**Step 1:** Login to get token
```
POST http://localhost:5000/api/user/auth/login
```

**Step 2:** Get your rank
```
GET http://localhost:5000/api/user/leaderboard/my-rank
Headers: Authorization: Bearer YOUR_TOKEN
```

**Result:** See your rank, XP, and percentile

---

### Test Scenario 3: Display Top Users

**Request:**
```
GET http://localhost:5000/api/user/leaderboard/top?limit=10
```

**Result:** Top 10 users by XP

---

## Ranking Logic

### Primary Sort: XP (Descending)
Users with more XP rank higher.

### Tiebreaker: Level (Descending)
If two users have the same XP, the one with higher level ranks higher.

**Example:**
- User A: 1000 XP, Level 5 → Rank 1
- User B: 1000 XP, Level 4 → Rank 2
- User C: 900 XP, Level 6 → Rank 3

---

## Error Scenarios

### Error 1: Invalid Page Number

**Request:**
```
GET /api/user/leaderboard?page=-1
```

**Response (200):**
```json
{
  "success": true,
  "meta": {
    "page": 1
  }
}
```
*Note: Negative pages default to 1*

---

### Error 2: Unauthorized (My Rank without token)

**Request:**
```
GET /api/user/leaderboard/my-rank
```
*No Authorization header*

**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### Error 3: Invalid Token

**Request:**
```
GET /api/user/leaderboard/my-rank
Headers: Authorization: Bearer INVALID_TOKEN
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

---

## UI/UX Suggestions

### Leaderboard Display

```
🏆 TOP PLAYERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#1  🥇 budgetpro        5420 XP  ⭐ Lvl 12
#2  🥈 savingsking      4850 XP  ⭐ Lvl 11
#3  🥉 moneymaster      4320 XP  ⭐ Lvl 10
#4      frugalfox        3900 XP  ⭐ Lvl 9
#5      smartspender     3650 XP  ⭐ Lvl 9
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Rank: #47 (Top 69%)
```

### Profile Badge

```
┌────────────────────┐
│  YOUR STATS        │
├────────────────────┤
│  Rank: #47         │
│  XP: 2150          │
│  Level: 7          │
│  Percentile: 69%   │
└────────────────────┘
```

---

## Integration with Gamification

Users earn XP by:
- ✅ Completing challenges
- ✅ Staying within budget
- ✅ Achieving savings goals
- ✅ Regular app usage

The leaderboard motivates users to:
- 🎯 Complete more challenges
- 💰 Improve budgeting habits
- 📈 Climb the ranks
- 🏆 Compete with others

---

## Performance Notes

1. **Caching:** Consider caching leaderboard for 5-10 minutes to reduce database load
2. **Indexing:** The system uses MongoDB indexes on `xp` and `level` fields for fast queries
3. **Pagination:** Always use pagination for full leaderboard to avoid performance issues
4. **Real-time Updates:** Leaderboard updates whenever users gain XP

---

## Postman Collection Tips

### Save Environment Variables

**After login:**
```javascript
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
});
```

### Test My Rank

**Pre-request Script:**
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

- **Add XP:** `POST /api/admin/users/:userId/add-xp`
- **User Profile:** `GET /api/user/profile`
- **Complete Challenge:** `POST /api/user/my-challenges/complete/:challengeId`

---

**Last Updated:** October 11, 2025
