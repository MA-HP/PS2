const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

const allowedGames = new Set(['tetris', 'bomberman', 'pacman', 'pinball', 'snake']);

const waitingPlayers = {
  tetris: [],
  bomberman: [],
  pacman: [],
  pinball: [],
  snake: []
};

const rooms = new Map();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

io.on('connection', (socket) => {
  socket.data.currentRoomId = null;

  socket.on('queue:join', ({ game, username }) => {
    if (!allowedGames.has(game)) {
      socket.emit('queue:error', { message: 'Jeu non supporté.' });
      return;
    }

    const player = {
      socketId: socket.id,
      username: username?.trim() || `Player-${socket.id.slice(0, 4)}`
    };

    const queue = waitingPlayers[game];

    // Empêche les doublons dans la file
    if (!queue.find((p) => p.socketId === socket.id)) {
      queue.push(player);
    }

    if (queue.length >= 2) {
      const p1 = queue.shift();
      const p2 = queue.shift();
      const roomId = `${game}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      rooms.set(roomId, {
        game,
        players: [p1, p2],
        state: {}
      });

      const s1 = io.sockets.sockets.get(p1.socketId);
      const s2 = io.sockets.sockets.get(p2.socketId);

      if (!s1 || !s2) {
        rooms.delete(roomId);
        return;
      }

      s1.join(roomId);
      s2.join(roomId);
      s1.data.currentRoomId = roomId;
      s2.data.currentRoomId = roomId;

      io.to(roomId).emit('match:found', {
        roomId,
        game,
        players: [p1, p2],
        startedAt: new Date().toISOString()
      });
    } else {
      socket.emit('queue:waiting', {
        game,
        message: 'En attente d\'un adversaire...'
      });
    }
  });


  socket.on('room:rejoin', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('queue:error', { message: 'Salle introuvable.' });
      return;
    }

    const existingPlayer = room.players.find((p) => p.socketId === socket.id);
    if (!existingPlayer) {
      room.players.push({ socketId: socket.id, username: username?.trim() || `Player-${socket.id.slice(0, 4)}` });
    }

    socket.join(roomId);
    socket.data.currentRoomId = roomId;
    io.to(roomId).emit('match:found', {
      roomId,
      game: room.game,
      players: room.players,
      startedAt: new Date().toISOString()
    });
  });

  socket.on('game:update', ({ roomId, payload }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.state = {
      ...room.state,
      [socket.id]: payload
    };

    socket.to(roomId).emit('game:update', {
      from: socket.id,
      payload
    });
  });

  socket.on('game:event', ({ roomId, type, payload }) => {
    if (!rooms.has(roomId)) return;

    socket.to(roomId).emit('game:event', {
      from: socket.id,
      type,
      payload
    });
  });

  socket.on('chat:message', ({ roomId, username, message }) => {
    if (!rooms.has(roomId)) return;

    io.to(roomId).emit('chat:message', {
      username: username || 'Anonymous',
      message,
      at: new Date().toISOString()
    });
  });

  socket.on('room:leave', ({ roomId }) => {
    handleDisconnectFromRoom(socket, roomId);
  });

  socket.on('disconnect', () => {
    // Suppression des files d'attente
    Object.keys(waitingPlayers).forEach((game) => {
      waitingPlayers[game] = waitingPlayers[game].filter((p) => p.socketId !== socket.id);
    });

    handleDisconnectFromRoom(socket, socket.data.currentRoomId, true);
  });
});

function handleDisconnectFromRoom(socket, roomId, disconnected = false) {
  if (!roomId || !rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  const opponent = room.players.find((p) => p.socketId !== socket.id);

  rooms.delete(roomId);

  if (opponent?.socketId) {
    io.to(opponent.socketId).emit('match:ended', {
      reason: disconnected ? 'Ton adversaire s\'est déconnecté.' : 'Ton adversaire a quitté la partie.'
    });
  }

  socket.leave(roomId);
  socket.data.currentRoomId = null;
}

server.listen(PORT, () => {
  console.log(`✅ Retro Arcade Server lancé sur http://localhost:${PORT}`);
  console.log('🌐 Pour publier en ligne via ngrok: ngrok http 3000');
});
