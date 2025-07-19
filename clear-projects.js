const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/genstack-dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");

  try {
    // Delete all projects
    const result = await db.collection("projects").deleteMany({});
    console.log(`Deleted ${result.deletedCount} projects`);

    // Count remaining projects
    const count = await db.collection("projects").countDocuments();
    console.log(`Remaining projects: ${count}`);

    console.log("Database cleared successfully!");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
});
