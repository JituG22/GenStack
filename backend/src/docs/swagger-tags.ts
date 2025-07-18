/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Users
 *     description: User management operations
 *   - name: Projects
 *     description: Project management operations
 *   - name: Nodes
 *     description: Node operations within projects
 *   - name: Templates
 *     description: Template management operations
 *   - name: Organizations
 *     description: Organization management operations
 *   - name: Notifications
 *     description: Notification system operations
 *   - name: Analytics
 *     description: Analytics and reporting operations
 *   - name: Admin
 *     description: Administrative operations
 *   - name: Health
 *     description: System health and monitoring
 *   - name: Error Handling
 *     description: Error boundary and monitoring operations
 *   - name: WebSocket
 *     description: Real-time communication operations
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health status
 *     description: Returns the current health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "GenStack API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T12:00:00.000Z"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *             example:
 *               success: true
 *               message: "GenStack API is running"
 *               timestamp: "2024-01-01T12:00:00.000Z"
 *               environment: "development"
 *               version: "1.0.0"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Server Dashboard
 *     description: Returns the HTML dashboard for the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: HTML dashboard page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<!DOCTYPE html><html>...</html>"
 */
