// 🚀 Core imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

// 🛡️ Security imports
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const { xss, hpp, ipBlocker } = require("./middleware/firewall");

// 🌱 Load environment variables FIRST
dotenv.config();

// 🧠 Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// ==========================
// 🧩 GLOBAL MIDDLEWARE
// ==========================
// 🛡️ Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));               // Set security headers (CSP disabled for inline scripts)
app.use(mongoSanitize());        // Prevent NoSQL injection
app.use(xss());                  // Prevent XSS attacks
app.use(hpp());                  // Prevent HTTP Parameter Pollution
app.use(ipBlocker);              // Custom firewall IP blocker & payload inspector

// 🚦 Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};
app.use(cors(corsOptions));               // 🌍 Allow cross-origin requests
app.use(express.json());       // 📦 Parse JSON bodies

// ==========================
// 📂 ROUTE IMPORTS
// ==========================
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const foodRoutes = require("./routes/foodRoutes");
const trackingRoutes = require("./routes/tracking");

// Serve frontend static files
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));

// ==========================
// 🛣️ ROUTE MOUNTS
// ==========================
app.use("/api/auth", authRoutes);     // 🔐 Auth routes
app.use("/api/admin", adminRoutes);   // 👑 Admin routes
app.use("/api/food", foodRoutes);     // 🍱 Food routes
app.use("/api/tracking", trackingRoutes); // 📍 Tracking routes

// ==========================
// 🔌 SOCKET.IO EVENTS
// ==========================
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  // Subscribe to specific delivery tracking
  socket.on('location:subscribe', (trackingId) => {
    socket.join(`tracking:${trackingId}`);
    console.log(`📍 Client ${socket.id} subscribed to tracking ${trackingId}`);
  });

  // Unsubscribe from tracking
  socket.on('location:unsubscribe', (trackingId) => {
    socket.leave(`tracking:${trackingId}`);
    console.log(`📍 Client ${socket.id} unsubscribed from tracking ${trackingId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// ==========================
// 🧪 TEST ROUTE
// ==========================
app.get("/", (req, res) => {
  res.send("FoodBridge Backend is running 🚀");
});

// ==========================
// 🗄️ MONGODB CONNECTION
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB connection error ❌", err.message);
  });

// ==========================
// 🔊 START SERVER
// ==========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});
