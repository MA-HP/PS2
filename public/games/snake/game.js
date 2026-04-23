const shell = createGameShell('snake');
const { state, publish, sendEvent, onEvent, setScores, log } = shell;
document.getElementById('controls').textContent = 'Flèches: direction. Croque la pomme, évite murs/corps adverses.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const cell = 20, cols = 32, rows = 24;
let dir = { x: 1, y: 0 }, snake = [{ x: 4, y: 4 }], food = { x: 12, y: 10 }, score = 0;

onEvent(({ type, payload }) => {
  if (type === 'snake:food') food = payload.food;
  if (type === 'snake:win') log(`${payload.winner} gagne la manche !`);
});

addEventListener('keydown', (e) => {
  const next = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (!next) return;
  if (snake.length > 1 && next[0] === -dir.x && next[1] === -dir.y) return;
  dir = { x: next[0], y: next[1] };
});

function reset() {
  snake = [{ x: 4, y: 4 }];
  dir = { x: 1, y: 0 };
}

function randomFood() {
  return { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
}

function tick() {
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  const oppBody = state.opponentState.body || [];
  const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
  const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
  const hitOpp = oppBody.some((s) => s.x === head.x && s.y === head.y);

  if (hitWall || hitSelf || hitOpp) {
    sendEvent('snake:win', { winner: state.opponentName });
    score = Math.max(0, score - 10);
    reset();
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    food = randomFood();
    sendEvent('snake:food', { food });
  } else {
    snake.pop();
  }

  publish({ score, body: snake, head, food });
}

function drawBody(body, color) {
  ctx.fillStyle = color;
  body.forEach((s) => ctx.fillRect(s.x * cell + 2, s.y * cell + 2, cell - 4, cell - 4));
}

function draw() {
  ctx.fillStyle = '#040b1f';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'rgba(100,120,255,.13)';
  for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) ctx.strokeRect(x * cell, y * cell, cell, cell);

  drawBody(snake, '#00d4ff');
  drawBody(state.opponentState.body || [], '#ffd166');

  ctx.fillStyle = '#ff4d7d';
  ctx.fillRect(food.x * cell + 3, food.y * cell + 3, cell - 6, cell - 6);

  setScores(score, state.opponentState.score || 0);
  requestAnimationFrame(draw);
}

setInterval(tick, 95);
draw();
