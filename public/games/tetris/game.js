const shell = createGameShell('tetris');
const { state, publish, sendEvent, onEvent, setScores } = shell;

document.getElementById('controls').textContent = '← → déplacer | ↑ rotation | ↓ descente rapide | Espace drop';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const W = 10, H = 20, S = 20, OX = 40, OY = 30;
const shapes = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]]
];
let board = Array.from({ length: H }, () => Array(W).fill(0));
let piece = null;
let score = 0;

const rotate = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
const clone = (m) => m.map((r) => [...r]);

function spawn() {
  piece = { m: clone(shapes[(Math.random() * shapes.length) | 0]), x: 3, y: 0 };
  if (collide(0, 0, piece.m)) {
    score = 0;
    board = Array.from({ length: H }, () => Array(W).fill(0));
  }
}

function collide(dx, dy, m = piece.m) {
  for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
    if (!m[y][x]) continue;
    const nx = piece.x + x + dx, ny = piece.y + y + dy;
    if (nx < 0 || nx >= W || ny >= H || (ny >= 0 && board[ny][nx])) return true;
  }
  return false;
}

function lock() {
  piece.m.forEach((row, y) => row.forEach((v, x) => {
    if (v && piece.y + y >= 0) board[piece.y + y][piece.x + x] = 1;
  }));

  let cleared = 0;
  for (let y = H - 1; y >= 0; y--) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(W).fill(0));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    score += cleared * 100;
    if (cleared >= 2) sendEvent('tetris:garbage', { lines: cleared - 1 });
  }
  spawn();
}

function addGarbage(lines) {
  for (let i = 0; i < lines; i++) {
    board.shift();
    const gap = (Math.random() * W) | 0;
    board.push(Array.from({ length: W }, (_, x) => (x === gap ? 0 : 1)));
  }
}

onEvent(({ type, payload }) => {
  if (type === 'tetris:garbage') addGarbage(payload.lines || 0);
});

addEventListener('keydown', (e) => {
  if (!piece) return;
  if (e.key === 'ArrowLeft' && !collide(-1, 0)) piece.x -= 1;
  if (e.key === 'ArrowRight' && !collide(1, 0)) piece.x += 1;
  if (e.key === 'ArrowDown' && !collide(0, 1)) piece.y += 1;
  if (e.key === 'ArrowUp') {
    const r = rotate(piece.m);
    if (!collide(0, 0, r)) piece.m = r;
  }
  if (e.key === ' ') while (!collide(0, 1)) piece.y += 1;
});

function tick() {
  if (!piece) spawn();
  if (!collide(0, 1)) piece.y += 1; else lock();
  publish({ score, board, piece });
}

function drawBoard(b, ox, color) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!b[y]?.[x]) continue;
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * S, OY + y * S, S - 1, S - 1);
  }
}

function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, c.width, c.height);

  drawBoard(board, OX, '#00d4ff');
  if (piece) piece.m.forEach((r, y) => r.forEach((v, x) => v && ctx.fillRect(OX + (piece.x + x) * S, OY + (piece.y + y) * S, S - 1, S - 1)));

  const opp = state.opponentState;
  drawBoard(opp.board || [], 340, '#ff8fab');
  if (opp.piece) {
    ctx.fillStyle = '#ffc6d8';
    opp.piece.m.forEach((r, y) => r.forEach((v, x) => v && ctx.fillRect(340 + (opp.piece.x + x) * S, OY + (opp.piece.y + y) * S, S - 1, S - 1)));
  }

  ctx.fillStyle = '#fff';
  ctx.fillText('YOU', OX, 18);
  ctx.fillText('OPP', 340, 18);
  setScores(score, opp.score || 0);
  requestAnimationFrame(draw);
}

setInterval(tick, 350);
draw();
