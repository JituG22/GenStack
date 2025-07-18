/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProjectRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *           example: "My Awesome Project"
 *         description:
 *           type: string
 *           description: Project description
 *           example: "A collaborative workflow management system"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Project tags
 *           example: ["workflow", "collaboration", "productivity"]
 *         isPublic:
 *           type: boolean
 *           description: Whether the project is public
 *           default: false
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *           default: active
 *           description: Project status
 *
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *           description: Project description
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Project tags
 *         isPublic:
 *           type: boolean
 *           description: Whether the project is public
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *           description: Project status
 *
 *     CreateNodeRequest:
 *       type: object
 *       required:
 *         - type
 *         - name
 *         - position
 *       properties:
 *         type:
 *           type: string
 *           enum: [input, output, process, decision, connector]
 *           description: Node type
 *         name:
 *           type: string
 *           description: Node name
 *           example: "Data Input"
 *         position:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *               example: 100
 *             y:
 *               type: number
 *               example: 200
 *         data:
 *           type: object
 *           description: Node-specific data
 *           example: {"inputType": "text", "placeholder": "Enter data"}
 *         connections:
 *           type: array
 *           items:
 *             type: string
 *           description: Connected node IDs
 *
 *     CreateTemplateRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           description: Template name
 *           example: "Data Processing Workflow"
 *         description:
 *           type: string
 *           description: Template description
 *           example: "A template for processing and analyzing data"
 *         category:
 *           type: string
 *           description: Template category
 *           example: "Data Analysis"
 *         nodes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Node'
 *           description: Template nodes
 *         isPublic:
 *           type: boolean
 *           description: Whether the template is public
 *           default: false
 *
 *     NotificationRequest:
 *       type: object
 *       required:
 *         - recipient
 *         - type
 *         - title
 *         - message
 *       properties:
 *         recipient:
 *           type: string
 *           description: Recipient user ID
 *         type:
 *           type: string
 *           enum: [info, warning, error, success]
 *           description: Notification type
 *         title:
 *           type: string
 *           description: Notification title
 *           example: "Project Update"
 *         message:
 *           type: string
 *           description: Notification message
 *           example: "Your project has been successfully updated"
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: User first name
 *         lastName:
 *           type: string
 *           description: User last name
 *         bio:
 *           type: string
 *           description: User bio
 *         avatar:
 *           type: string
 *           description: Avatar URL
 *         preferences:
 *           type: object
 *           description: User preferences
 *           properties:
 *             theme:
 *               type: string
 *               enum: [light, dark, system]
 *               default: system
 *             notifications:
 *               type: boolean
 *               default: true
 *             emailNotifications:
 *               type: boolean
 *               default: true
 *
 *     ErrorBoundaryReport:
 *       type: object
 *       required:
 *         - error
 *         - context
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               description: Error message
 *             stack:
 *               type: string
 *               description: Error stack trace
 *             name:
 *               type: string
 *               description: Error name
 *         context:
 *           type: object
 *           description: Error context information
 *           properties:
 *             userId:
 *               type: string
 *               description: User ID who encountered the error
 *             userAgent:
 *               type: string
 *               description: User agent string
 *             url:
 *               type: string
 *               description: URL where error occurred
 *             componentStack:
 *               type: string
 *               description: React component stack trace
 *         metadata:
 *           type: object
 *           description: Additional error metadata
 *
 *     AnalyticsEvent:
 *       type: object
 *       required:
 *         - action
 *         - resource
 *       properties:
 *         action:
 *           type: string
 *           description: Action performed
 *           example: "project_created"
 *         resource:
 *           type: string
 *           description: Resource affected
 *           example: "project"
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *           example: {"projectId": "64a1b2c3d4e5f6789012345", "projectName": "Test Project"}
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               description: Array of items
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 hasNext:
 *                   type: boolean
 *                   example: true
 *                 hasPrev:
 *                   type: boolean
 *                   example: false
 */
