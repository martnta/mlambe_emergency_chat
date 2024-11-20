const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");
const socketState = require("./utils/socketState");
const authRoutes = require("./routes/auth");
const call = require("./routes/call");
const userRoutes = require("./routes/user");
const messageRoutes = require("./routes/messages");
const emergencyRoutes = require("./routes/emergency");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log("DB Connection Error:", err.message);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/call", call);
app.use("/api/user", userRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// Store IO instance in socketState
socketState.setIO(io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("add-user", (userId) => {
    socketState.addOnlineUser(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
    io.emit("user-status", { userId, status: "online" });
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = socketState.getOnlineUser(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("msg-receive", {
        from: data.from,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on("typing", (data) => {
    const recipientSocket = socketState.getOnlineUser(data.to);
    if (recipientSocket) {
      socketState.setTypingUser(data.from, true);
      io.to(recipientSocket).emit("typing", {
        from: data.from,
        isTyping: true
      });
    }
  });

  socket.on("stop-typing", (data) => {
    const recipientSocket = socketState.getOnlineUser(data.to);
    if (recipientSocket) {
      socketState.removeTypingUser(data.from);
      io.to(recipientSocket).emit("typing", {
        from: data.from,
        isTyping: false
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const [userId, socketId] of socketState.onlineUsers.entries()) {
      if (socketId === socket.id) {
        socketState.removeOnlineUser(userId);
        socketState.removeTypingUser(userId);
        io.emit("user-status", { userId, status: "offline" });
        break;
      }
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});