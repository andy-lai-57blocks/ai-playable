/**
 * Royal Match Engine
 * 
 * Specialized match-3 engine modeled after the Vungle playable ad:
 * - Royal treasure theme with palace background
 * - Character portrait on the left
 * - Ornate frame around the board
 * - Collect-target mechanic (collect enough gems to win)
 * - No moves counter (score-only)
 * - Timed mode or score-only
 * 
 * Derived from match3.engine.ts but with layout and mechanics
 * specific to the original game.
 */
import { PlayableDesignSpec, PlayableEngine, resolveColors } from "./engine.interface";

export const royalMatchEngine: PlayableEngine = {
  id: "royal-match",
  name: "Royal Match",

  defaultItems: {
    easy:   ["💎","🔮","💠","⚡","🌟","🔷","💖"],
    normal: ["💎","🔮","💠","⚡","🌟","🔷","💖"],
    hard:   ["💎","🔮","💠","⚡","🌟","🔷","💖","🔥"],
  },

  defaultGameplay: {
    easy:   { cols: 5, rows: 7, targetScore: 300, timeLimit: 90 },
    normal: { cols: 5, rows: 7, targetScore: 400, timeLimit: 60 },
    hard:   { cols: 5, rows: 7, targetScore: 500, timeLimit: 45 },
  },

  generateStyles(_spec: PlayableDesignSpec): string {
    return /*css*/`
html,body{width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center}
#game-wrapper{position:relative;width:min(100vw,669px);height:min(100vh,100vw*541/669);aspect-ratio:669/541;overflow:hidden}
#game-canvas{position:absolute;top:0;left:0;width:100%;height:100%}
#game-ui{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:flex;flex-direction:column;align-items:center;padding:8px;box-sizing:border-box}
#end-overlay{display:none;position:absolute;inset:0;background:rgba(0,0,0,0.85);flex-direction:column;align-items:center;justify-content:center;z-index:10}
#end-overlay.show{display:flex}
#end-icon{width:clamp(120px,40vw,280px);height:auto;filter:drop-shadow(0 0 30px rgba(255,215,0,0.6))}
#end-msg{font-family:system-ui,sans-serif;font-size:clamp(20px,5vw,40px);font-weight:900;color:#ffd700;text-align:center;margin-bottom:8px;text-shadow:0 2px 16px rgba(0,0,0,0.6)}
#end-score{font-family:system-ui,sans-serif;font-size:clamp(14px,3vw,22px);color:#fff;margin-bottom:12px}
#end-cta{pointer-events:auto;font-family:system-ui,sans-serif;font-size:clamp(14px,3vw,22px);font-weight:800;color:#1a1a2e;background:linear-gradient(135deg,#ffd700,#ffaa00);border:none;border-radius:50px;padding:12px 40px;cursor:pointer;box-shadow:0 4px 24px rgba(255,215,0,0.5);transition:transform 0.2s}
#end-cta:active{transform:scale(0.95)}
    `.trim();
  },

  generateMarkup(_spec: PlayableDesignSpec): string {
    return /*html*/`
<div id="game-wrapper">
<canvas id="game-canvas"></canvas>
<div id="game-ui"></div>
<div id="end-overlay">
  <img id="end-icon" src="" alt="" />
  <div id="end-msg"></div>
  <div id="end-score">Score: <span id="end-score-val">0</span></div>
  <button id="end-cta" onclick="window.__playableCTA?.()">Install Now</button>
</div>
</div>
    `.trim();
  },

  generateInit(spec: PlayableDesignSpec): string {
    const items = spec.theme.items.length >= 6 ? spec.theme.items : royalMatchEngine.defaultItems[spec.difficulty] || royalMatchEngine.defaultItems.normal;
    const gp = { ...(royalMatchEngine.defaultGameplay[spec.difficulty] || royalMatchEngine.defaultGameplay.normal), ...spec.gameplay };
    const itemImages = spec.itemImages || [];
    const useImages = itemImages.length > 0;
    // When images are available, limit items count to match (rest use emoji fallback)
    const effectiveItems = useImages ? items.slice(0, Math.max(itemImages.length, 4)) : items;

    return /*js*/`
(function(){
const PI=Math.PI,cos=Math.cos,sin=Math.sin,abs=Math.abs,floor=Math.floor,random=Math.random;
const canvas=document.getElementById('game-canvas'),ctx=canvas.getContext('2d');
const wrapper=document.getElementById('game-wrapper');
const items=${JSON.stringify(effectiveItems)};
const COLS=${gp.cols},ROWS=${gp.rows},TARGET=${gp.targetScore},TIME_LIMIT=${gp.timeLimit||60};
const useImages=${useImages};
const itemImgUrls=${JSON.stringify(itemImages)};

let dpr=window.devicePixelRatio||1,vw,vh,cellSize,boardX,boardY;
let grid=[],selected=null,score=0,gameOver=false,timeLeft=TIME_LIMIT,timerInterval=null;
let particles=[],stars=[],shakeX=0,shakeY=0,shakeDur=0,tweens=[];
// ── Tween animation ──
function addTween(r,c,fromR,fromC,dur){
  tweens.push({r,c,fr:fromR,fc:fromC,t:0,dur:dur||200});
}
function updateTweens(dt){
  for(let i=tweens.length-1;i>=0;i--){
    const tw=tweens[i];tw.t+=dt;
    if(tw.t>=tw.dur)tweens.splice(i,1);
  }
}

// ── DOM ──
const elOverlay=document.getElementById('end-overlay'),elEndMsg=document.getElementById('end-msg'),elEndScore=document.getElementById('end-score-val'),elEndCta=document.getElementById('end-cta'),elEndIcon=document.getElementById('end-icon');
elEndCta.textContent=${JSON.stringify(spec.copy.ctaText)};

// ── Preload images ──
const itemImgs=[];let imgsReady=!itemImgUrls.length;
if(itemImgUrls.length){let loaded=0;itemImgUrls.forEach((url,i)=>{const img=new Image();const cb=()=>{loaded++;if(loaded===itemImgUrls.length)imgsReady=true};img.onload=cb;img.onerror=cb;img.src=url;if(img.complete)cb();itemImgs.push(img)})}

const mainBgUrl=${JSON.stringify(spec.bgImageUrl||"")};
let mainBgImg=null;if(mainBgUrl){mainBgImg=new Image();mainBgImg.src=mainBgUrl;document.body.style.background='url('+mainBgUrl+') center/cover no-repeat'}

const boardBgUrl=${JSON.stringify(spec.boardBgUrl||spec.bgImageUrl||"")};
let boardBgImg=null;if(boardBgUrl){boardBgImg=new Image();boardBgImg.src=boardBgUrl}

const charUrl=${JSON.stringify(spec.characterUrl||"")};
let charImg=null;if(charUrl){charImg=new Image();charImg.src=charUrl}

const frameUrl=${JSON.stringify(spec.frameUrl||"")};
let frameImg=null;if(frameUrl){frameImg=new Image();frameImg.src=frameUrl}

const winIconUrl=${JSON.stringify((spec as any).winIconUrl||"")};
const loseIconUrl=${JSON.stringify((spec as any).loseIconUrl||"")};
let winImg=null,loseImg=null;
if(winIconUrl){winImg=new Image();winImg.src=winIconUrl}
if(loseIconUrl){loseImg=new Image();loseImg.src=loseIconUrl}

// ── Timer ──
timerInterval=setInterval(()=>{if(gameOver)return;timeLeft--;if(timeLeft<=0)endGame('lose')},1000);

// ── Resize ──
function resize(){
  const root=wrapper;vw=root.clientWidth;vh=root.clientHeight;
  dpr=window.devicePixelRatio||1;canvas.width=vw*dpr;canvas.height=vh*dpr;
  canvas.style.width=vw+'px';canvas.style.height=vh+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
  // Board: 5x7 grid matching asset_21 panel aspect (~3:4 portrait)
  const maxW=vw*0.52,maxH=vh*0.64;
  cellSize=floor(Math.min(maxW/COLS,maxH/ROWS));
  boardX=vw*0.30;boardY=(vh-cellSize*ROWS)/2-8;
  initStars();
}
function initStars(){stars=[];for(let i=0;i<60;i++)stars.push({x:random()*vw,y:random()*vh,r:random()*1.5+0.5,s:random()*0.2+0.05})}

// ── Board logic ──
function createBoard(){grid=[];for(let r=0;r<ROWS;r++){grid[r]=[];for(let c=0;c<COLS;c++){let v,at=0;do{v=floor(random()*items.length);at++}while(hasMatch(r,c,v)&&at<50);grid[r][c]=v}}}
function hasMatch(r,c,v){if(c>=2&&grid[r][c-1]===v&&grid[r][c-2]===v)return true;if(r>=2&&(grid[r-1]||[])[c]===v&&(grid[r-2]||[])[c]===v)return true;return false}
function findMatches(){const m=new Set();for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++){if(grid[r][c]===grid[r][c+1]&&grid[r][c]===grid[r][c+2]){m.add(r+','+c);m.add(r+','+(c+1));m.add(r+','+(c+2))}}for(let c=0;c<COLS;c++)for(let r=0;r<ROWS-2;r++){if(grid[r][c]===grid[r+1][c]&&grid[r][c]===grid[r+2][c]){m.add(r+','+c);m.add((r+1)+','+c);m.add((r+2)+','+c)}}return m}
function applyGravity(){for(let c=0;c<COLS;c++){let wr=ROWS-1;for(let r=ROWS-1;r>=0;r--){if(grid[r][c]!==-1){grid[wr][c]=grid[r][c];if(wr!==r)grid[r][c]=-1;wr--}}for(let r=wr;r>=0;r--){let v,at=0;do{v=floor(random()*items.length);at++}while(hasMatch(r,c,v)&&at<20);grid[r][c]=v}}}
function swap(r1,c1,r2,c2){const t=grid[r1][c1];grid[r1][c1]=grid[r2][c2];grid[r2][c2]=t}

// ── Particles ──
function spawnParticles(x,y,count){for(let i=0;i<count;i++){const a=random()*PI*2,s=random()*3+2;particles.push({x,y,vx:cos(a)*s,vy:sin(a)*s,life:1,decay:random()*0.02+0.01,size:random()*4+2,color:['#ffd700','#ffaa00','#ffe066'][floor(random()*3)]})}}
function shake(intensity){shakeX=(random()-.5)*intensity*2;shakeY=(random()-.5)*intensity*2;shakeDur=Math.min(shakeDur+200,400)}

// ── Match handling ──
function processMatches(matches){
  let combo=0;const processed=new Set();
  function cascade(initial){
    const m=initial||findMatches();if(m.size===0)return;
    combo++;const pts=m.size*10*combo;
    for(const k of m){const [r,c]=k.split(',').map(Number);if(!processed.has(k)){spawnParticles(boardX+c*cellSize+cellSize/2,boardY+r*cellSize+cellSize/2,8);processed.add(k);grid[r][c]=-1}}
    score+=pts;shake(combo*3);applyGravity();
    setTimeout(()=>cascade(null),250);
  }
  cascade(matches);setTimeout(checkEnd,250*(combo+1)+200);
}

function checkEnd(){if(gameOver)return;if(score>=TARGET)endGame('win')}
function endGame(result){
  gameOver=true;if(timerInterval)clearInterval(timerInterval);
  elOverlay.classList.add('show');
  // Only show the end icon, hide text/score/CTA
  elEndMsg.style.display='none';
  elEndScore.parentElement.style.display='none';
  elEndCta.style.display='none';
  if(result==='win'&&winImg&&winImg.complete&&winImg.naturalWidth>0){
    elEndIcon.src=winIconUrl;elEndIcon.style.display=''
  }else if(result==='lose'&&loseImg&&loseImg.complete&&loseImg.naturalWidth>0){
    elEndIcon.src=loseIconUrl;elEndIcon.style.display=''
  }else{elEndIcon.style.display='none'}
}

// ── Input (direction-based drag/swipe) ──
function getCell(ex,ey){const c=floor((ex-boardX)/cellSize),r=floor((ey-boardY)/cellSize);if(c>=0&&c<COLS&&r>=0&&r<ROWS)return{r,c};return null}
function trySwap(r1,c1,r2,c2){
  swap(r1,c1,r2,c2);const m=findMatches();
  if(m.size>0)processMatches(m);else{swap(r1,c1,r2,c2);shake(4)}
}

let dragging=false,dragCell=null,dragSX=0,dragSY=0,dragDone=false;
function onDown(e){
  if(gameOver)return;e.preventDefault();
  const t=e.touches?e.touches[0]:e;
  const cell=getCell(t.clientX,t.clientY);
  if(!cell)return;
  dragging=true;dragDone=false;
  dragCell={r:cell.r,c:cell.c};
  dragSX=t.clientX;dragSY=t.clientY;
  selected={r:cell.r,c:cell.c};
}
function onMove(e){
  if(!dragging||dragDone||gameOver)return;
  const t=e.touches?e.touches[0]:e;
  const dx=t.clientX-dragSX,dy=t.clientY-dragSY;
  const th=cellSize*0.5; // drag threshold: half a cell
  if(abs(dx)<th&&abs(dy)<th)return;
  // Determine direction
  let dr=0,dc=0;
  if(abs(dx)>abs(dy)){dc=dx>0?1:-1}else{dr=dy>0?1:-1}
  const nr=dragCell.r+dr,nc=dragCell.c+dc;
  if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS){
    dragDone=true;
    trySwap(dragCell.r,dragCell.c,nr,nc);
    selected=null;
  }
}
function onUp(e){
  if(!dragging)return;
  dragging=false;
  if(!dragDone){selected=null}
}

canvas.addEventListener('touchstart',onDown,{passive:false});
canvas.addEventListener('touchmove',onMove,{passive:false});
canvas.addEventListener('touchend',onUp,{passive:false});
canvas.addEventListener('mousedown',onDown);
canvas.addEventListener('mousemove',(e)=>{if(dragging)onMove(e)});
canvas.addEventListener('mouseup',onUp);
canvas.addEventListener('mouseleave',onUp);

// ── Render ──
function drawStarfield(){for(const s of stars){s.y+=s.s;if(s.y>vh)s.y=0;ctx.fillStyle='rgba(255,255,255,'+(s.r/2)+')';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,PI*2);ctx.fill()}}

function draw(){
  const now=performance.now();updateTweens(16);
  ctx.clearRect(0,0,vw,vh);
  // Background
  if(mainBgImg&&mainBgImg.complete&&mainBgImg.naturalWidth>0){
    ctx.drawImage(mainBgImg,0,0,vw,vh);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,vw,vh);
  }else{ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,vw,vh)}
  ctx.save();
  if(shakeDur>0){const s=shakeDur/300;ctx.translate(shakeX*s,shakeY*s);shakeDur-=16}
  drawStarfield();
  const brdW=cellSize*COLS+16,brdH=cellSize*ROWS+16;

  // Frame behind board
  if(frameImg&&frameImg.complete&&frameImg.naturalWidth>0){
    const p=32;ctx.globalAlpha=0.35;ctx.drawImage(frameImg,boardX-p,boardY-p,brdW+p*2,brdH+p*2);ctx.globalAlpha=1
  }

  // Board background (asset_21 — full panel image, stretch to fit)
  if(boardBgImg&&boardBgImg.complete&&boardBgImg.naturalWidth>0){
    ctx.save();ctx.beginPath();roundRect(boardX-8,boardY-8,brdW,brdH,16);ctx.clip();
    ctx.drawImage(boardBgImg,boardX-8,boardY-8,brdW,brdH);ctx.restore()
  }
  // Board panel
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();roundRect(boardX-8,boardY-8,brdW,brdH,16);ctx.fill();
  ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=2;ctx.beginPath();roundRect(boardX-8,boardY-8,brdW,brdH,16);ctx.stroke();

  // Cells
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let ox=0,oy=0;
    // Apply tween offset
    for(const tw of tweens){
      const p=Math.min(tw.t/tw.dur,1);const e=1-Math.pow(1-p,3); // ease-out
      if(tw.r===r&&tw.c===c){ox=(tw.fc-c)*cellSize*(1-e);oy=(tw.fr-r)*cellSize*(1-e)}
    }
    const cx=boardX+c*cellSize+ox,cy=boardY+r*cellSize+oy;
    const isSel=selected&&selected.r===r&&selected.c===c;
    // Selected gem: glow behind it
    if(isSel){
      ctx.fillStyle='rgba(255,215,0,0.25)';ctx.beginPath();
      ctx.arc(cx+cellSize/2,cy+cellSize/2,cellSize*0.52,0,PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,215,0,0.10)';ctx.beginPath();
      ctx.arc(cx+cellSize/2,cy+cellSize/2,cellSize*0.65,0,PI*2);ctx.fill();
    }
    ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(cx+2,cy+2,cellSize-4,cellSize-4);
    if(grid[r][c]>=0){
      const v=grid[r][c];
      // Selected gem: slight scale-up
      const scale=isSel?1.08:1;
      const ox=isSel?(cx+cellSize/2)*(1-scale):0;
      const oy=isSel?(cy+cellSize/2)*(1-scale):0;
      ctx.save();
      if(scale!==1){ctx.translate(cx+cellSize/2,cy+cellSize/2);ctx.scale(scale,scale);ctx.translate(-(cx+cellSize/2),-(cy+cellSize/2))}
      if(useImages&&imgsReady&&itemImgs[v]&&itemImgs[v].complete&&itemImgs[v].naturalWidth>0){
        const pad=cellSize*0.06,sz=cellSize-pad*2;ctx.drawImage(itemImgs[v],cx+pad,cy+pad,sz,sz)
      }else{
        const it=items[v];ctx.font='bold '+(cellSize*.45)+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
        ctx.shadowColor='rgba(0,0,0,0.4)';ctx.shadowBlur=2;ctx.fillText(it,cx+cellSize/2,cy+cellSize/2);ctx.shadowBlur=0
      }
      ctx.restore();
    }
    // Selection ring
    if(isSel){ctx.strokeStyle='#ffd700';ctx.lineWidth=2.5;ctx.beginPath();roundRect(cx+1,cy+1,cellSize-2,cellSize-2,8);ctx.stroke()}
  }
  ctx.restore();

  // Character portrait (left side of board)
  if(charImg&&charImg.complete&&charImg.naturalWidth>0){
    const ch=brdH*0.65,cw=ch*(charImg.naturalWidth/charImg.naturalHeight),cx=boardX-cw-20,cy=boardY+(brdH-ch)/2;
    ctx.globalAlpha=.85;ctx.drawImage(charImg,cx,cy,cw,ch);ctx.globalAlpha=1
  }

  // Particles
  for(const p of particles){ctx.fillStyle=p.color;ctx.globalAlpha=p.life;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,PI*2);ctx.fill()}
  ctx.globalAlpha=1;

  requestAnimationFrame(draw);
}
// Helper
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}

// ── Start ──
resize();createBoard();draw();
})();
    `.trim();
  },
};
