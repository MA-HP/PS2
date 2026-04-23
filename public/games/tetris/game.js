const shell = createGameShell('tetris');
const { state, publish, setScores } = shell;
document.getElementById('controls').textContent = 'Contrôles: ← → déplacer, ↑ rotation, ↓ accélérer.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c = document.getElementById('game');
const ctx = c.getContext('2d');
const W=10,H=20,S=22,ox=70,oy=20;
const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
let board=Array.from({length:H},()=>Array(W).fill(0)),piece=null,score=0;
function newPiece(){const m=structuredClone(shapes[Math.floor(Math.random()*shapes.length)]);piece={m,x:3,y:0};if(hit(0,0,m)){board=Array.from({length:H},()=>Array(W).fill(0));score=0;}}
function rot(m){return m[0].map((_,i)=>m.map(r=>r[i]).reverse());}
function hit(dx,dy,m=piece.m){for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(m[y][x]){const nx=piece.x+x+dx,ny=piece.y+y+dy;if(nx<0||nx>=W||ny>=H|| (ny>=0&&board[ny][nx])) return true;}return false;}
function merge(){piece.m.forEach((r,y)=>r.forEach((v,x)=>{if(v&&piece.y+y>=0)board[piece.y+y][piece.x+x]=1;}));for(let y=H-1;y>=0;y--)if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(W).fill(0));score+=100;y++;}newPiece();}
addEventListener('keydown',e=>{if(!piece)return; if(e.key==='ArrowLeft'&&!hit(-1,0))piece.x--; if(e.key==='ArrowRight'&&!hit(1,0))piece.x++; if(e.key==='ArrowDown'&&!hit(0,1))piece.y++; if(e.key==='ArrowUp'){const r=rot(piece.m);if(!hit(0,0,r))piece.m=r;}});
function tick(){if(!piece)newPiece(); if(!hit(0,1))piece.y++; else merge(); publish({score});}
function drawCell(x,y,col){ctx.fillStyle=col;ctx.fillRect(ox+x*S,oy+y*S,S-2,S-2);}
function draw(){ctx.fillStyle='#030816';ctx.fillRect(0,0,c.width,c.height);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(board[y][x])drawCell(x,y,'#00d4ff');if(piece)piece.m.forEach((r,y)=>r.forEach((v,x)=>v&&drawCell(piece.x+x,piece.y+y,'#7d8bff')));const opp=state.opponentState;setScores(score,opp?.score||0);ctx.fillStyle='#fff';ctx.fillText('Tetris Race',340,60);requestAnimationFrame(draw);} 
setInterval(tick,450);draw();
