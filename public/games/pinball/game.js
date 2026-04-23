const shell = createGameShell('pinball');
const { state, publish, setScores } = shell;
document.getElementById('controls').textContent = 'Contrôles: ← → pour les flippers (paddle).';
document.getElementById('roomLabel').textContent = new URLSearchParams(location.search).get('room') || 'auto';

const c=document.getElementById('game'),ctx=c.getContext('2d');
let paddle={x:260,w:120},ball={x:320,y:380,vx:3,vy:-3},score=0;
let bricks=Array.from({length:5},(_,r)=>Array.from({length:10},(_,col)=>({x:40+col*56,y:40+r*28,hp:1})));
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')paddle.x-=25;if(e.key==='ArrowRight')paddle.x+=25;paddle.x=Math.max(0,Math.min(c.width-paddle.w,paddle.x));});
function tick(){ball.x+=ball.vx;ball.y+=ball.vy;if(ball.x<8||ball.x>c.width-8)ball.vx*=-1;if(ball.y<8)ball.vy*=-1;if(ball.y>c.height){ball={x:320,y:380,vx:3,vy:-3};score=Math.max(0,score-100);}if(ball.y>430&&ball.x>paddle.x&&ball.x<paddle.x+paddle.w)ball.vy=-Math.abs(ball.vy);
for(const row of bricks)for(const b of row){if(b.hp&&ball.x>b.x&&ball.x<b.x+50&&ball.y>b.y&&ball.y<b.y+20){b.hp=0;ball.vy*=-1;score+=50;}}
publish({score,ball});}
function draw(){ctx.fillStyle='#030816';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#6aa8ff';ctx.fillRect(paddle.x,440,paddle.w,12);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,8,0,Math.PI*2);ctx.fill();for(const row of bricks)for(const b of row){if(b.hp){ctx.fillStyle='#00d4ff';ctx.fillRect(b.x,b.y,50,20);}}
const opp=state.opponentState;if(opp?.ball){ctx.fillStyle='#ff7b7b';ctx.beginPath();ctx.arc(opp.ball.x,opp.ball.y,5,0,Math.PI*2);ctx.fill();}
setScores(score,opp?.score||0);requestAnimationFrame(draw);}setInterval(tick,16);draw();
