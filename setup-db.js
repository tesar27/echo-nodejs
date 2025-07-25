require('dotenv').config();
const { pool } = require("./config/database");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Execute schema
    await pool.query(schema);
    console.log("✅ Database tables created successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    process.exit(1);
  }
}

setupDatabase();
