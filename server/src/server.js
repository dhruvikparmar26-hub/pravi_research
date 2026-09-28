// ──────────────────────────────────────────────
// Pravi — Server Entry Point
// Loads environment → connects MongoDB → starts
// the Express HTTP server.
// ──────────────────────────────────────────────
const dotenv = require('dotenv');

// Load .env BEFORE anything else reads process.env
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Start listening
  app.listen(PORT, () => {
    console.log(`\n  ✓ Pravi server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`  ✓ Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
