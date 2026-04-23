const shell = createGameShell('bomberman');
const { state, publish, setScores } = shell;
document.getElementById('controls').textContent = 'Contrôles: flèches pour bouger, espace pour poser une bombe.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const tile = 32, cols = 20, rows = 15;
let me = { x: 1, y: 1, alive: true, score: 0 }, bombs = [];
const walls = Array.from({ length: rows }, (_, y) =>
  Array.from({ length: cols }, (_, x) => x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || (x % 2 === 0 && y % 2 === 0))
);

function move(dx, dy) {
  const nx = me.x + dx, ny = me.y + dy;
  if (!walls[ny]?.[nx]) {
    me.x = nx;
    me.y = ny;
  }
}

addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') move(0, -1);
  if (e.key === 'ArrowDown') move(0, 1);
  if (e.key === 'ArrowLeft') move(-1, 0);
  if (e.key === 'ArrowRight') move(1, 0);
  if (e.code === 'Space') bombs.push({ x: me.x, y: me.y, t: Date.now() });
});

function explode(b) {
  const blasts = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => ({ x: b.x + x, y: b.y + y }));
  const opp = state.opponentState;

  if (opp?.x != null && blasts.some((p) => p.x === opp.x && p.y === opp.y)) me.score += 1;
  if (blasts.some((p) => p.x === me.x && p.y === me.y)) {
    me.alive = false;
    setTimeout(() => {
      me = { x: 1, y: 1, alive: true, score: 0 };
    }, 1000);
  }

  return blasts;
}

let blasts = [];
function tick() {
  const now = Date.now();
  blasts = [];
  bombs = bombs.filter((b) => {
    if (now - b.t > 1200) {
      blasts.push(...explode(b));
      return false;
    }
    return true;
  });

  publish({ x: me.x, y: me.y, score: me.score, alive: me.alive });
}

function draw() {
  ctx.fillStyle = '#030816';
  ctx.fillRect(0, 0, c.width, c.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (walls[y][x]) {
        ctx.fillStyle = '#25306f';
        ctx.fillRect(x * tile, y * tile, tile - 1, tile - 1);
      }
    }
  }

  ctx.fillStyle = '#00d4ff';
  ctx.fillRect(me.x * tile + 6, me.y * tile + 6, tile - 12, tile - 12);

  const opp = state.opponentState;
  if (opp?.x != null) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(opp.x * tile + 6, opp.y * tile + 6, tile - 12, tile - 12);
  }

  ctx.fillStyle = '#ff8a00';
  bombs.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x * tile + tile / 2, b.y * tile + tile / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(255,80,80,.7)';
  blasts.forEach((p) => ctx.fillRect(p.x * tile + 2, p.y * tile + 2, tile - 4, tile - 4));

  setScores(me.score, opp?.score || 0);
  requestAnimationFrame(draw);
}

setInterval(tick, 100);
draw();
