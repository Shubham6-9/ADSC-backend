# Level Configuration API Documentation

Complete guide for testing Level Management APIs in Postman.

---

## 🔐 Authentication (Admin Only)

These endpoints are for admin use. Include admin authentication if required.

---

## Level Management Endpoints

### 1. Get All Levels

**Endpoint:** `GET /api/admin/levels`

Retrieves all level configurations sorted by level number.

**Headers:**
```
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "levels": [
    {
      "_id": "671d5e3f2a1b3c4d5e6f7890",
      "level": 1,
      "levelName": "Beginner",
      "xpRequired": 100,
      "levelReward": "Welcome Badge",
      "levelBadge": "https://example.com/badges/beginner.png",
      "createdAt": "2025-10-10T10:00:00.000Z",
      "updatedAt": "2025-10-10T10:00:00.000Z"
    },
    {
      "_id": "671d6a8b3d2e4f5g6h7i8901",
      "level": 2,
      "levelName": "Novice",
      "xpRequired": 250,
      "levelReward": "10 Bonus Points",
      "levelBadge": "https://example.com/badges/novice.png",
      "createdAt": "2025-10-10T10:05:00.000Z",
      "updatedAt": "2025-10-10T10:05:00.000Z"
    }
  ]
}
```

---

### 2. Create or Update Level

**Endpoint:** `POST /api/admin/levels`

Creates a new level or updates an existing one (upsert). Automatically syncs existing users' xpForNextLevel.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "level": 1,
  "levelName": "Beginner",
  "xpRequired": 100,
  "levelReward": "Welcome Badge",
  "levelBadge": "https://example.com/badges/beginner.png",
  "syncExisting": true
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | Number | ✅ Yes | Level number (integer >= 1, unique) |
| `levelName` | String | ✅ Yes | Name of the level (e.g., "Beginner", "Pro") |
| `xpRequired` | Number | ✅ Yes | XP required to reach this level (>= 1) |
| `levelReward` | String | ❌ No | Reward for reaching this level (optional) |
| `levelBadge` | String | ✅ Yes | Badge identifier or URL for this level |
| `syncExisting` | Boolean | ❌ No | Auto-sync existing users (default: true) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Level saved and users synced",
  "levelConfig": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "level": 1,
    "levelName": "Beginner",
    "xpRequired": 100,
    "levelReward": "Welcome Badge",
    "levelBadge": "https://example.com/badges/beginner.png",
    "createdAt": "2025-10-10T10:00:00.000Z",
    "updatedAt": "2025-10-10T10:00:00.000Z"
  },
  "syncResult": {
    "usersUpdated": 5
  },
  "reevalResult": {
    "usersLeveledUp": 2
  }
}
```

---

### 3. Delete Level

**Endpoint:** `DELETE /api/admin/levels/{level}`

Deletes a level configuration by level number.

**Example:** `DELETE /api/admin/levels/5`

**Headers:**
```
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Level deleted",
  "deleted": {
    "_id": "671d5e3f2a1b3c4d5e6f7890",
    "level": 5,
    "levelName": "Expert",
    "xpRequired": 1000,
    "levelReward": "Expert Badge",
    "levelBadge": "https://example.com/badges/expert.png"
  }
}
```

---

## Example Level Configurations

### Example 1: Basic Level (No Reward)

```json
{
  "level": 1,
  "levelName": "Newbie",
  "xpRequired": 50,
  "levelBadge": "🌱",
  "syncExisting": true
}
```

---

### Example 2: Level with Reward

```json
{
  "level": 5,
  "levelName": "Advanced",
  "xpRequired": 500,
  "levelReward": "50 Bonus Coins",
  "levelBadge": "⭐",
  "syncExisting": true
}
```

---

### Example 3: High-Level Achievement

```json
{
  "level": 10,
  "levelName": "Master",
  "xpRequired": 2000,
  "levelReward": "Exclusive Avatar + 100 Coins",
  "levelBadge": "https://cdn.example.com/badges/master-gold.png",
  "syncExisting": true
}
```

---

## Validation Rules

### Level:
- ✅ Must be an integer
- ✅ Must be >= 1
- ✅ Must be unique (cannot have duplicate level numbers)

### Level Name:
- ✅ Must be a non-empty string
- ✅ Automatically trimmed of whitespace
- ✅ Required field

### XP Required:
- ✅ Must be a number
- ✅ Must be >= 1
- ✅ Required field

### Level Reward:
- ✅ Optional field
- ✅ Can be any string (e.g., "100 Coins", "Special Badge")
- ✅ Defaults to empty string if not provided

### Level Badge:
- ✅ Must be a non-empty string
- ✅ Can be emoji, URL, or identifier
- ✅ Required field

---

## Error Scenarios

### Error 1: Missing Required Field (levelName)

**Request:**
```json
{
  "level": 1,
  "xpRequired": 100,
  "levelBadge": "🌟"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "levelName is required and must be a non-empty string"
}
```

---

### Error 2: Invalid Level Number

**Request:**
```json
{
  "level": -1,
  "levelName": "Invalid",
  "xpRequired": 100,
  "levelBadge": "🌟"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "level must be an integer >= 1"
}
```

---

### Error 3: Invalid XP Required

**Request:**
```json
{
  "level": 1,
  "levelName": "Beginner",
  "xpRequired": 0,
  "levelBadge": "🌟"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "xpRequired must be a number >= 1"
}
```

---

### Error 4: Missing Level Badge

**Request:**
```json
{
  "level": 1,
  "levelName": "Beginner",
  "xpRequired": 100
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "levelBadge is required and must be a non-empty string"
}
```

---

### Error 5: Duplicate Level

**Request:** Creating a level that already exists (same level number)

**Response (409):**
```json
{
  "success": false,
  "message": "Level already exists (conflict)."
}
```

---

### Error 6: Level Not Found (Delete)

**Request:** `DELETE /api/admin/levels/999`

**Response (404):**
```json
{
  "success": false,
  "message": "Level not found"
}
```

---

## Complete Test Flow

### Step 1: Create Level 1

**POST** `http://localhost:5000/api/admin/levels`

```json
{
  "level": 1,
  "levelName": "Beginner",
  "xpRequired": 100,
  "levelReward": "Welcome Badge",
  "levelBadge": "🌱",
  "syncExisting": true
}
```

**Result:** Level 1 created ✅

---

### Step 2: Create Level 2

**POST** `http://localhost:5000/api/admin/levels`

```json
{
  "level": 2,
  "levelName": "Novice",
  "xpRequired": 250,
  "levelReward": "10 Bonus Points",
  "levelBadge": "⭐",
  "syncExisting": true
}
```

**Result:** Level 2 created ✅

---

### Step 3: Create Level 3 (No Reward)

**POST** `http://localhost:5000/api/admin/levels`

```json
{
  "level": 3,
  "levelName": "Intermediate",
  "xpRequired": 500,
  "levelBadge": "🔥",
  "syncExisting": true
}
```

**Result:** Level 3 created without reward ✅

---

### Step 4: Update Level 1 (Change Reward)

**POST** `http://localhost:5000/api/admin/levels`

```json
{
  "level": 1,
  "levelName": "Beginner",
  "xpRequired": 100,
  "levelReward": "New Welcome Bonus + 50 Coins",
  "levelBadge": "🌱",
  "syncExisting": true
}
```

**Result:** Level 1 updated ✅

---

### Step 5: Get All Levels

**GET** `http://localhost:5000/api/admin/levels`

**Result:** See all 3 levels ✅

---

### Step 6: Delete Level 3

**DELETE** `http://localhost:5000/api/admin/levels/3`

**Result:** Level 3 deleted ✅

---

## Level Badge Examples

### Using Emojis:
```
"🌱" - Beginner
"⭐" - Novice
"🔥" - Intermediate
"💎" - Advanced
"👑" - Expert
"🏆" - Master
```

### Using URLs:
```
"https://cdn.example.com/badges/level1.png"
"https://example.com/assets/bronze-badge.svg"
"https://storage.example.com/badges/gold-star.webp"
```

### Using Identifiers:
```
"badge_bronze"
"badge_silver"
"badge_gold"
"level_1_beginner"
```

---

## Important Notes

1. **Level Numbers Must Be Unique:** You cannot have two configurations with the same level number.

2. **Upsert Behavior:** Using POST will create a new level if it doesn't exist, or update it if it does.

3. **Auto-Sync Users:** When `syncExisting: true`, the system automatically:
   - Updates `xpForNextLevel` for users at (level - 1)
   - Re-evaluates users who may now qualify for level-up

4. **Level Reward is Optional:** You can create levels without rewards. Users will still progress through them.

5. **Level Badge is Required:** Every level must have a badge for visual representation.

6. **Delete Carefully:** Deleting a level doesn't automatically adjust users. Admin should handle user adjustments separately.

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

## Postman Collection Tips

### Save Variables

**After creating a level, save its ID:**
```javascript
pm.test("Level created", function () {
    var jsonData = pm.response.json();
    pm.environment.set("level_id", jsonData.levelConfig._id);
    pm.environment.set("level_number", jsonData.levelConfig.level);
});
```

---

**Last Updated:** October 10, 2025
