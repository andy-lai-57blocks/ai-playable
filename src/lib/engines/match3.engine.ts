/**
 * Match-3 Engine
 *
 * Classic swap-to-match game with:
 * - Canvas 2D rendering, DPR-aware
 * - Touch + mouse input
 * - Starfield particles in background
 * - Tween animations (bounce/elastic/smooth)
 * - Combo detection with screen shake
 * - Score counter + moves remaining
 * - End screen overlay with CTA
 */
import { PlayableDesignSpec, PlayableEngine, resolveColors } from "./engine.interface";

export const match3Engine: PlayableEngine = {
  id: "match3",
  name: "Match-3 Puzzle",

  defaultItems: {
    easy:   ["💎","🔮","💠","⚡","🌟","🔷"],
    normal: ["💎","🔮","💠","⚡","🌟","🔷"],
    hard:   ["💎","🔮","💠","⚡","🌟","🔷","🔥","❄️"],
  },

  defaultGameplay: {
    easy:   { cols: 5, rows: 5, maxMoves: 20, targetScore: 200 },
    normal: { cols: 6, rows: 6, maxMoves: 15, targetScore: 300 },
    hard:   { cols: 7, rows: 7, maxMoves: 12, targetScore: 400 },
  },

  generateStyles(spec: PlayableDesignSpec): string {
    const c = resolveColors(spec);
    return /*css*/`
#game-canvas { position:absolute; top:0; left:0; width:100%; height:100%; }
#game-ui { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:24px; box-sizing:border-box; }
#game-headline { font-family:system-ui,-apple-system,sans-serif; font-size:clamp(18px,4vw,36px); font-weight:900; color:${c.text}; text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.5); margin-bottom:4px; letter-spacing:-0.02em; line-height:1.1; }
#game-scoreboard { display:flex; gap:10px; margin-bottom:2px; }
.score-item { font-family:system-ui,sans-serif; font-size:clamp(12px,2vw,16px); font-weight:700; color:${c.text}; background:${c.panel}; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-radius:10px; padding:6px 12px; }
#end-overlay { display:none; position:absolute; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); flex-direction:column; align-items:center; justify-content:center; z-index:10; }
#end-overlay.show { display:flex; }
#end-message { font-family:system-ui,sans-serif; font-size:clamp(28px,6vw,52px); font-weight:900; color:#fff; text-align:center; margin-bottom:8px; text-shadow:0 2px 16px rgba(0,0,0,0.5); }
#end-sub { font-family:system-ui,sans-serif; font-size:clamp(14px,2.5vw,18px); color:rgba(255,255,255,0.7); margin-bottom:24px; }
#end-cta { pointer-events:auto; font-family:system-ui,sans-serif; font-size:clamp(18px,3.5vw,28px); font-weight:800; color:#fff; background:${c.cta}; border:none; border-radius:50px; padding:16px 56px; cursor:pointer; box-shadow:0 4px 24px ${c.cta}66; transition:transform 0.2s; letter-spacing:0.02em; }
#end-cta:active { transform:scale(0.95); }
#moves-left { font-family:system-ui,sans-serif; font-size:clamp(12px,2vw,16px); color:rgba(255,255,255,0.6); margin-top:4px; }
#game-logo { display:none; max-width:60px; max-height:60px; margin-bottom:4px; border-radius:12px; object-fit:contain; }
#game-logo.visible { display:block; }
    `.trim();
  },

  generateMarkup(_spec: PlayableDesignSpec): string {
    const mode = _spec.gameMode || "score";
    const movesLabel = mode === "timed" ? "⏱ Time" : "Moves";
    const movesId = mode === "timed" ? "timer-val" : "moves-val";
    const movesInit = mode === "timed" ? (_spec.timeLimit || 60) : 15;
    return /*html*/`
<canvas id="game-canvas"></canvas>
<div id="game-ui">
  <img id="game-logo" src="" alt="logo" />
  <div id="game-headline">LOADING</div>
  <div id="game-scoreboard">
    <div class="score-item">⭐ <span id="score-val">0</span></div>
    <div class="score-item">🎯 <span id="target-val">300</span></div>
  </div>
  <div id="moves-left">${movesLabel}: <span id="${movesId}">${movesInit}</span></div>
</div>
<div id="end-overlay">
  <div id="end-message"></div>
  <div id="end-sub">Score: <span id="end-score">0</span></div>
  <button id="end-cta" onclick="window.__playableCTA?.()"></button>
</div>
<div id="item-preloader" style="display:none"></div>
    `.trim();
  },

  generateInit(spec: PlayableDesignSpec): string {
    const c = resolveColors(spec);
    const items = spec.theme.items.length >= 6 ? spec.theme.items : match3Engine.defaultItems[spec.difficulty] || match3Engine.defaultItems.normal;
    const gp = { ...(match3Engine.defaultGameplay[spec.difficulty] || match3Engine.defaultGameplay.normal), ...spec.gameplay };
    const particleColors = spec.theme.particleStyle === "gold" ? ["#ffd700","#ffaa00","#ff8c00"]
      : spec.theme.particleStyle === "neon" ? ["#0ff","#f0f","#ff0"]
      : spec.theme.particleStyle === "shatter" ? ["#fff","#ccc","#999"]
      : [c.accent,"#fff","#ffd700"];

    // Image-based tokens (if provided)
    const itemImages = spec.itemImages || [];
    const useImages = itemImages.length > 0;
    const effectiveItems = useImages ? items.slice(0, Math.max(itemImages.length, 4)) : items;
    const imgUrlsJson = JSON.stringify(itemImages);
    const boardBgUrl = JSON.stringify(spec.boardBgUrl || spec.bgImageUrl || "");

    return /*js*/`
(function(){
const PI=Math.PI,cos=Math.cos,sin=Math.sin,abs=Math.abs,min=Math.min,max=Math.max,floor=Math.floor,random=Math.random;
const canvas=document.getElementById('game-canvas'),ctx=canvas.getContext('2d');
const items=${JSON.stringify(effectiveItems)};
const COLS=${gp.cols},ROWS=${gp.rows},MAX_MOVES=${gp.maxMoves},TARGET=${gp.targetScore};
const particleColors=${JSON.stringify(particleColors)};
let dpr=window.devicePixelRatio||1,vw,vh,cellSize,boardX,boardY,grid=[],selected=null,score=0,moves=MAX_MOVES,gameOver=false,gameResult=null;
let particles=[],tweens=[],stars=[],shakeX=0,shakeY=0,shakeDur=0;

// Image mode
const useImages=${useImages};
const itemImgUrls=${imgUrlsJson};
const itemImgs=[];
let imgsReady=!itemImgUrls.length;
if(itemImgUrls.length){
  let loaded=0;
  itemImgUrls.forEach((url,i)=>{
    const img=new Image();
    const cb=()=>{ loaded++; if(loaded===itemImgUrls.length)imgsReady=true; };
    img.onload=cb;
    img.onerror=cb;
    img.src=url;
    if(img.complete)cb();
    itemImgs.push(img);
  });
}
// Board background
const boardBgUrl=${boardBgUrl};
let boardBgImg=null;
if(boardBgUrl){ boardBgImg=new Image(); boardBgImg.src=boardBgUrl; }

// Main background image
const mainBgUrl=${JSON.stringify(spec.bgImageUrl || "")};
let mainBgImg=null;
if(mainBgUrl){ mainBgImg=new Image(); mainBgImg.src=mainBgUrl; }

// Character portrait
const charUrl=${JSON.stringify(spec.characterUrl || "")};
let charImg=null;
if(charUrl){ charImg=new Image(); charImg.src=charUrl; }

// Decorative frame
const frameUrl=${JSON.stringify(spec.frameUrl || "")};
let frameImg=null;
if(frameUrl){ frameImg=new Image(); frameImg.src=frameUrl; }

// Show moves counter?
const showMoves=${spec.showMoves !== false};
const gameMode=${JSON.stringify(spec.gameMode || "score")};
const timeLimit=${spec.timeLimit || 60};
let timerInterval=null,timeLeft=timeLimit;

// ── DOM refs ──
const elHeadline=document.getElementById('game-headline');
const elScore=document.getElementById('score-val'),elTarget=document.getElementById('target-val');
const elMoves=document.getElementById(gameMode==='timed'?'timer-val':'moves-val'),elMovesLbl=document.getElementById('moves-left');
const elOverlay=document.getElementById('end-overlay'),elEndMsg=document.getElementById('end-message');
const elEndScore=document.getElementById('end-score'),elEndCta=document.getElementById('end-cta');

elHeadline.textContent=${JSON.stringify(spec.copy.headline)};
elTarget.textContent=TARGET;
if(gameMode==='timed'){ elMoves.textContent=timeLeft; } else { elMoves.textContent=moves; }
elEndCta.textContent=${JSON.stringify(spec.copy.ctaText)};
if(!showMoves){ elMovesLbl.style.display='none'; }

// Timer for timed mode
if(gameMode==='timed'){
  timerInterval=setInterval(()=>{
    if(gameOver)return;
    timeLeft--;
    elMoves.textContent=timeLeft;
    if(timeLeft<=0){ endGame('lose'); }
  },1000);
}

// Logo
const logoUrl=${JSON.stringify(spec.logoUrl || "")};
if(logoUrl){ const img=document.getElementById('game-logo'); img.src=logoUrl; img.classList.add('visible'); }

// ── Resize ──
function resize(){
  const root=canvas.parentElement; vw=root.clientWidth; vh=root.clientHeight;
  dpr=window.devicePixelRatio||1; canvas.width=vw*dpr; canvas.height=vh*dpr;
  canvas.style.width=vw+'px'; canvas.style.height=vh+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // Leave top 32% for UI, use 58% for board
  const maxBoardH=vh*0.58,maxBoardW=vw*0.88;
  cellSize=floor(min(maxBoardW/COLS,maxBoardH/ROWS));
  boardX=(vw-cellSize*COLS)/2; boardY=vh*0.32;
  initStars();
}
function initStars(){ stars=[]; for(let i=0;i<80;i++) stars.push({x:random()*vw,y:random()*vh,r:random()*1.5+0.5,s:random()*0.3+0.1}); }

// ── Board ──
function createBoard(){ grid=[]; for(let r=0;r<ROWS;r++){ grid[r]=[]; for(let c=0;c<COLS;c++){ let v,attempts=0; do{v=floor(random()*items.length);attempts++} while(hasMatch(r,c,v)&&attempts<50); grid[r][c]=v; } } }
function hasMatch(r,c,v){ if(c>=2&&grid[r][c-1]===v&&grid[r][c-2]===v)return true; if(r>=2&&(grid[r-1]||[])[c]===v&&(grid[r-2]||[])[c]===v)return true; return false; }
function findMatches(){const m=new Set();for(let r=0;r<ROWS;r++){for(let c=0;c<COLS-2;c++){if(grid[r][c]===grid[r][c+1]&&grid[r][c]===grid[r][c+2]){m.add(r+','+c);m.add(r+','+(c+1));m.add(r+','+(c+2));}}}for(let c=0;c<COLS;c++){for(let r=0;r<ROWS-2;r++){if(grid[r][c]===grid[r+1][c]&&grid[r][c]===grid[r+2][c]){m.add(r+','+c);m.add((r+1)+','+c);m.add((r+2)+','+c);}}}return m;}
function applyGravity(){for(let c=0;c<COLS;c++){let wr=ROWS-1;for(let r=ROWS-1;r>=0;r--){if(grid[r][c]!==-1){grid[wr][c]=grid[r][c];if(wr!==r)grid[r][c]=-1;wr--;}}for(let r=wr;r>=0;r--){grid[r][c]=floor(random()*items.length);}}}
function swap(r1,c1,r2,c2){const t=grid[r1][c1];grid[r1][c1]=grid[r2][c2];grid[r2][c2]=t;}

// ── Tweens ──
function tween(obj,props,dur,ease){ const id=Date.now()+random(); tweens.push({id,obj,props,start:{},dur,elapsed:0,ease}); for(const k in props) tweens[tweens.length-1].start[k]=obj[k]!==undefined?obj[k]:0; return id; }
function easeFunc(ease,t){ switch(ease){ case'easeOutBounce':{const n1=7.5625,d1=2.75;if(t<1/d1)return n1*t*t;if(t<2/d1)return n1*(t-=1.5/d1)*t+0.75;if(t<2.5/d1)return n1*(t-=2.25/d1)*t+0.9375;return n1*(t-=2.625/d1)*t+0.984375;} case'easeOutElastic':{if(t===0||t===1)return t;return Math.pow(2,-10*t)*sin((t-1)*(2*PI)/0.3)+1;} default:return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; } }

// ── Particles ──
function spawnParticles(x,y,count,colors){ for(let i=0;i<count;i++){ const a=random()*PI*2,s=random()*3+2; particles.push({x,y,vx:cos(a)*s,vy:sin(a)*s,life:1,decay:random()*0.02+0.01,size:random()*4+2,color:colors[floor(random()*colors.length)]}); } }
function spawnScorePop(x,y,pts){ tweens.push({id:Date.now(),obj:{x,y,life:1,text:'+'+pts,vy:-60},props:{y:y-80,life:0},start:{y,life:1},dur:800,ease:'easeOutCubic'}); }

// ── Shake ──
function shake(intensity){ shakeX=(random()-0.5)*intensity*2; shakeY=(random()-0.5)*intensity*2; shakeDur=300; }

// ── Handle match ──
function processMatches(matches){
  let combo=0; const processed=new Set();
  function cascade(initial){
    const m=initial||findMatches(); if(m.size===0) return;
    combo++; const pts=m.size*10*combo;
    for(const k of m){ const [r,c]=k.split(',').map(Number); if(!processed.has(k)){ spawnParticles(boardX+c*cellSize+cellSize/2,boardY+r*cellSize+cellSize/2,8,particleColors); spawnScorePop(boardX+c*cellSize+cellSize/2,boardY+r*cellSize+cellSize/2,pts/m.size); processed.add(k); grid[r][c]=-1; } }
    score+=pts; elScore.textContent=score; shake(combo*3); applyGravity();
    setTimeout(()=>cascade(null),250);
  }
  cascade(matches);
  setTimeout(checkGameEnd,250*(combo+1)+200);
}

// ── Game end ──
function checkGameEnd(){
  if(gameOver)return;
  if(score>=TARGET){ endGame('win'); return; }
  if(gameMode!=='timed' && moves<=0){ endGame('lose'); return; }
}
function endGame(result){
  gameOver=true; gameResult=result;
  elOverlay.classList.add('show');
  elEndMsg.textContent=result==='win'?${JSON.stringify(spec.copy.endWin)}:${JSON.stringify(spec.copy.endLose)};
  elEndScore.textContent=score;
  elEndCta.textContent=result==='win'?${JSON.stringify(spec.copy.endCta)}:${JSON.stringify(spec.copy.ctaText)};
}

// ── Input ──
function getCell(ex,ey){ const c=floor((ex-boardX)/cellSize),r=floor((ey-boardY)/cellSize); if(c>=0&&c<COLS&&r>=0&&r<ROWS) return{r,c}; return null; }
function trySwap(r1,c1,r2,c2){
  swap(r1,c1,r2,c2); const m=findMatches();
  if(m.size>0){ if(gameMode!=='timed'){ moves--; elMoves.textContent=moves; } processMatches(m); }
  else{ swap(r1,c1,r2,c2); shake(4); }
}
// Tap: first tap selects, second tap on adjacent cell swaps. Drag also works.
function onDown(e){
  if(gameOver)return; e.preventDefault();
  const t=e.touches?e.touches[0]:e, cell=getCell(t.clientX,t.clientY);
  if(!cell)return;
  if(selected){
    if(cell.r===selected.r&&cell.c===selected.c){ selected=null; return; }
    const dr=abs(cell.r-selected.r),dc=abs(cell.c-selected.c);
    if((dr===1&&dc===0)||(dr===0&&dc===1)) trySwap(selected.r,selected.c,cell.r,cell.c);
    selected=null;
  } else { selected={r:cell.r,c:cell.c}; }
}
// Drag: mouseup on different cell swaps. Keep selected on same-cell release for two-tap.
function onUp(e){
  if(gameOver||!selected)return; e.preventDefault();
  const t=e.changedTouches?e.changedTouches[0]:e, cell=getCell(t.clientX,t.clientY);
  if(cell&&(cell.r!==selected.r||cell.c!==selected.c)){
    const dr=abs(cell.r-selected.r),dc=abs(cell.c-selected.c);
    if((dr===1&&dc===0)||(dr===0&&dc===1)){ trySwap(selected.r,selected.c,cell.r,cell.c); selected=null; }
  }
}

canvas.addEventListener('touchstart',onDown,{passive:false});
canvas.addEventListener('touchend',onUp,{passive:false});
canvas.addEventListener('mousedown',onDown);
canvas.addEventListener('mouseup',onUp);

// ── Render ──
function drawStarfield(){
  for(const s of stars){ s.y+=s.s; if(s.y>vh)s.y=0; ctx.fillStyle='rgba(255,255,255,'+(s.r/2)+')'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,PI*2); ctx.fill(); }
}
function draw(){
  ctx.clearRect(0,0,vw,vh);
  // bg image first (if loaded)
  if(mainBgImg && mainBgImg.complete && mainBgImg.naturalWidth>0){
    ctx.drawImage(mainBgImg,0,0,vw,vh);
    // dark overlay for readability
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,vw,vh);
  } else {
    // fallback gradient
    const grad=ctx.createLinearGradient(0,0,vw,vh);
    const bgStr=${JSON.stringify(c.bg)};
    if(bgStr.startsWith('linear-gradient')){
      const m=bgStr.match(/#[0-9a-fA-F]{3,8}/g)||['#1a1a2e','#16213e'];
      grad.addColorStop(0,m[0]||'#1a1a2e'); grad.addColorStop(1,m[1]||'#16213e');
      ctx.fillStyle=grad;
    } else { ctx.fillStyle='#1a1a2e'; }
    ctx.fillRect(0,0,vw,vh);
  }
  ctx.save();
  if(shakeDur>0){ const s=shakeDur/300; ctx.translate(shakeX*s,shakeY*s); shakeDur-=16; }
  drawStarfield();
  // Decorative frame behind the board
  if(frameImg && frameImg.complete && frameImg.naturalWidth>0){
    const fPad=28, fX=boardX-fPad, fY=boardY-fPad, fW=brdW+fPad*2, fH=brdH+fPad*2;
    ctx.globalAlpha=0.4;
    ctx.drawImage(frameImg,fX,fY,fW,fH);
    ctx.globalAlpha=1;
  }
  // board panel
  const brdW=cellSize*COLS+16,brdH=cellSize*ROWS+16;
  // board background texture (tile pattern, don't stretch)
  if(boardBgImg && boardBgImg.complete && boardBgImg.naturalWidth>0){
    ctx.save();
    ctx.beginPath(); roundRect(boardX-8,boardY-8,brdW,brdH,16); ctx.clip();
    const pat=ctx.createPattern(boardBgImg,'repeat');
    if(pat){ ctx.fillStyle=pat; ctx.fillRect(boardX-8,boardY-8,brdW,brdH); }
    ctx.restore();
  }
  // board panel overlay
  ctx.fillStyle=${JSON.stringify(c.panel)};
  ctx.beginPath(); roundRect(boardX-8,boardY-8,brdW,brdH,16); ctx.fill();
  ctx.strokeStyle=${JSON.stringify(c.accent)}; ctx.lineWidth=1; ctx.globalAlpha=0.15;
  ctx.beginPath(); roundRect(boardX-8,boardY-8,brdW,brdH,16); ctx.stroke(); ctx.globalAlpha=1;
  // cells
  for(let r=0;r<ROWS;r++){ for(let c=0;c<COLS;c++){
    const cx=boardX+c*cellSize,cy=boardY+r*cellSize,centerX=cx+cellSize/2,centerY=cy+cellSize/2;
    ctx.fillStyle=${JSON.stringify(c.cell)}; ctx.fillRect(cx+2,cy+2,cellSize-4,cellSize-4);
    if(grid[r][c]>=0){
      const v=grid[r][c];
      if(useImages && imgsReady && itemImgs[v] && itemImgs[v].complete && itemImgs[v].naturalWidth>0){
        const pad=cellSize*0.12,sz=cellSize-pad*2;
        ctx.drawImage(itemImgs[v],cx+pad,cy+pad,sz,sz);
      } else {
        const hue=(v*60)%360;
        ctx.fillStyle='hsla('+hue+',70%,50%,0.15)';
        ctx.beginPath(); ctx.arc(centerX,centerY,cellSize*0.38,0,PI*2); ctx.fill();
        const item=items[v];
        ctx.font='bold '+(cellSize*0.5)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=2;
        ctx.fillText(item,centerX,centerY);
        ctx.shadowBlur=0;
      }
    }
    if(selected&&selected.r===r&&selected.c===c){ ctx.strokeStyle=${JSON.stringify(c.accent)}; ctx.lineWidth=3; ctx.globalAlpha=0.7; ctx.strokeRect(cx+2,cy+2,cellSize-4,cellSize-4); ctx.globalAlpha=1; }
  }}
  ctx.restore();
  // Character portrait (left side, beside the board)
  if(charImg && charImg.complete && charImg.naturalWidth>0){
    const charH=brdH*0.7,charW=charH*(charImg.naturalWidth/charImg.naturalHeight);
    const charX=boardX-charW-16,charY=boardY+(brdH-charH)/2;
    if(charX>0){
      ctx.globalAlpha=0.9;
      ctx.drawImage(charImg,charX,charY,charW,charH);
      ctx.globalAlpha=1;
    }
  }
  // particles
  for(const p of particles){ ctx.fillStyle=p.color; ctx.globalAlpha=p.life; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,PI*2); ctx.fill(); }
  ctx.globalAlpha=1;
  // score pops
  for(const tw of tweens.filter(t=>t.obj.text)){
    ctx.font='bold 24px system-ui'; ctx.fillStyle='#ffd700'; ctx.textAlign='center'; ctx.globalAlpha=tw.obj.life;
    ctx.fillText(tw.obj.text,tw.obj.x,tw.obj.y); ctx.globalAlpha=1;
  }
  requestAnimationFrame(draw);
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); }

// ── Game loop ──
function update(dt){
  for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=p.decay; if(p.life<=0)particles.splice(i,1); }
  for(let i=tweens.length-1;i>=0;i--){ const tw=tweens[i]; tw.elapsed+=dt; const t=min(tw.elapsed/tw.dur,1); const e=easeFunc(tw.ease,t); for(const k in tw.props){ tw.obj[k]=tw.start[k]+(tw.props[k]-tw.start[k])*e; } if(t>=1)tweens.splice(i,1); }
}
let lt=0; function loop(t){ const dt=t-lt; lt=t; update(dt); requestAnimationFrame(loop); }

// ── Init ──
resize(); createBoard(); draw();
window.addEventListener('resize',resize);
requestAnimationFrame(loop);
window.__playableCTA=function(){ /* CTA click handler */ };
})();
    `.trim();
  },
};

export default match3Engine;
