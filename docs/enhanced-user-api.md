# Enhanced User Management API

This document describes the comprehensive user management API endpoints that support advanced features like collaboration settings, preferences, activity tracking, API key management, and social features.

## Base URL

```
/api/users
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## User Profile Management

### Get Current User Profile

**GET** `/profile`

Returns the complete user profile with all enhanced fields.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Software developer...",
    "timezone": "UTC",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "realTime": true,
        "collaborativEditing": true,
        "projectUpdates": true
      },
      "dashboard": {
        "layout": "grid",
        "defaultView": "projects",
        "showTutorials": false
      }
    },
    "collaborationSettings": {
      "allowRealTimeEditing": true,
      "showCursor": true,
      "sharePresence": true,
      "defaultProjectVisibility": "team"
    },
    "organization": {
      "name": "Tech Corp"
    },
    "projects": [...],
    "following": [...],
    "followers": [...],
    "teams": [...]
  }
}
```

### Update User Profile

**PUT** `/profile`

Updates basic profile information.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Updated bio...",
  "timezone": "America/New_York",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    /* updated user object */
  }
}
```

---

## User Preferences

### Update User Preferences

**PUT** `/preferences`

Updates user preferences for theme, language, notifications, and dashboard settings.

**Request Body:**

```json
{
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "realTime": false,
    "collaborativEditing": true,
    "projectUpdates": true
  },
  "dashboard": {
    "layout": "list",
    "defaultView": "analytics",
    "showTutorials": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    /* updated preferences object */
  }
}
```

---

## Collaboration Settings

### Update Collaboration Settings

**PUT** `/collaboration-settings`

Updates real-time collaboration preferences.

**Request Body:**

```json
{
  "allowRealTimeEditing": true,
  "showCursor": true,
  "sharePresence": false,
  "defaultProjectVisibility": "private"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Collaboration settings updated successfully",
  "data": {
    /* updated collaboration settings */
  }
}
```

---

## Activity Tracking

### Get User Activity

**GET** `/activity`

Returns user activity data and analytics.

**Response:**

```json
{
  "success": true,
  "data": {
    "lastLogin": "2024-01-15T10:30:00Z",
    "lastActivity": "2024-01-15T11:45:00Z",
    "loginHistory": [
      {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-15T10:30:00Z",
        "location": "New York, US"
      }
    ],
    "featureUsage": {
      "templatesCreated": 5,
      "projectsCreated": 12,
      "collaborativeSessions": 8,
      "lastTemplateUsed": "2024-01-15T09:00:00Z",
      "favoriteFeatures": ["templates", "collaboration"]
    },
    "accountAge": "2023-06-01T00:00:00Z",
    "isActive": true
  }
}
```

### Update Feature Usage

**POST** `/feature-usage`

Updates feature usage statistics (typically called internally by the system).

**Request Body:**

```json
{
  "feature": "templatesCreated",
  "action": "increment"
}
```

**Actions:**

- `increment`: Increase counter by 1
- `set`: Set specific value (requires `value` field)
- `add_favorite`: Add feature to favorites list

**Response:**

```json
{
  "success": true,
  "message": "Feature usage updated",
  "data": {
    /* updated feature usage object */
  }
}
```

---

## API Key Management

### Get API Keys

**GET** `/api-keys`

Returns user's API keys (without revealing actual key values).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 0,
      "name": "Production API",
      "permissions": ["read", "write"],
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUsed": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "keyPreview": "gsk_abc1..."
    }
  ]
}
```

### Create API Key

**POST** `/api-keys`

Creates a new API key.

**Request Body:**

```json
{
  "name": "Mobile App API",
  "permissions": ["read"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "name": "Mobile App API",
    "key": "gsk_abc123def456...", // Only returned once during creation
    "permissions": ["read"],
    "createdAt": "2024-01-15T12:00:00Z",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### Delete API Key

**DELETE** `/api-keys/:keyId`

Deletes an API key by its index.

**Response:**

```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

## Social Features

### Follow/Unfollow User

**POST** `/follow/:userId`

Toggles follow status for another user.

**Response:**

```json
{
  "success": true,
  "message": "User followed", // or "User unfollowed"
  "data": {
    "isFollowing": true,
    "followingCount": 15,
    "followersCount": 23
  }
}
```

### Get Social Connections

**GET** `/social`

Returns user's social connections and stats.

**Response:**

```json
{
  "success": true,
  "data": {
    "following": [
      {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "avatar": "https://example.com/jane.jpg",
        "featureUsage": {
          "projectsCreated": 8
        }
      }
    ],
    "followers": [...],
    "teams": [...],
    "stats": {
      "followingCount": 15,
      "followersCount": 23,
      "teamsCount": 3
    }
  }
}
```

---

## User Discovery

### Get Active Users

**GET** `/active-users?hours=24`

Returns recently active users.

**Query Parameters:**

- `hours` (optional): Time window in hours (default: 24)

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "avatar": "https://example.com/john.jpg",
        "lastActivity": "2024-01-15T11:30:00Z",
        "featureUsage": {
          "collaborativeSessions": 5
        }
      }
    ],
    "timeframe": "24 hours",
    "count": 12
  }
}
```

### Search Users

**GET** `/search?q=john&limit=20`

Searches for users by name or email.

**Query Parameters:**

- `q` (required): Search term
- `limit` (optional): Maximum results (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "avatar": "https://example.com/john.jpg",
      "bio": "Frontend developer...",
      "featureUsage": {
        "projectsCreated": 12
      }
    }
  ]
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (user/resource not found)
- `500`: Internal Server Error

---

## Validation Rules

### Profile Update

- `firstName`: 1-50 characters
- `lastName`: 1-50 characters
- `bio`: Max 500 characters
- `avatar`: Valid URL format

### Preferences

- `theme`: One of "light", "dark", "auto"
- `language`: String (language code)
- `notifications`: Object with boolean values
- `dashboard`: Object with valid enum values

### Collaboration Settings

- `allowRealTimeEditing`: Boolean
- `showCursor`: Boolean
- `sharePresence`: Boolean
- `defaultProjectVisibility`: One of "private", "team", "organization"

### API Keys

- `name`: 1-100 characters
- `permissions`: Array of strings
- `expiresAt`: Valid ISO 8601 date string

### Feature Usage

- `feature`: One of "templatesCreated", "projectsCreated", "collaborativeSessions"
- `action`: One of "increment", "set", "add_favorite"
- `value`: Number (required for "set" action)

---

## Usage Examples

### JavaScript/Frontend Integration

```javascript
// Update user preferences
const updatePreferences = async (preferences) => {
  const response = await fetch("/api/users/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });
  return response.json();
};

// Create API key
const createAPIKey = async (keyData) => {
  const response = await fetch("/api/users/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(keyData),
  });
  return response.json();
};

// Follow a user
const followUser = async (userId) => {
  const response = await fetch(`/api/users/follow/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### cURL Examples

```bash
# Get user profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/users/profile

# Update preferences
curl -X PUT \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"theme":"dark","language":"en"}' \
     http://localhost:5000/api/users/preferences

# Create API key
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name":"Test API","permissions":["read"]}' \
     http://localhost:5000/api/users/api-keys
```
