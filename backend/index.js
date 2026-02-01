const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { scheduleMonthlyFee } = require("./jobs/feeScheduler");
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));
app.use(express.json());
console.log("running");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    scheduleMonthlyFee();
    //console.log("Fee scheduler started");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();
//const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
//const roomRoutes = require('./routes/roomRoutes');
const feeRoutes = require("./routes/feeRoutes");
const menuRoutes = require("./routes/menuroutes");
//const dashboardRoutes = require('./routes/dashboardRoutes');
//const seaterRoutes = require('./routes/seaterRoutes');
// const Menu = require('./models/Menu');
const authRoutes = require("./routes/authRoutes");
const hostelRoutes = require("./routes/hostelRoutes");
// Routes
app.use("/api/hostels", hostelRoutes);
//payment routes
const khaltiRoutes = require("./routes/KhaltiRoutes");
app.use("/api/khalti", khaltiRoutes);
// room routes
const roomRoutes = require("./routes/roomRoutes");
app.use("/api/rooms", roomRoutes);
// user routes

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
//app.use('/api/users', userRoutes);
//app.use('/api/rooms', roomRoutes);
//app.use('/api/seater', seaterRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/menu", menuRoutes);
//app.use('/api/dashboard', dashboardRoutes);

// Basic error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
