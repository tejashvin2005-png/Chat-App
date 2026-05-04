
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// SERVE CLIENT
app.use(express.static(path.join(__dirname, "../client")));

const io = new Server(server, {
  cors: { origin: "*" }
});

// DATA STORAGE (TEMP - MEMORY)
let onlineUsers = {};
let chatHistory = [];
let profilePics = {};

// CONNECTION
io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  // 🔥 JOIN
  socket.on("join", (username) => {
    if (!username) return;

    socket.username = username;
    onlineUsers[username] = socket.id;

    // SEND OLD DATA
    socket.emit("chatHistory", chatHistory);
    socket.emit("allProfilePics", profilePics);

    io.emit("onlineUsers", Object.keys(onlineUsers));

    // SYSTEM MESSAGE
    const msg = {
      id: Date.now(),
      user: "System",
      text: `${username} joined the chat`,
      time: new Date().toLocaleTimeString()
    };

    chatHistory.push(msg);
    io.emit("message", msg);
  });

  // 🔥 PROFILE PIC
  socket.on("profilePic", (data) => {
    if (!data?.user || !data?.image) return;

    profilePics[data.user] = data.image;
    io.emit("profilePic", data);
  });

  // 🔥 PUBLIC MESSAGE
  socket.on("publicMessage", (data) => {
    if (!socket.username || !data?.text?.trim()) return;

    const msg = {
      id: Date.now(),
      user: socket.username,
      text: data.text.trim(),
      time: new Date().toLocaleTimeString()
    };

    chatHistory.push(msg);

    // LIMIT HISTORY (100 MESSAGES)
    if (chatHistory.length > 100) {
      chatHistory.shift();
    }

    io.emit("message", msg);
  });

  // 🔥 IMAGE MESSAGE
  socket.on("image", (data) => {
    if (!data?.image) return;

    const msg = {
      user: socket.username,
      image: data.image,
      time: new Date().toLocaleTimeString()
    };

    io.emit("image", msg);
  });

  // 🌄 GLOBAL BACKGROUND CHANGE
  socket.on("changeBg", (bg) => {
    io.emit("changeBg", bg);
  });

  // ✍️ TYPING
  socket.on("typing", (user) => {
    socket.broadcast.emit("typing", user);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // 🔌 DISCONNECT
  socket.on("disconnect", () => {
    if (!socket.username) return;

    console.log("User disconnected:", socket.username);

    delete onlineUsers[socket.username];

    io.emit("onlineUsers", Object.keys(onlineUsers));

    // SYSTEM LEAVE MESSAGE
    const msg = {
      id: Date.now(),
      user: "System",
      text: `${socket.username} left the chat`,
      time: new Date().toLocaleTimeString()
    };

    chatHistory.push(msg);
    io.emit("message", msg);
  });

});

// START SERVER
server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});