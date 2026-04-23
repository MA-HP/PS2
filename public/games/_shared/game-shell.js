window.createGameShell = function createGameShell(gameName) {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  const username = params.get('username') || `Joueur-${Math.floor(Math.random() * 1000)}`;
  const socket = io();
  const logEl = document.getElementById('log');
  const meEl = document.getElementById('meScore');
  const oppEl = document.getElementById('oppScore');

  const state = {
    roomId,
    username,
    opponentState: {},
    opponentName: 'Adversaire'
  };

  function log(text) {
    const div = document.createElement('div');
    div.textContent = text;
    logEl.prepend(div);
  }

  if (!roomId) {
    log('Room manquante. Retourne au hub.');
  }

  if (roomId) {
    socket.emit('room:rejoin', { roomId, username });
  } else {
    socket.emit('queue:join', { game: gameName, username });
  }

  socket.on('match:found', (match) => {
    if (roomId && match.roomId !== roomId) return;
    state.roomId = match.roomId;
    const me = match.players.find((p) => p.username === username);
    const opp = match.players.find((p) => p.username !== (me?.username || username));
    if (opp) state.opponentName = opp.username;
    log(`Match lancé contre ${state.opponentName}`);
  });

  socket.on('game:update', ({ payload }) => {
    state.opponentState = payload || {};
    if (payload?.username) state.opponentName = payload.username;
  });

  socket.on('match:ended', ({ reason }) => {
    log(reason);
  });

  function publish(payload) {
    if (!state.roomId) return;
    socket.emit('game:update', {
      roomId: state.roomId,
      payload: { username, ...payload }
    });
  }

  function setScores(me, opp) {
    meEl.textContent = `${username}: ${me}`;
    oppEl.textContent = `${state.opponentName}: ${opp ?? 0}`;
  }

  document.getElementById('backBtn').addEventListener('click', () => {
    if (state.roomId) socket.emit('room:leave', { roomId: state.roomId });
    window.location.href = '/';
  });

  return { socket, state, publish, setScores, log };
};
