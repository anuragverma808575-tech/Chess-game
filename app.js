const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {};
let currentTurn = "w";

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Render main page
app.get("/", (req, res) => {
  res.render("index"); // or res.sendFile if using HTML
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  // Assign color
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  // Handle move
  socket.on("move", (move) => {
    try {
      const result = chess.move(move);
      if (result) {
        currentTurn = currentTurn === "w" ? "b" : "w";
        io.emit("move", move);
      }
    } catch (err) {
      console.log("Invalid move:", err.message);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (players.white === socket.id) delete players.white;
    if (players.black === socket.id) delete players.black;
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
