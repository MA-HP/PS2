const shell = createGameShell('pinball');
const { state, publish, sendEvent, onEvent, setScores, log } = shell;
document.getElementById('controls').textContent = '← → déplacer le paddle. Combo de 3 briques = malus chez l’adversaire.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
let paddle = { x: 260, w: 120 };
let ball = { x: 320, y: 380, vx: 3, vy: -3 };
let score = 0;
let combo = 0;
let debuffUntil = 0;
let bricks = Array.from({ length: 5 }, (_, r) => Array.from({ length: 10 }, (_, col) => ({ x: 40 + col * 56, y: 40 + r * 28, hp: 1 })));

onEvent(({ type, payload }) => {
  if (type === 'pinball:debuff') {
    debuffUntil = Date.now() + 3000;
    log(`${payload.by} a réduit ton paddle !`);
  }
});

addEventListener('keydown', (e) => {
  const speed = 24;
  if (e.key === 'ArrowLeft') paddle.x -= speed;
  if (e.key === 'ArrowRight') paddle.x += speed;
  paddle.x = Math.max(0, Math.min(c.width - paddle.w, paddle.x));
});

function resetBall() {
  ball = { x: 320, y: 380, vx: (Math.random() > 0.5 ? 3 : -3), vy: -3 };
}

function tick() {
  paddle.w = Date.now() < debuffUntil ? 80 : 120;

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x < 8 || ball.x > c.width - 8) ball.vx *= -1;
  if (ball.y < 8) ball.vy *= -1;

  if (ball.y > c.height + 10) {
    score = Math.max(0, score - 100);
    combo = 0;
    resetBall();
  }

  if (ball.y > 430 && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
    ball.vy = -Math.abs(ball.vy);
    const rel = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.vx = rel * 4;
  }

  for (const row of bricks) for (const b of row) {
    if (b.hp && ball.x > b.x && ball.x < b.x + 50 && ball.y > b.y && ball.y < b.y + 20) {
      b.hp = 0;
      ball.vy *= -1;
      score += 50;
      combo += 1;
      if (combo >= 3) {
        sendEvent('pinball:debuff', { by: state.username });
        combo = 0;
      }
    }
  }

  if (bricks.flat().every((b) => b.hp === 0)) {
    bricks = Array.from({ length: 5 }, (_, r) => Array.from({ length: 10 }, (_, col) => ({ x: 40 + col * 56, y: 40 + r * 28, hp: 1 })));
  }

  publish({ score, ball, paddleW: paddle.w, paddleX: paddle.x });
}

function draw() {
  ctx.fillStyle = '#030816';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = '#6aa8ff';
  ctx.fillRect(paddle.x, 440, paddle.w, 12);

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2); ctx.fill();

  for (const row of bricks) for (const b of row) if (b.hp) {
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(b.x, b.y, 50, 20);
  }

  const opp = state.opponentState;
  if (opp?.ball) {
    ctx.fillStyle = '#ff7b7b';
    ctx.beginPath(); ctx.arc(opp.ball.x, opp.ball.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(380 + (opp.paddleX || 0) * 0.35, 455, (opp.paddleW || 120) * 0.35, 6);
  }

  setScores(score, opp?.score || 0);
  requestAnimationFrame(draw);
}

setInterval(tick, 16);
draw();
