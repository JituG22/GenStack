# GenStack API Documentation - Swagger Integration

## 🎯 **Overview**

GenStack backend now includes comprehensive API documentation powered by Swagger/OpenAPI 3.0. The documentation provides interactive API exploration, request/response examples, and detailed schema definitions.

## 🚀 **Accessing API Documentation**

### **Interactive Documentation**

- **URL**: `http://localhost:5000/api-docs`
- **Description**: Interactive Swagger UI with "Try it out" functionality
- **Features**:
  - Real-time API testing
  - Request/response examples
  - Schema validation
  - Authentication support

### **Raw OpenAPI Spec**

- **URL**: `http://localhost:5000/api-docs/swagger.json`
- **Description**: Raw OpenAPI 3.0 specification in JSON format
- **Use Cases**:
  - API client generation
  - Postman collection import
  - Custom tooling integration

## 📊 **Server Integration**

### **Automatic Setup**

- Swagger is automatically initialized when the server starts
- No additional configuration required
- Integrates seamlessly with existing middleware

### **Server Output**

When starting the server, you'll see:

```bash
🚀 Server running on port 5000
🌍 Environment: development
📊 Health check: http://localhost:5000/health
📖 API Documentation: http://localhost:5000/api-docs
🔄 WebSocket enabled for real-time features
```

## 🔧 **Configuration**

### **Main Configuration File**

- **Location**: `backend/src/config/swagger.ts`
- **Features**:
  - OpenAPI 3.0 specification
  - Comprehensive schema definitions
  - Security schemes (JWT Bearer, Cookie Auth)
  - Custom styling
  - Multiple server environments

### **Key Features**

- **Authentication**: Supports both JWT Bearer tokens and cookie-based auth
- **Schemas**: Detailed type definitions for all data models
- **Validation**: Request/response validation examples
- **Styling**: Custom CSS for brand consistency

## 📚 **API Documentation Coverage**

### **Documented Endpoints**

#### **🔐 Authentication**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

#### **👥 Users**

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/analytics` - User analytics

#### **📋 Projects**

- `GET /api/projects` - List projects with pagination and filtering
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

#### **🔗 Nodes**

- `GET /api/nodes` - List nodes
- `POST /api/nodes` - Create node
- `GET /api/nodes/{id}` - Get node details
- `PUT /api/nodes/{id}` - Update node
- `DELETE /api/nodes/{id}` - Delete node

#### **📄 Templates**

- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/{id}` - Get template details

#### **🔔 Notifications**

- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/{id}/read` - Mark as read

#### **📊 Analytics**

- `GET /api/analytics` - Get analytics data
- `POST /api/analytics/events` - Track events

#### **🚨 Error Handling**

- `POST /api/errors/boundary` - Report error boundary
- `GET /api/errors/reports` - Get error reports

#### **🏥 Health & Monitoring**

- `GET /health` - Health check endpoint
- `GET /` - API server dashboard

## 🎨 **Schema Definitions**

### **Core Models**

- `User` - User account information
- `Project` - Project details and metadata
- `Node` - Workflow nodes
- `Template` - Reusable templates
- `Organization` - Organization structure
- `Notification` - Notification system
- `Analytics` - Analytics events

### **Request/Response Models**

- `LoginRequest` - Login credentials
- `RegisterRequest` - Registration data
- `CreateProjectRequest` - Project creation
- `UpdateProjectRequest` - Project updates
- `Success` - Standard success response
- `Error` - Standard error response
- `PaginatedResponse` - Paginated data response

## 🔒 **Security Integration**

### **Authentication Methods**

1. **Bearer Token**: JWT tokens in Authorization header
2. **Cookie Auth**: JWT tokens in cookies

### **Usage Examples**

```javascript
// Bearer Token
fetch("/api/users/profile", {
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
});

// Cookie Auth (automatic)
fetch("/api/users/profile", {
  credentials: "include",
});
```

## 🎯 **Features & Benefits**

### **✅ Non-Interfering Design**

- Swagger runs on separate route (`/api-docs`)
- Does not affect existing API endpoints
- Optional middleware integration
- Zero impact on performance

### **✅ Developer Experience**

- Interactive API testing
- Real-time request/response examples
- Schema validation
- Type-safe documentation

### **✅ Production Ready**

- Environment-specific configurations
- Security-aware documentation
- Performance optimized
- Error handling integration

## 🚀 **Usage Examples**

### **Testing Authentication**

1. Open `http://localhost:5000/api-docs`
2. Navigate to "Authentication" section
3. Try the `POST /api/auth/login` endpoint
4. Use the returned token for authenticated requests

### **Testing Projects API**

1. Login to get authentication token
2. Use "Authorize" button to set token
3. Try `GET /api/projects` to list projects
4. Use `POST /api/projects` to create new project

### **Testing with Postman**

1. Import OpenAPI spec from `http://localhost:5000/api-docs/swagger.json`
2. Configure authentication in Postman
3. Use generated collection for API testing

## 📱 **Mobile & Responsive**

The Swagger UI is fully responsive and works on:

- Desktop browsers
- Mobile devices
- Tablet interfaces
- VS Code Simple Browser

## 🔧 **Development Notes**

### **Adding New Endpoints**

1. Add Swagger comments to route files
2. Define schemas in `/docs/swagger-schemas.ts`
3. Documentation updates automatically

### **Custom Styling**

- Custom CSS in `swagger.ts` configuration
- Brand-consistent color scheme
- GenStack theming applied

### **Performance Considerations**

- Swagger UI served statically
- No impact on API performance
- Lazy-loaded documentation

## 📝 **Quick Links**

- **API Documentation**: http://localhost:5000/api-docs
- **Server Dashboard**: http://localhost:5000/
- **Health Check**: http://localhost:5000/health
- **OpenAPI Spec**: http://localhost:5000/api-docs/swagger.json

## 🎉 **Summary**

The Swagger integration provides:

- ✅ Comprehensive API documentation
- ✅ Interactive testing environment
- ✅ Type-safe schema definitions
- ✅ Authentication support
- ✅ Zero interference with existing code
- ✅ Professional developer experience

**Status**: 🟢 **Fully Functional & Production Ready**
