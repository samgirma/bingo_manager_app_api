# Bingo Manager API

Base URL: `http://localhost:3000`
Content-Type: `application/json`
Rate Limit: 100 req / 15 min per IP on `/api/*`

---

## `GET /health`

Health check — no auth required.

**Response `200`**

```json
{
  "status": "OK",
  "timestamp": "2026-05-28T12:00:00.000Z",
  "uptime": 123.45
}
```

---

# Auth

## `POST /api/auth/login`

**Body**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| username | string | yes      |            |
| password | string | yes      |            |

**Response `200`**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@bingo.com",
    "role": "ADMIN",
    "profile_pic_url": null,
    "isBanned": false,
    "createdAt": "2026-05-28T10:00:00.000Z"
  }
}
```

**Errors:** `400` missing fields, `401` invalid username/password, `403` banned.

---

## `POST /api/auth/logout`

**Auth:** JWT

Invalidates the current session token.

**Response `200`**

```json
{ "success": true, "message": "Logged out successfully" }
```

---

## `GET /api/auth/me`

**Auth:** JWT

Returns the authenticated user's profile from the DB.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@bingo.com",
    "role": "ADMIN",
    "profile_pic_url": null,
    "isBanned": false,
    "createdAt": "2026-05-28T10:00:00.000Z"
  }
}
```

---

# Password Reset

## `POST /api/auth/forgot-password`

Sends a 6-digit OTP to the given email via Brevo SMTP.

**Body**

| Field | Type   | Required |
|-------|--------|----------|
| email | string | yes      |

**Response `200`**

```json
{ "success": true, "message": "OTP sent to your email" }
```

**Errors:** `404` no account with that email, `500` email send failure.

---

## `POST /api/auth/verify-otp`

Validates the OTP (must be unused and not expired — 10 min window).

**Body**

| Field | Type   | Required |
|-------|--------|----------|
| email | string | yes      |
| otp   | string | yes      |

**Response `200`**

```json
{ "success": true, "message": "OTP verified successfully" }
```

**Errors:** `400` invalid or expired OTP.

---

## `POST /api/auth/reset-password`

Resets the password after OTP verification.

**Body**

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| email      | string | yes      |             |
| otp        | string | yes      |             |
| newPassword| string | yes      | min 6 chars |

**Response `200`**

```json
{ "success": true, "message": "Password reset successfully" }
```

**Errors:** `400` invalid/expired OTP, weak password.

---

# Users

## `PUT /api/users/profile`

**Auth:** JWT

**Body** (all optional — only provided fields are updated)

| Field           | Type   | Description |
|-----------------|--------|-------------|
| full_name       | string |             |
| email           | string |             |
| password        | string | min 6 chars (bcrypt hashed) |
| profile_pic_url | string | URL (or use POST /api/upload/profile-pic for file upload) |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "username": "admin",
    "full_name": "Updated Name",
    "email": "admin@bingo.com",
    "role": "ADMIN",
    "profile_pic_url": null,
    "isBanned": false
  }
}
```

---

# Upload

## `POST /api/upload/profile-pic`

**Auth:** JWT

**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | file | yes | JPEG/PNG, max 5 MB |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "profile_pic_url": "https://res.cloudinary.com/dk3iqdf6b/image/upload/v1/...",
    "width": 400,
    "height": 400
  }
}
```

The image is uploaded to Cloudinary under the `profile_pics` folder, auto-resized to 400x400 with face-detection crop. The old image is deleted from Cloudinary when a new one is uploaded.

**Errors:** `400` no file / invalid type, `413` file too large (>5 MB).

---

# Operators

All endpoints require `ADMIN` role.

## `GET /api/operators`

**Auth:** JWT, ADMIN

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "username": "operator1",
      "full_name": "John Operator",
      "email": "john@bingo.com",
      "role": "OPERATOR",
      "profile_pic_url": null,
      "isBanned": false,
      "createdAt": "2026-05-28T10:00:00.000Z"
    }
  ]
}
```

---

## `POST /api/operators`

**Auth:** JWT, ADMIN

**Body**

| Field           | Type   | Required | Description |
|----------------|--------|----------|-------------|
| username       | string | yes      | Unique      |
| full_name      | string | yes      |             |
| email          | string | yes      |             |
| password       | string | yes      |             |
| profile_pic_url| string | no       |             |

**Response `201`**

```json
{
  "success": true,
  "data": {
    "username": "operator2",
    "full_name": "Jane Operator",
    "email": "jane@bingo.com",
    "role": "OPERATOR",
    "profile_pic_url": null,
    "isBanned": false
  }
}
```

**Errors:** `400` missing fields, `409` username exists.

---

## `PUT /api/operators/:username/ban`

**Auth:** JWT, ADMIN

Toggles the ban status. When banned, all active sessions for that operator are invalidated immediately.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "username": "operator1",
    "full_name": "John Operator",
    "email": "john@bingo.com",
    "role": "OPERATOR",
    "isBanned": true
  }
}
```

**Errors:** `404` operator not found.

---

## `PUT /api/operators/:username/reset-password`

**Auth:** JWT, ADMIN

**Body**

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| newPassword | string | yes      | min 6 chars |

**Response `200`**

```json
{ "success": true, "data": true }
```

**Errors:** `400` password too short, `404` operator not found.

---

## `DELETE /api/operators/:username`

**Auth:** JWT, ADMIN

Hard-deletes the operator and invalidates all their active sessions.

**Response `200`**

```json
{ "success": true, "data": true }
```

**Errors:** `404` operator not found.

---

# Bingo Centers

## `GET /api/bingo-centers`

**Auth:** JWT

**Query params**

| Param      | Type   | Description |
|-----------|--------|-------------|
| createdBy | string | Filter by creator username |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "userID": 1,
      "full_name": "Sami Bingo",
      "username": "sami_bingo",
      "balance": 5000.00,
      "mac_address": "00:1A:2B:3C:4D:5E",
      "createdBy": "operator1",
      "createdAt": "2026-05-28T10:00:00.000Z"
    }
  ]
}
```

---

## `POST /api/bingo-centers`

**Auth:** JWT, OPERATOR or ADMIN

**Body**

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| full_name  | string | yes      | e.g. "Sami Bingo" |
| username   | string | yes      | Unique      |
| mac_address| string | yes      | Unique, XX:XX:XX:XX:XX:XX |
| balance    | number | yes      | Starting balance, must be >= 0 |
| actualAmount | number | yes    | Actual paid amount, must be >= 0 |
| createdBy  | string | no       | Defaults to "system" |

**Response `201`**

```json
{
  "success": true,
  "data": {
    "userID": 3,
    "full_name": "Sami Bingo",
    "username": "sami_bingo",
    "balance": 1000,
    "mac_address": "00:1A:2B:3C:4D:60",
    "createdBy": "operator1",
    "createdAt": "2026-05-28T12:00:00.000Z"
  }
}
```

A `recharge_history` record is also created automatically with `generated_amount = balance` and `actual_amount = actualAmount`.

**Errors:** `400` missing fields / negative balance, `409` duplicate username or MAC address.

---

## `POST /api/bingo-centers/recharge`

**Auth:** JWT, OPERATOR or ADMIN

**Body**

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| bingoCenterUsername| string | yes      |             |
| generatedAmount    | number | yes      | Must be > 0  |
| actualAmount       | number | yes      | Must be >= 0 |
| debitedBy          | string | yes      | Username of operator/admin |

**Response `201`**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "actualAmount": 1000,
    "generatedAmount": 1200,
    "bingoCenterUsername": "bingo_center_001",
    "debitedBy": "operator1",
    "timestamp": "2026-05-28T12:00:00.000Z"
  },
  "encryptedFile": {
    "fileName": "topup_bingo_center_001_1716892800000.enc",
    "iv": "b2c3d4e5f67890a1b2c3d4e5f67890a1",
    "ciphertext": "eyJiaW5nb0NlbnRlciI6...",
    "keyFingerprint": "5678efgh",
    "format": "AES-256-CBC",
    "timestamp": "2026-05-28T12:00:00.000Z",
    "fileContent": "---BEGIN ENCRYPTED TERMINAL FILE---\n..."
  }
}
```

**Errors:** `400` missing fields / invalid amounts, `404` center not found.

---

# Transactions

## `GET /api/transactions`

**Auth:** JWT

**Query params**

| Param     | Type   | Description |
|-----------|--------|-------------|
| debitedBy | string | Filter by who initiated the recharge |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "actualAmount": 1000.00,
      "generatedAmount": 1200.00,
      "bingoCenterUsername": "bingo_center_001",
      "debitedBy": "operator1",
      "timestamp": "2026-05-28T10:00:00.000Z"
    }
  ]
}
```

---

# Analytics

## `GET /api/analytics`

**Auth:** JWT

**Response `200`**

```json
{
  "success": true,
  "data": {
    "totalBalance": 8200.50,
    "activeCenters": 2,
    "todayGeneratedTopups": 1800.00
  }
}
```

| Field              | Type   | Description |
|--------------------|--------|-------------|
| totalBalance       | number | Sum of all bingo center balances |
| activeCenters      | number | Total count of bingo centers |
| todayGeneratedTopups | number | Sum of `generated_amount` since midnight UTC |

---

# Error Response Format

All error responses follow this shape:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| HTTP | Common causes |
|------|--------------|
| 400  | Missing or invalid request body fields |
| 401  | Missing/invalid/expired JWT, or session invalidated |
| 403  | Insufficient role, or account banned |
| 404  | Resource not found (operator, center) |
| 409  | Duplicate username |
| 429  | Rate limit exceeded |
| 500  | Internal server error |

---

# Encrypted File Envelope

Both `POST /api/bingo-centers` and `POST /api/bingo-centers/recharge` return an `encryptedFile` field. This matches the legacy PHP backend format:

| Field           | Description |
|----------------|-------------|
| fileName       | `user_{username}_{timestamp}.enc` or `topup_{username}_{timestamp}.enc` |
| iv             | 32-char random hex (simulating AES-256-CBC IV) |
| ciphertext     | Base64 of JSON payload |
| keyFingerprint | 8-char Jenkins hash of the truncated 32-char key |
| format         | Always `AES-256-CBC` |
| timestamp      | ISO 8601 generation time |
| fileContent    | Full `.enc` envelope string (ready for download) |

Key truncation rule (32 chars):
- **User file key:** `"This_secrate_key_for_encription_2026_for_user_generation"` → `"This_secrate_key_for_encription_"`
- **Top-up file key:** `"This_secrate_key_for_encription_2026"` → `"This_secrate_key_for_encription_"`
