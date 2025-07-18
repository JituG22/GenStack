import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import config from "../config/environment";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GenStack API",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for GenStack - A collaborative node-based development platform",
      contact: {
        name: "GenStack Team",
        url: "https://github.com/JituG22/GenStack",
        email: "support@genstack.dev",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: "Development server",
      },
      {
        url: "https://api.genstack.dev",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token in cookie",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            firstName: {
              type: "string",
              description: "User first name",
            },
            lastName: {
              type: "string",
              description: "User last name",
            },
            organization: {
              type: "string",
              description: "Organization ID",
            },
            role: {
              type: "string",
              enum: ["user", "admin", "moderator"],
              description: "User role",
            },
            isActive: {
              type: "boolean",
              description: "User active status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Account last update date",
            },
          },
        },
        Project: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Project ID",
            },
            name: {
              type: "string",
              description: "Project name",
            },
            description: {
              type: "string",
              description: "Project description",
            },
            owner: {
              type: "string",
              description: "Project owner ID",
            },
            collaborators: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of collaborator IDs",
            },
            nodes: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Node",
              },
              description: "Project nodes",
            },
            isPublic: {
              type: "boolean",
              description: "Project visibility",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Node: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Node ID",
            },
            type: {
              type: "string",
              enum: ["input", "output", "process", "decision", "connector"],
              description: "Node type",
            },
            name: {
              type: "string",
              description: "Node name",
            },
            position: {
              type: "object",
              properties: {
                x: {
                  type: "number",
                  description: "X coordinate",
                },
                y: {
                  type: "number",
                  description: "Y coordinate",
                },
              },
            },
            data: {
              type: "object",
              description: "Node-specific data",
            },
            connections: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Connected node IDs",
            },
          },
        },
        Template: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Template ID",
            },
            name: {
              type: "string",
              description: "Template name",
            },
            description: {
              type: "string",
              description: "Template description",
            },
            category: {
              type: "string",
              description: "Template category",
            },
            nodes: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Node",
              },
            },
            isPublic: {
              type: "boolean",
              description: "Template visibility",
            },
            creator: {
              type: "string",
              description: "Template creator ID",
            },
            usageCount: {
              type: "number",
              description: "Number of times used",
            },
          },
        },
        Organization: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Organization ID",
            },
            name: {
              type: "string",
              description: "Organization name",
            },
            owner: {
              type: "string",
              description: "Organization owner ID",
            },
            members: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Member user IDs",
            },
            projects: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Project IDs",
            },
            settings: {
              type: "object",
              description: "Organization settings",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Notification ID",
            },
            recipient: {
              type: "string",
              description: "Recipient user ID",
            },
            type: {
              type: "string",
              enum: ["info", "warning", "error", "success"],
              description: "Notification type",
            },
            title: {
              type: "string",
              description: "Notification title",
            },
            message: {
              type: "string",
              description: "Notification message",
            },
            read: {
              type: "boolean",
              description: "Read status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Analytics: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Analytics ID",
            },
            user: {
              type: "string",
              description: "User ID",
            },
            action: {
              type: "string",
              description: "Action performed",
            },
            resource: {
              type: "string",
              description: "Resource affected",
            },
            metadata: {
              type: "object",
              description: "Additional metadata",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              description: "Error message",
            },
            statusCode: {
              type: "integer",
              description: "HTTP status code",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            password: {
              type: "string",
              minLength: 6,
              description: "User password",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            password: {
              type: "string",
              minLength: 6,
              description: "User password",
            },
            firstName: {
              type: "string",
              description: "User first name",
            },
            lastName: {
              type: "string",
              description: "User last name",
            },
            organization: {
              type: "string",
              description: "Organization name (optional)",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts", "./src/server.ts"],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup with custom CSS
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #667eea; }
      .swagger-ui .info .description { color: #4a5568; }
      .swagger-ui .scheme-container { background: #f7fafc; }
      .swagger-ui .opblock.opblock-post { border-color: #48bb78; }
      .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #48bb78; }
      .swagger-ui .opblock.opblock-get { border-color: #4299e1; }
      .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #4299e1; }
      .swagger-ui .opblock.opblock-put { border-color: #ed8936; }
      .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #ed8936; }
      .swagger-ui .opblock.opblock-delete { border-color: #f56565; }
      .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #f56565; }
    `,
    customSiteTitle: "GenStack API Documentation",
    customfavIcon: "/favicon.ico",
    customJs: "/swagger-custom.js",
  };

  // Serve Swagger UI at /api-docs
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, swaggerUiOptions)
  );

  // Serve raw OpenAPI spec at /api-docs/swagger.json
  app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};

export default specs;
