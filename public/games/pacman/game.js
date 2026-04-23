const shell = createGameShell('pacman');
const { state, publish, setScores } = shell;
document.getElementById('controls').textContent = 'Contrôles: flèches. Objectif: manger un max de points.';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c=document.getElementById('game'),ctx=c.getContext('2d');
const tile=20, cols=28, rows=22;
let me={x:1,y:1,dir:[1,0],score:0};
const walls=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>x===0||y===0||x===cols-1||y===rows-1||((x%6===0)&&(y%4!==1))));
let pellets=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>!walls[y][x]));
addEventListener('keydown',e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(m)me.dir=m;});
function tick(){const nx=me.x+me.dir[0],ny=me.y+me.dir[1];if(!walls[ny]?.[nx]){me.x=nx;me.y=ny;} if(pellets[me.y][me.x]){pellets[me.y][me.x]=false;me.score+=5;} publish({x:me.x,y:me.y,score:me.score});}
function draw(){ctx.fillStyle='#01030d';ctx.fillRect(0,0,c.width,c.height);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(walls[y][x]){ctx.fillStyle='#233fbc';ctx.fillRect(x*tile,y*tile,tile-1,tile-1);}else if(pellets[y][x]){ctx.fillStyle='#ffe082';ctx.fillRect(x*tile+8,y*tile+8,4,4);}}
ctx.fillStyle='#ffe600';ctx.beginPath();ctx.arc(me.x*tile+10,me.y*tile+10,8,0,Math.PI*2);ctx.fill();
const opp=state.opponentState;if(opp?.x!=null){ctx.fillStyle='#ff6b6b';ctx.beginPath();ctx.arc(opp.x*tile+10,opp.y*tile+10,8,0,Math.PI*2);ctx.fill();}
setScores(me.score,opp?.score||0);requestAnimationFrame(draw);} 
setInterval(tick,120);draw();
