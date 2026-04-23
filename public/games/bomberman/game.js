const shell = createGameShell('bomberman');
const { state, publish, sendEvent, onEvent, setScores, log } = shell;
document.getElementById('controls').textContent = 'Flèches: move | Espace: bombe. Les bombes des 2 joueurs sont partagées en live.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const tile = 32, cols = 20, rows = 15;

let me = { x: 1, y: 1, alive: true, score: 0 };
let bombs = [];
let blasts = [];

const walls = Array.from({ length: rows }, (_, y) =>
  Array.from({ length: cols }, (_, x) => x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || (x % 2 === 0 && y % 2 === 0))
);

function blocked(x, y) {
  return walls[y]?.[x] || bombs.some((b) => b.x === x && b.y === y);
}

function move(dx, dy) {
  const nx = me.x + dx, ny = me.y + dy;
  if (!blocked(nx, ny)) {
    me.x = nx;
    me.y = ny;
  }
}

function placeBomb(owner, x, y) {
  if (bombs.some((b) => b.x === x && b.y === y)) return;
  bombs.push({ owner, x, y, t: Date.now() });
}

addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') move(0, -1);
  if (e.key === 'ArrowDown') move(0, 1);
  if (e.key === 'ArrowLeft') move(-1, 0);
  if (e.key === 'ArrowRight') move(1, 0);
  if (e.code === 'Space') {
    placeBomb('me', me.x, me.y);
    sendEvent('bomberman:bomb', { x: me.x, y: me.y });
  }
});

onEvent(({ type, payload }) => {
  if (type === 'bomberman:bomb') placeBomb('opp', payload.x, payload.y);
  if (type === 'bomberman:frag') {
    me.score += 1;
    log('Frag confirmé !');
  }
});

function explode(b) {
  const area = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => ({ x: b.x + x, y: b.y + y }));
  blasts.push(...area);

  const opp = state.opponentState;
  if (opp?.x != null && area.some((p) => p.x === opp.x && p.y === opp.y) && b.owner === 'me') {
    sendEvent('bomberman:frag', {});
  }

  if (area.some((p) => p.x === me.x && p.y === me.y)) {
    me.alive = false;
    setTimeout(() => {
      me = { x: 1, y: 1, alive: true, score: me.score };
    }, 900);
  }
}

function tick() {
  const now = Date.now();
  blasts = [];
  bombs = bombs.filter((b) => {
    if (now - b.t > 1200) {
      explode(b);
      return false;
    }
    return true;
  });

  publish({ x: me.x, y: me.y, score: me.score, alive: me.alive });
}

function draw() {
  ctx.fillStyle = '#050a1d';
  ctx.fillRect(0, 0, c.width, c.height);

  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (walls[y][x]) {
      ctx.fillStyle = '#26367f';
      ctx.fillRect(x * tile, y * tile, tile - 1, tile - 1);
    }
  }

  const opp = state.opponentState;
  ctx.fillStyle = '#ff9f1c';
  bombs.forEach((b) => { ctx.beginPath(); ctx.arc(b.x * tile + tile / 2, b.y * tile + tile / 2, 8, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = me.alive ? '#00d4ff' : '#666';
  ctx.fillRect(me.x * tile + 6, me.y * tile + 6, tile - 12, tile - 12);
  if (opp?.x != null) {
    ctx.fillStyle = opp.alive === false ? '#555' : '#ffd166';
    ctx.fillRect(opp.x * tile + 6, opp.y * tile + 6, tile - 12, tile - 12);
  }

  ctx.fillStyle = 'rgba(255,80,80,.7)';
  blasts.forEach((p) => ctx.fillRect(p.x * tile + 2, p.y * tile + 2, tile - 4, tile - 4));

  setScores(me.score, opp?.score || 0);
  requestAnimationFrame(draw);
}

setInterval(tick, 100);
draw();
