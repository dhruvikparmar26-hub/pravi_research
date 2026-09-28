const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const { sendError } = require('./utils/apiResponse');

// ── Create Express application ──────────────
const app = express();

// ── Global Middleware Pipeline ───────────────

// 1. Request logging (dev mode only — coloured output)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 2. CORS — allow React frontend with credentials (cookies & Bearer tokens)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app') || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// 3. Parse JSON request bodies (limit to 10MB for bulk imports later)
app.use(express.json({ limit: '10mb' }));

// 4. Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// 5. Parse cookies (needed for HTTP-only JWT cookie)
app.use(cookieParser());

// ── Health Check ────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pravi API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// ── 404 Handler — Unmatched Routes ──────────
app.use((req, res) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
});

// ── Global Error Handler (must be last) ─────
app.use(errorHandler);

module.exports = app;
