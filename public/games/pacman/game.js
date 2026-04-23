const shell = createGameShell('pacman');
const { state, publish, sendEvent, onEvent, setScores, log } = shell;
document.getElementById('controls').textContent = 'Flèches: se déplacer. Mange les power pellets pour stun ton rival.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const tile = 20, cols = 28, rows = 22;
let me = { x: 1, y: 1, dir: [1, 0], score: 0, stunnedUntil: 0 };
const walls = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || (x % 6 === 0 && y % 4 !== 1)));
let pellets = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => !walls[y][x]));

const powerPellets = new Set(['1:1', '26:1', '1:20', '26:20']);

onEvent(({ type, payload }) => {
  if (type === 'pacman:stun') {
    me.stunnedUntil = Date.now() + 1300;
    log(`${payload.by} t'a stun !`);
  }
});

addEventListener('keydown', (e) => {
  const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (d) me.dir = d;
});

function tick() {
  if (Date.now() < me.stunnedUntil) {
    publish({ ...me, pelletsLeft: pellets.flat().filter(Boolean).length });
    return;
  }

  const nx = me.x + me.dir[0], ny = me.y + me.dir[1];
  if (!walls[ny]?.[nx]) {
    me.x = nx;
    me.y = ny;
  }

  if (pellets[me.y][me.x]) {
    pellets[me.y][me.x] = false;
    me.score += 5;
    const key = `${me.x}:${me.y}`;
    if (powerPellets.has(key)) {
      sendEvent('pacman:stun', { by: state.username || 'adversaire' });
      me.score += 25;
      powerPellets.delete(key);
    }
  }

  publish({ x: me.x, y: me.y, score: me.score, stunnedUntil: me.stunnedUntil, pelletsLeft: pellets.flat().filter(Boolean).length });
}

function draw() {
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, c.width, c.height);

  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (walls[y][x]) {
      ctx.fillStyle = '#2452e8';
      ctx.fillRect(x * tile, y * tile, tile - 1, tile - 1);
    } else if (pellets[y][x]) {
      const key = `${x}:${y}`;
      ctx.fillStyle = powerPellets.has(key) ? '#ff5ad1' : '#ffe082';
      const size = powerPellets.has(key) ? 8 : 4;
      ctx.fillRect(x * tile + (10 - size / 2), y * tile + (10 - size / 2), size, size);
    }
  }

  ctx.fillStyle = Date.now() < me.stunnedUntil ? '#888' : '#ffe600';
  ctx.beginPath(); ctx.arc(me.x * tile + 10, me.y * tile + 10, 8, 0, Math.PI * 2); ctx.fill();

  const opp = state.opponentState;
  if (opp?.x != null) {
    ctx.fillStyle = Date.now() < (opp.stunnedUntil || 0) ? '#555' : '#ff6b6b';
    ctx.beginPath(); ctx.arc(opp.x * tile + 10, opp.y * tile + 10, 8, 0, Math.PI * 2); ctx.fill();
  }

  setScores(me.score, opp?.score || 0);
  requestAnimationFrame(draw);
}

setInterval(tick, 110);
draw();
