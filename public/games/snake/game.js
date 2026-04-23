const shell = createGameShell('snake');
const { state, publish, setScores } = shell;
document.getElementById('controls').textContent = 'Contrôles: flèches directionnelles.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const cell = 20, cols = 32, rows = 24;
let dir = { x: 1, y: 0 }, snake = [{ x: 6, y: 6 }], food = { x: 10, y: 10 }, score = 0;

addEventListener('keydown', (e) => {
  const d = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] }[e.key];
  if (!d) return;
  if (snake.length > 1 && d[0] === -dir.x && d[1] === -dir.y) return;
  dir = { x: d[0], y: d[1] };
});

function spawnFood(){ food = { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)}; }
function tick(){
  const head = { x: (snake[0].x + dir.x + cols)%cols, y:(snake[0].y+dir.y+rows)%rows};
  if (snake.some((s) => s.x===head.x && s.y===head.y)) { snake=[{x:6,y:6}]; score=0; dir={x:1,y:0}; }
  snake.unshift(head);
  if (head.x===food.x && head.y===food.y) { score += 10; spawnFood(); } else snake.pop();
  publish({ score, head, food });
}

function draw(){
  ctx.fillStyle='#030816'; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='rgba(93,145,255,.2)';
  for(let x=0;x<cols;x++) for(let y=0;y<rows;y++) ctx.strokeRect(x*cell,y*cell,cell,cell);
  ctx.fillStyle='#00d4ff'; snake.forEach((s)=>ctx.fillRect(s.x*cell+2,s.y*cell+2,cell-4,cell-4));
  ctx.fillStyle='#ff4d7d'; ctx.fillRect(food.x*cell+3,food.y*cell+3,cell-6,cell-6);

  const opp = state.opponentState;
  if (opp?.head) { ctx.fillStyle='#ffd166'; ctx.fillRect(opp.head.x*cell+5,opp.head.y*cell+5,cell-10,cell-10); }
  setScores(score, opp?.score || 0);
  requestAnimationFrame(draw);
}
setInterval(tick, 100);
draw();
