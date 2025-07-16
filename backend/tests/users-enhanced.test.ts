import request from "supertest";
import app from "../src/server";
import { UserNew } from "../src/models/User-new";
import { Organization } from "../src/models/Organization-simple";
import jwt from "jsonwebtoken";
import config from "../src/config/environment";

describe("Enhanced User API", () => {
  let authToken: string;
  let userId: string;
  let organizationId: string;

  beforeAll(async () => {
    // Create test organization
    const organization = await Organization.create({
      name: "Test Organization",
      description: "Test organization for user API",
      owner: null,
    });
    organizationId = organization._id.toString();

    // Create test user
    const user = await UserNew.create({
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      password: "password123",
      organization: organizationId,
      preferences: {
        theme: "light",
        language: "en",
        notifications: {
          email: true,
          realTime: true,
          collaborativEditing: true,
          projectUpdates: true,
        },
        dashboard: {
          layout: "grid",
          defaultView: "projects",
          showTutorials: true,
        },
      },
      collaborationSettings: {
        allowRealTimeEditing: true,
        showCursor: true,
        sharePresence: true,
        defaultProjectVisibility: "team",
      },
      featureUsage: {
        templatesCreated: 0,
        projectsCreated: 0,
        collaborativeSessions: 0,
        favoriteFeatures: [],
      },
      following: [],
      followers: [],
      teams: [],
      apiKeys: [],
      loginHistory: [],
    });

    userId = user._id.toString();

    // Generate auth token
    authToken = jwt.sign({ id: userId, email: user.email }, config.jwtSecret, {
      expiresIn: "1h",
    });
  });

  afterAll(async () => {
    // Clean up test data
    await UserNew.findByIdAndDelete(userId);
    await Organization.findByIdAndDelete(organizationId);
  });

  describe("GET /api/users/profile", () => {
    it("should return user profile", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("test@example.com");
      expect(response.body.data.firstName).toBe("Test");
      expect(response.body.data.lastName).toBe("User");
      expect(response.body.data.preferences).toBeDefined();
      expect(response.body.data.collaborationSettings).toBeDefined();
    });

    it("should require authentication", async () => {
      await request(app).get("/api/users/profile").expect(401);
    });
  });

  describe("PUT /api/users/preferences", () => {
    it("should update user preferences", async () => {
      const newPreferences = {
        theme: "dark",
        language: "es",
        notifications: {
          email: false,
          realTime: true,
          collaborativEditing: false,
          projectUpdates: true,
        },
      };

      const response = await request(app)
        .put("/api/users/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newPreferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.theme).toBe("dark");
      expect(response.body.data.language).toBe("es");
      expect(response.body.data.notifications.email).toBe(false);
    });

    it("should validate theme values", async () => {
      await request(app)
        .put("/api/users/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ theme: "invalid-theme" })
        .expect(400);
    });
  });

  describe("PUT /api/users/collaboration-settings", () => {
    it("should update collaboration settings", async () => {
      const newSettings = {
        allowRealTimeEditing: false,
        showCursor: false,
        sharePresence: false,
        defaultProjectVisibility: "private",
      };

      const response = await request(app)
        .put("/api/users/collaboration-settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newSettings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.allowRealTimeEditing).toBe(false);
      expect(response.body.data.defaultProjectVisibility).toBe("private");
    });
  });

  describe("GET /api/users/activity", () => {
    it("should return user activity data", async () => {
      const response = await request(app)
        .get("/api/users/activity")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.featureUsage).toBeDefined();
      expect(response.body.data.isActive).toBeDefined();
      expect(response.body.data.loginHistory).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/users/feature-usage", () => {
    it("should increment feature usage", async () => {
      const response = await request(app)
        .post("/api/users/feature-usage")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          feature: "templatesCreated",
          action: "increment",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templatesCreated).toBe(1);
    });

    it("should add to favorite features", async () => {
      const response = await request(app)
        .post("/api/users/feature-usage")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          feature: "templates",
          action: "add_favorite",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.favoriteFeatures).toContain("templates");
    });
  });

  describe("API Key Management", () => {
    let keyId: number;

    it("should create an API key", async () => {
      const response = await request(app)
        .post("/api/users/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test API Key",
          permissions: ["read", "write"],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Test API Key");
      expect(response.body.data.key).toMatch(/^gsk_/);
      expect(response.body.data.permissions).toEqual(["read", "write"]);
    });

    it("should list API keys without revealing keys", async () => {
      const response = await request(app)
        .get("/api/users/api-keys")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].keyPreview).toMatch(/\.\.\.$/);
      keyId = response.body.data[0].id;
    });

    it("should delete an API key", async () => {
      const response = await request(app)
        .delete(`/api/users/api-keys/${keyId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("API key deleted successfully");
    });
  });

  describe("GET /api/users/search", () => {
    it("should search for users", async () => {
      const response = await request(app)
        .get("/api/users/search?q=test")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      // Should not include current user in search results
      expect(
        response.body.data.find((u: any) => u._id === userId)
      ).toBeUndefined();
    });

    it("should require search query", async () => {
      await request(app)
        .get("/api/users/search")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("GET /api/users/active-users", () => {
    it("should return active users", async () => {
      const response = await request(app)
        .get("/api/users/active-users?hours=24")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.timeframe).toBe("24 hours");
      expect(response.body.data.count).toBeDefined();
    });
  });
});
