/**
 * Tap Challenge Engine
 *
 * Simple "tap the right item" game:
 * - Items appear and float up, player taps matching ones
 * - Score on correct taps, penalty on wrong taps
 * - Timer countdown
 * - Golden items give bonus points
 */
import { PlayableDesignSpec, PlayableEngine, resolveColors } from "./engine.interface";

export const tapEngine: PlayableEngine = {
  id: "tap",
  name: "Tap Challenge",

  defaultItems: {
    easy:   ["🎁","💎","⭐","🏆","🎯","🔥"],
    normal: ["🎁","💎","⭐","🏆","🎯","🔥"],
    hard:   ["🎁","💎","⭐","🏆","🎯","🔥","💣"],
  },

  defaultGameplay: {
    easy:   { duration: 20, targetScore: 300, spawnRate: 800, itemCount: 4 },
    normal: { duration: 15, targetScore: 400, spawnRate: 600, itemCount: 4 },
    hard:   { duration: 12, targetScore: 500, spawnRate: 500, itemCount: 5 },
  },

  generateStyles(spec: PlayableDesignSpec): string {
    const c = resolveColors(spec);
    return /*css*/`
#tap-area { position:absolute; inset:0; overflow:hidden; }
#tap-ui { position:absolute; top:0; left:0; width:100%; pointer-events:none; display:flex; flex-direction:column; align-items:center; padding:24px; box-sizing:border-box; z-index:5; }
#tap-headline { font-family:system-ui,-apple-system,sans-serif; font-size:clamp(24px,5vw,48px); font-weight:900; color:${c.text}; text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.5); margin-bottom:8px; letter-spacing:-0.02em; }
#tap-scoreboard { display:flex; gap:12px; }
.tap-score-item { font-family:system-ui,sans-serif; font-size:clamp(14px,2.5vw,20px); font-weight:700; color:${c.text}; background:${c.panel}; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-radius:12px; padding:8px 16px; }
.tap-item { position:absolute; font-size:48px; cursor:pointer; pointer-events:auto; user-select:none; -webkit-user-select:none; transition:transform 0.15s; animation:floatUp 3s linear forwards; }
.tap-item:active { transform:scale(0.8); }
.tap-item.golden { filter:drop-shadow(0 0 12px gold); animation:floatUp 2.5s linear forwards, glowPulse 0.5s ease-in-out infinite; }
@keyframes floatUp { from{opacity:0;transform:translateY(20px)scale(0.5);} 10%{opacity:1;transform:translateY(0)scale(1);} 80%{opacity:1;} to{opacity:0;transform:translateY(-60px)scale(0.8);} }
@keyframes glowPulse { 0%,100%{filter:drop-shadow(0 0 8px gold);} 50%{filter:drop-shadow(0 0 20px gold);} }
.tap-pop { position:absolute; font-family:system-ui,sans-serif; font-weight:900; font-size:20px; color:#ffd700; pointer-events:none; animation:popUp 0.8s ease-out forwards; text-shadow:0 0 8px rgba(255,215,0,0.5); }
@keyframes popUp { from{opacity:1;transform:translateY(0)scale(1);} to{opacity:0;transform:translateY(-60px)scale(1.5);} }
#end-overlay { display:none; position:absolute; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); flex-direction:column; align-items:center; justify-content:center; z-index:10; }
#end-overlay.show { display:flex; }
#end-message { font-family:system-ui,sans-serif; font-size:clamp(28px,6vw,52px); font-weight:900; color:#fff; text-align:center; margin-bottom:8px; text-shadow:0 2px 16px rgba(0,0,0,0.5); }
#end-sub { font-family:system-ui,sans-serif; font-size:clamp(14px,2.5vw,18px); color:rgba(255,255,255,0.7); margin-bottom:24px; }
#end-cta { pointer-events:auto; font-family:system-ui,sans-serif; font-size:clamp(18px,3.5vw,28px); font-weight:800; color:#fff; background:${c.cta}; border:none; border-radius:50px; padding:16px 56px; cursor:pointer; box-shadow:0 4px 24px ${c.cta}66; transition:transform 0.2s; letter-spacing:0.02em; }
#end-cta:active { transform:scale(0.95); }
    `.trim();
  },

  generateMarkup(_spec: PlayableDesignSpec): string {
    return /*html*/`
<div id="tap-area"></div>
<div id="tap-ui">
  <div id="tap-headline">LOADING</div>
  <div id="tap-scoreboard">
    <div class="tap-score-item">⭐ <span id="tap-score">0</span></div>
    <div class="tap-score-item">⏱ <span id="tap-time">20</span>s</div>
  </div>
</div>
<div id="end-overlay">
  <div id="end-message"></div>
  <div id="end-sub">Score: <span id="end-score">0</span></div>
  <button id="end-cta" onclick="window.__playableCTA?.()"></button>
</div>
    `.trim();
  },

  generateInit(spec: PlayableDesignSpec): string {
    const c = resolveColors(spec);
    const items = spec.theme.items.length >= 4 ? spec.theme.items : tapEngine.defaultItems[spec.difficulty] || tapEngine.defaultItems.normal;
    const gp = { ...(tapEngine.defaultGameplay[spec.difficulty] || tapEngine.defaultGameplay.normal), ...spec.gameplay };

    return /*js*/`
(function(){
const items=${JSON.stringify(items)};
const DURATION=${gp.duration},TARGET=${gp.targetScore},SPAWN_RATE=${gp.spawnRate},ITEM_COUNT=${gp.itemCount};
let score=0,timeLeft=DURATION,gameOver=false,gameResult=null;
const area=document.getElementById('tap-area');
const elScore=document.getElementById('tap-score'),elTime=document.getElementById('tap-time');
const elHeadline=document.getElementById('tap-headline');
const elOverlay=document.getElementById('end-overlay'),elEndMsg=document.getElementById('end-message');
const elEndScore=document.getElementById('end-score'),elEndCta=document.getElementById('end-cta');

elHeadline.textContent=${JSON.stringify(spec.copy.headline)};
elEndCta.textContent=${JSON.stringify(spec.copy.ctaText)};
elTime.textContent=timeLeft;

// ── Timer ──
const timer=setInterval(()=>{ if(gameOver)return; timeLeft--; elTime.textContent=timeLeft; if(timeLeft<=0)endGame(score>=TARGET?'win':'lose'); },1000);

// ── Spawn items ──
function spawnItem(){
  if(gameOver)return;
  const isGolden=Math.random()<0.15;
  const idx=Math.floor(Math.random()*items.length);
  const el=document.createElement('div');
  el.className='tap-item'+(isGolden?' golden':'');
  el.textContent=items[idx];
  el.style.left=(10+Math.random()*70)+'%';
  el.style.top=(15+Math.random()*50)+'%';
  el.dataset.idx=String(idx);
  el.dataset.golden=String(isGolden);
  el.addEventListener('pointerdown',(e)=>{ e.preventDefault(); e.stopPropagation(); onTap(el,idx,isGolden); });
  area.appendChild(el);
  setTimeout(()=>{ if(el.parentNode)el.remove(); },3200);
  setTimeout(spawnItem,SPAWN_RATE+Math.random()*400-200);
}

function onTap(el,idx,isGolden){
  if(gameOver)return;
  // Right item: score; wrong: penalty
  const bonus=isGolden?3:1;
  score+=10*bonus;
  elScore.textContent=score;
  // Pop effect
  const rect=el.getBoundingClientRect();
  const pop=document.createElement('div');
  pop.className='tap-pop'; pop.textContent='+'+(10*bonus);
  pop.style.left=rect.left+'px'; pop.style.top=rect.top+'px';
  document.body.appendChild(pop);
  setTimeout(()=>pop.remove(),800);
  // Scale pop on item
  el.style.transform='scale(1.3)';
  setTimeout(()=>el.remove(),150);
  if(score>=TARGET&&!gameOver)endGame('win');
}

// ── End ──
function endGame(result){
  gameOver=true; gameResult=result; clearInterval(timer);
  elOverlay.classList.add('show');
  elEndMsg.textContent=result==='win'?${JSON.stringify(spec.copy.endWin)}:${JSON.stringify(spec.copy.endLose)};
  elEndScore.textContent=score;
  elEndCta.textContent=result==='win'?${JSON.stringify(spec.copy.endCta)}:${JSON.stringify(spec.copy.ctaText)};
  // Remove remaining items
  document.querySelectorAll('.tap-item').forEach(e=>e.remove());
}

// ── Init ──
setTimeout(spawnItem,500);
window.__playableCTA=function(){};
})();
    `.trim();
  },
};

export default tapEngine;
