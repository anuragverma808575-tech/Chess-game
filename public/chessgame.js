const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const statusEl = document.getElementById("status");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Unicode for pieces
const getPieceUnicode = (piece) => {
  if (!piece) return "";
  const unicodePieces = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  };
  return unicodePieces[piece.type === piece.type.toLowerCase() ? piece.type : piece.type.toUpperCase()];
};

// Render chessboard
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        "flex",
        "items-center",
        "justify-center",
        "text-4xl",
        "cursor-pointer",
        "transition-all"
      );

      // Color squares
      const isLight = (rowIndex + colIndex) % 2 === 0;
      squareElement.classList.add(isLight ? "bg-amber-700" : "bg-black");

      // Position
      const file = String.fromCharCode(97 + colIndex);
      const rank = 8 - rowIndex;
      const squareName = `${file}${rank}`;
      squareElement.dataset.square = squareName;

      // Add piece
     if (square) {
  const pieceElement = document.createElement("div");
  pieceElement.textContent = getPieceUnicode(square);
  pieceElement.draggable = true;

  
  if (square.color === "w") {
    pieceElement.classList.add("text-white");
  } else {
    pieceElement.classList.add("text-zinc-700");
  }

  pieceElement.addEventListener("dragstart", () => {
    draggedPiece = square;
    sourceSquare = squareName;
  });

  squareElement.appendChild(pieceElement);
}

      // Drop logic
      squareElement.addEventListener("dragover", (e) => e.preventDefault());
      squareElement.addEventListener("drop", () => {
        handleMove(sourceSquare, squareName);
      });

      boardElement.appendChild(squareElement);
    });
  });
};

// Handle moves
const handleMove = (source, target) => {
  const move = chess.move({ from: source, to: target, promotion: "q" });
  if (move) {
    socket.emit("move", move);
    renderBoard();
    updateStatus();
  }
};

// Update status messages (with color)
const updateStatus = () => {
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      statusEl.textContent = `♛ Checkmate! ${winner} Wins! ♛`;
      statusEl.className =
        winner === "White"
          ? "text-green-500 font-bold text-xl"
          : "text-red-500 font-bold text-xl";
    } else if (chess.isDraw()) {
      statusEl.textContent = "Draw Game!";
      statusEl.className = "text-blue-500 font-bold text-xl";
    }
    return;
  }

  statusEl.textContent =
    chess.turn() === "w" ? "White's Move ♙" : "Black's Move ♟";
  statusEl.className =
    chess.turn() === "w"
      ? "text-green-400 font-semibold text-lg"
      : "text-red-400 font-semibold text-lg";
};

// Listen for opponent moves
socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
  updateStatus();
});

// Receive initial board from server
socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
  updateStatus();
});

// Player roles
socket.on("playerRole", (role) => {
  playerRole = role;
  statusEl.textContent = role === "w" ? "You are White ♙" : "You are Black ♟";
  statusEl.className = "text-blue-400 font-semibold";
});

// Spectator mode
socket.on("spectator", () => {
  playerRole = null;
  statusEl.textContent = "👀 You are a Spectator.";
  statusEl.className = "text-gray-400 font-semibold";
});

// Game messages from server
socket.on("message", (msg) => {
  statusEl.textContent = msg;
  statusEl.className = "text-yellow-400 font-semibold";
});

renderBoard();
updateStatus();

