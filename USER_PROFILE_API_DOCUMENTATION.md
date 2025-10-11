# User Profile API Documentation

Complete guide for testing User Profile Update API in Postman.

---

## 🔐 Authentication Required

This endpoint requires JWT authentication. Include this header in the request:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Update User Profile

### Endpoint: `PUT /api/user/profile`

Update the authenticated user's username and/or email. The updated credentials can be used immediately for login.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

### Example 1: Update Both Username and Email

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully. You can now login with your new credentials.",
  "user": {
    "id": "68e560e46a0d9cb847fa080d",
    "username": "newusername",
    "email": "newemail@example.com",
    "country": "USA",
    "currency": "USD",
    "currencySymbol": "$",
    "level": 5,
    "xp": 450
  }
}
```

---

### Example 2: Update Only Username

**Request Body:**
```json
{
  "username": "cooldude123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully. You can now login with your new credentials.",
  "user": {
    "id": "68e560e46a0d9cb847fa080d",
    "username": "cooldude123",
    "email": "john@example.com",
    "country": "USA",
    "currency": "USD",
    "currencySymbol": "$",
    "level": 5,
    "xp": 450
  }
}
```

---

### Example 3: Update Only Email

**Request Body:**
```json
{
  "email": "johnsmith@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully. You can now login with your new credentials.",
  "user": {
    "id": "68e560e46a0d9cb847fa080d",
    "username": "johndoe",
    "email": "johnsmith@example.com",
    "country": "USA",
    "currency": "USD",
    "currencySymbol": "$",
    "level": 5,
    "xp": 450
  }
}
```

---

## Validation Rules

### Username:
- ✅ Must be at least 3 characters long
- ✅ Cannot be empty or whitespace only
- ✅ Must be unique (not already taken by another user)
- ✅ Cannot be the same as current username (no changes)

### Email:
- ✅ Must be a valid email format (name@domain.com)
- ✅ Must be unique (not already registered by another user)
- ✅ Cannot be the same as current email (no changes)
- ✅ Automatically converted to lowercase

---

## Error Scenarios

### Error 1: No Fields Provided

**Request:**
```json
{}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Please provide at least one field to update (username or email)"
}
```

---

### Error 2: Username Too Short

**Request:**
```json
{
  "username": "ab"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Username must be at least 3 characters long"
}
```

---

### Error 3: Invalid Email Format

**Request:**
```json
{
  "email": "invalidemail"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

---

### Error 4: Username Already Taken

**Request:**
```json
{
  "username": "existinguser"
}
```

**Response (409):**
```json
{
  "success": false,
  "message": "Username already taken"
}
```

---

### Error 5: Email Already Registered

**Request:**
```json
{
  "email": "existing@example.com"
}
```

**Response (409):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### Error 6: No Changes Detected

**Request:** (Sending same username/email as current)
```json
{
  "username": "johndoe",
  "email": "john@example.com"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "No changes detected. Username and email are the same as current values."
}
```

---

### Error 7: Unauthorized (No Token)

**Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### Error 8: Invalid or Expired Token

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

---

## Complete Test Flow

### Step 1: Login with Original Credentials

**POST** `http://localhost:5000/api/user/auth/login`

```json
{
  "emailOrUsername": "johndoe",
  "password": "John@123"
}
```

**Copy the token** from the response.

---

### Step 2: Update Profile

**PUT** `http://localhost:5000/api/user/profile`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "username": "johnsmith",
  "email": "johnsmith@example.com"
}
```

---

### Step 3: Login with New Credentials

**POST** `http://localhost:5000/api/user/auth/login`

```json
{
  "emailOrUsername": "johnsmith",
  "password": "John@123"
}
```

✅ **Success!** You can now login with the new username.

---

**Or login with new email:**

```json
{
  "emailOrUsername": "johnsmith@example.com",
  "password": "John@123"
}
```

✅ **Success!** You can also login with the new email.

---

## Important Notes

1. **Password Remains Unchanged:** This endpoint only updates username and email. Password stays the same.

2. **Immediate Effect:** Updated credentials can be used for login immediately.

3. **Username or Email Login:** You can login with either the username or email (both work).

4. **Case Insensitive Email:** Email is automatically converted to lowercase for consistency.

5. **Token Remains Valid:** Your current JWT token remains valid even after updating profile. You don't need to login again immediately.

6. **Unique Constraints:** Username and email must be unique across all users in the system.

---

## Get Current User Profile

To check your current profile details, you can use the login response or create a dedicated GET endpoint.

**Current Profile Information Available in Login Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": "68e560e46a0d9cb847fa080d",
    "email": "john@example.com",
    "username": "johndoe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Postman Tips

### Save Token as Environment Variable

After login, save the token:

**Test Script:**
```javascript
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    pm.environment.set("user_id", jsonData.user.id);
});
```

### Use Token in Subsequent Requests

**Pre-request Script (Collection Level):**
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

- **Signup:** `POST /api/user/auth/signup`
- **Login:** `POST /api/user/auth/login`
- **Admin Login:** `POST /api/admin/login`

---

**Last Updated:** October 10, 2025
