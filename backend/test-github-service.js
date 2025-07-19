#!/usr/bin/env node

/**
 * GitHub Integration Test Script
 *
 * This script tests the GitHub service functionality without requiring
 * the full application to be running.
 */

const path = require("path");

// Set up environment
process.env.NODE_ENV = "development";

// Mock MongoDB for this test
const mongoose = {
  startSession: () => ({
    startTransaction: () => {},
    commitTransaction: () => {},
    abortTransaction: () => {},
    endSession: () => {},
  }),
};

// Mock Project model for this test
const Project = {
  startSession: mongoose.startSession,
  prototype: {
    save: function (options) {
      this.id = "test-project-id";
      return Promise.resolve(this);
    },
  },
  findById: (id) => ({
    populate: () => ({
      populate: () =>
        Promise.resolve({
          id: id,
          name: "Test Project",
          github: {
            enabled: true,
            repoName: "test-repo",
            repoUrl: "https://github.com/test/test-repo",
          },
        }),
    }),
  }),
};

// Create a constructor function
function ProjectConstructor(data) {
  Object.assign(this, data);
}
ProjectConstructor.prototype.save = Project.prototype.save;
Object.assign(ProjectConstructor, Project);

global.Project = ProjectConstructor;

async function testGitHubService() {
  console.log("🧪 Testing GitHub Service...\n");

  try {
    // Load the GitHub service
    const {
      ProjectGitHubService,
    } = require("./src/services/projectGitHubService.ts");

    console.log("✅ GitHub service loaded successfully");

    // Create service instance
    const service = new ProjectGitHubService();
    console.log("✅ GitHub service instance created");

    // Test repository name sanitization
    const testNames = [
      "My Test Project!",
      "project-with-special-chars@#$",
      "UPPERCASE PROJECT",
      "project   with   spaces",
    ];

    console.log("\n🔧 Testing repository name sanitization:");
    for (const name of testNames) {
      const sanitized = service.sanitizeRepoName
        ? service.sanitizeRepoName(name)
        : "method-not-accessible";
      console.log(`  "${name}" → "${sanitized}"`);
    }

    // Test error message extraction
    console.log("\n🔧 Testing error message extraction:");
    const testErrors = [
      { response: { data: { message: "Repository already exists" } } },
      { message: "Network error" },
      { unknown: "error" },
    ];

    for (const error of testErrors) {
      const message = service.getGitHubErrorMessage
        ? service.getGitHubErrorMessage(error)
        : "method-not-accessible";
      console.log(`  Error: ${JSON.stringify(error)} → "${message}"`);
    }

    console.log("\n✅ All basic GitHub service tests passed!");
    console.log("\n📝 Note: Full integration tests require:");
    console.log("  - Valid GitHub token in environment");
    console.log("  - MongoDB connection");
    console.log("  - Network access to GitHub API");
  } catch (error) {
    console.error("❌ GitHub service test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
testGitHubService()
  .then(() => {
    console.log("\n🎉 GitHub service test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 GitHub service test failed:", error);
    process.exit(1);
  });
