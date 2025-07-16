# API Specification

## Base URL
```
Production: https://api.genstack.io
Development: http://localhost:5000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {...}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "organization": "Company Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "developer"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /api/auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "developer",
      "organization": "org_id"
    },
    "token": "jwt_token_here"
  }
}
```

### GET /api/auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "developer",
    "organization": "org_id",
    "permissions": ["read_nodes", "write_nodes", "delete_nodes"]
  }
}
```

## Node Endpoints

### GET /api/nodes
Get all nodes for a project or user.

**Query Parameters:**
- `project` (optional): Filter by project ID
- `type` (optional): Filter by node type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node_id",
        "name": "API Endpoint Node",
        "type": "api",
        "template": "const handler = (req, res) => { ... }",
        "properties": {
          "method": "GET",
          "path": "/api/users"
        },
        "validations": [
          {
            "field": "path",
            "rule": "required",
            "message": "Path is required"
          }
        ],
        "metadata": {
          "category": "backend",
          "description": "Creates a REST API endpoint",
          "version": "1.0.0"
        },
        "projectId": "project_id",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### POST /api/nodes
Create a new node.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Custom Node",
  "type": "react",
  "template": "import React from 'react';\n\nconst {{componentName}} = () => {\n  return <div>{{content}}</div>;\n};\n\nexport default {{componentName}};",
  "properties": {
    "componentName": "MyComponent",
    "content": "Hello World"
  },
  "validations": [
    {
      "field": "componentName",
      "rule": "required",
      "message": "Component name is required"
    }
  ],
  "metadata": {
    "category": "frontend",
    "description": "A simple React component"
  },
  "projectId": "project_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_node_id",
    "name": "My Custom Node",
    "type": "react",
    "template": "import React from 'react'...",
    "properties": {...},
    "validations": [...],
    "metadata": {...},
    "projectId": "project_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/nodes/:id
Get a specific node by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "node_id",
    "name": "API Endpoint Node",
    "type": "api",
    "template": "const handler = (req, res) => { ... }",
    "properties": {...},
    "validations": [...],
    "metadata": {...},
    "projectId": "project_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/nodes/:id
Update an existing node.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (same as POST /api/nodes)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "node_id",
    "name": "Updated Node Name",
    "type": "react",
    "template": "updated template...",
    "properties": {...},
    "validations": [...],
    "metadata": {...},
    "projectId": "project_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### DELETE /api/nodes/:id
Delete a node.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Node deleted successfully"
}
```

### POST /api/nodes/:id/clone
Clone a node as a new instance.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Cloned Node Name",
  "projectId": "target_project_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_cloned_node_id",
    "name": "Cloned Node Name",
    "type": "react",
    "template": "cloned template...",
    "properties": {...},
    "validations": [...],
    "metadata": {...},
    "projectId": "target_project_id",
    "parentTemplate": "original_node_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/nodes/:id/test
Test a node's functionality.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "testData": {
    "input1": "test value",
    "input2": 123
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": "test output",
    "executionTime": 45,
    "status": "success",
    "logs": ["Log message 1", "Log message 2"]
  }
}
```

## Template Endpoints

### GET /api/templates
Get all available templates.

**Query Parameters:**
- `category` (optional): Filter by category
- `type` (optional): Filter by node type
- `public` (optional): Include public templates
- `page` (optional): Page number
- `limit` (optional): Items per page

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_id",
        "name": "React Button Component",
        "type": "react",
        "template": "import React from 'react'...",
        "schema": {
          "properties": [
            {
              "name": "text",
              "type": "string",
              "required": true,
              "default": "Click me"
            }
          ]
        },
        "category": "ui-components",
        "tags": ["button", "react", "ui"],
        "isPublic": true,
        "organization": "org_id",
        "usageCount": 156,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

### POST /api/templates
Create a new template.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Custom API Template",
  "type": "api",
  "template": "const handler = (req, res) => { ... }",
  "schema": {
    "properties": [
      {
        "name": "method",
        "type": "select",
        "options": ["GET", "POST", "PUT", "DELETE"],
        "required": true,
        "default": "GET"
      }
    ]
  },
  "category": "backend",
  "tags": ["api", "backend"],
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_template_id",
    "name": "Custom API Template",
    "type": "api",
    "template": "const handler = (req, res) => { ... }",
    "schema": {...},
    "category": "backend",
    "tags": ["api", "backend"],
    "isPublic": false,
    "organization": "org_id",
    "usageCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Project Endpoints

### GET /api/projects
Get all projects for the current user/organization.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project_id",
        "name": "E-commerce App",
        "description": "Online store application",
        "organization": "org_id",
        "members": [
          {
            "userId": "user_id",
            "role": "admin",
            "joinedAt": "2024-01-01T00:00:00.000Z"
          }
        ],
        "nodeCount": 25,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### POST /api/projects
Create a new project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_project_id",
    "name": "New Project",
    "description": "Project description",
    "organization": "org_id",
    "members": [
      {
        "userId": "current_user_id",
        "role": "admin",
        "joinedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "nodeCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/projects/:id/invite
Invite a user to join a project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "developer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "invitationId": "invitation_id",
    "email": "user@example.com",
    "role": "developer",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

## Admin Endpoints

### GET /api/admin/users
Get all users (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `organization` (optional): Filter by organization

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "developer",
        "organization": "org_id",
        "lastLogin": "2024-01-01T12:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

### PUT /api/admin/users/:id/role
Update user role (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "organization": "org_id",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| AUTH_001 | Invalid credentials | Email or password is incorrect |
| AUTH_002 | Token expired | JWT token has expired |
| AUTH_003 | Insufficient permissions | User lacks required permissions |
| NODE_001 | Node not found | Requested node does not exist |
| NODE_002 | Invalid node data | Node validation failed |
| PROJ_001 | Project not found | Requested project does not exist |
| TEMP_001 | Template not found | Requested template does not exist |
| VALID_001 | Validation error | Request data validation failed |
| SERVER_001 | Internal server error | Unexpected server error |

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **Node operations**: 100 requests per minute per user
- **Template operations**: 50 requests per minute per user
- **Admin operations**: 20 requests per minute per user

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```
