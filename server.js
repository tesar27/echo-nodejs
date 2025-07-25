const express = require("express");
require("dotenv").config();
const { testConnection } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Echo API",
    version: "1.0.0",
    status: "Server is running!",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);

  // Test database connection
  await testConnection();
});
