window.createGameShell = function createGameShell(gameName) {
  const params = new URLSearchParams(window.location.search);
  const initialRoomId = params.get('room');
  const username = params.get('username') || `Joueur-${Math.floor(Math.random() * 1000)}`;
  const socket = io();

  const logEl = document.getElementById('log');
  const meEl = document.getElementById('meScore');
  const oppEl = document.getElementById('oppScore');

  const state = {
    roomId: initialRoomId,
    username,
    mySocketId: null,
    opponentId: null,
    opponentName: 'Adversaire',
    opponentState: {},
    connected: false
  };

  let eventHandler = () => {};

  const log = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    logEl.prepend(div);
  };

  socket.on('connect', () => {
    state.mySocketId = socket.id;
    state.connected = true;
    if (state.roomId) {
      socket.emit('room:rejoin', { roomId: state.roomId, username });
    } else {
      socket.emit('queue:join', { game: gameName, username });
      log('En attente d’un adversaire...');
    }
  });

  socket.on('queue:error', ({ message }) => log(`Erreur: ${message}`));
  socket.on('queue:waiting', ({ message }) => log(message));

  socket.on('match:found', (match) => {
    if (state.roomId && match.roomId !== state.roomId) return;
    state.roomId = match.roomId;

    const opponent = match.players.find((p) => p.socketId !== state.mySocketId);
    if (opponent) {
      state.opponentId = opponent.socketId;
      state.opponentName = opponent.username;
    }

    log(`Match prêt: ${username} vs ${state.opponentName}`);
  });

  socket.on('game:update', ({ from, payload }) => {
    if (state.opponentId && from !== state.opponentId) return;
    state.opponentId = from;
    state.opponentState = payload || {};
    if (payload?.username) state.opponentName = payload.username;
  });

  socket.on('game:event', (evt) => {
    if (state.opponentId && evt.from !== state.opponentId) return;
    eventHandler(evt);
  });

  socket.on('match:ended', ({ reason }) => {
    log(`Match terminé: ${reason}`);
  });

  const publish = (payload) => {
    if (!state.roomId) return;
    socket.emit('game:update', {
      roomId: state.roomId,
      payload: { username, ...payload }
    });
  };

  const sendEvent = (type, payload = {}) => {
    if (!state.roomId) return;
    socket.emit('game:event', {
      roomId: state.roomId,
      type,
      payload
    });
  };

  const onEvent = (handler) => {
    eventHandler = handler;
  };

  const setScores = (me, opp) => {
    meEl.textContent = `${username}: ${me}`;
    oppEl.textContent = `${state.opponentName}: ${opp ?? 0}`;
  };

  document.getElementById('backBtn').addEventListener('click', () => {
    if (state.roomId) socket.emit('room:leave', { roomId: state.roomId });
    window.location.href = '/';
  });

  return { socket, state, publish, sendEvent, onEvent, setScores, log };
};
