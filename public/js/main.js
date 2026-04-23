const socket = io();

const usernameInput = document.getElementById('username');
const statusEl = document.getElementById('status');
const gamesGrid = document.getElementById('gamesGrid');
const matchInfo = document.getElementById('matchInfo');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const clock = document.getElementById('clock');

let currentRoomId = null;
let currentGame = null;

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

setInterval(updateClock, 1000);
updateClock();

function pushChat(text) {
  const line = document.createElement('div');
  line.textContent = text;
  chatBox.appendChild(line);
  chatBox.scrollTop = chatBox.scrollHeight;
}

gamesGrid.addEventListener('click', (event) => {
  const target = event.target.closest('.game-card');
  if (!target) return;

  const game = target.dataset.game;
  const username = usernameInput.value.trim() || 'Joueur';

  currentGame = game;
  statusEl.textContent = `Recherche d'adversaire pour ${game.toUpperCase()}...`;

  socket.emit('queue:join', { game, username });
});

sendChatBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (!message || !currentRoomId) return;

  socket.emit('chat:message', {
    roomId: currentRoomId,
    username: usernameInput.value.trim() || 'Joueur',
    message
  });

  chatInput.value = '';
});

socket.on('queue:waiting', ({ message }) => {
  statusEl.textContent = message;
});

socket.on('queue:error', ({ message }) => {
  statusEl.textContent = message;
});

socket.on('match:found', ({ roomId, game, players }) => {
  currentRoomId = roomId;
  currentGame = game;

  statusEl.textContent = `Match trouvé pour ${game.toUpperCase()}!`;
  matchInfo.textContent = `Salon: ${roomId} | Joueurs: ${players.map((p) => p.username).join(' vs ')}`;
  pushChat('Système: Match démarré. Bonne chance !');

  // Ici on redirigera vers le moteur du jeu spécifique.
  // window.location.href = `/games/${game}/index.html?room=${roomId}`;
});

socket.on('chat:message', ({ username, message }) => {
  pushChat(`${username}: ${message}`);
});

socket.on('match:ended', ({ reason }) => {
  statusEl.textContent = reason;
  matchInfo.textContent = 'Le match est terminé.';
  currentRoomId = null;
  currentGame = null;
  pushChat(`Système: ${reason}`);
});

window.addEventListener('beforeunload', () => {
  if (currentRoomId) {
    socket.emit('room:leave', { roomId: currentRoomId });
  }
});
