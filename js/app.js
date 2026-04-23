/* ══════════════════════════════════════════════
   TEMAS — Paletas de colores para los segmentos
══════════════════════════════════════════════ */
const THEMES = {
  fiesta:   ['#ff6b6b','#ff9f43','#feca57','#1dd1a1','#48dbfb','#54a0ff','#a29bfe','#fd79a8','#ff6b6b','#26de81'],
  pastel:   ['#ffd6e7','#c8f7c5','#a8d8ea','#f9d5e5','#eeac99','#d4e6b5','#b8c8e8','#f7d9c4','#c9e4ca','#e8d5f0'],
  oscuro:   ['#2c2c54','#474787','#e94560','#c0392b','#1a1a2e','#0f3460','#533483','#e94560','#2c2c54','#16213e'],
  navidad:  ['#c1121f','#1a472a','#e63946','#2d6a4f','#ff595e','#1b4332','#d62828','#40916c','#c1121f','#2d6a4f'],
  cielo:    ['#87ceeb','#b0e0ff','#90e0ef','#caf0f8','#48cae4','#00b4d8','#0096c7','#0077b6','#023e8a','#48cae4'],
  arcoiris: ['#ff595e','#ff924c','#ffca3a','#c5ca30','#8ac926','#36949d','#1982c4','#4267ac','#565aa0','#6a4c93'],
};
 
const THEME_TEXT = {
  fiesta:'#fff', pastel:'#2d3436', oscuro:'#e0e0f0', navidad:'#fff', cielo:'#fff', arcoiris:'#fff'
};
 
/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
let participants = [];
let history      = [];
let currentTheme = 'fiesta';
let isSpinning   = false;
let rotation     = 0;
 
const WHEEL_SIZE = 460;
const R          = 210;
const R_TEXT     = 158;
const R_HUB      = 30;
 
/* ══════════════════════════════════════════════
   DOM REFS
══════════════════════════════════════════════ */
const svgEl        = document.getElementById('wheel-svg');
const btnSpin      = document.getElementById('btn-spin');
const namesTextarea = document.getElementById('names-textarea');
const btnAdd       = document.getElementById('btn-add');
const countBadge   = document.getElementById('count-badge');
const btnClear     = document.getElementById('btn-clear');
const repeatSwitch = document.getElementById('repeat-switch');
const winnerDisplay= document.getElementById('winner-display');
const historyList  = document.getElementById('history-list');
const btnResetHist = document.getElementById('btn-reset-history');
const themeSelect  = document.getElementById('theme-select');
const titleInput   = document.getElementById('roulette-title');
const displayTitle = document.getElementById('display-title');
const wheelOuter   = document.getElementById('wheel-outer');
const wheelRim     = document.getElementById('wheel-rim');
const toastEl      = document.getElementById('toast');
 
/* ══════════════════════════════════════════════
   BUBBLES BACKGROUND
══════════════════════════════════════════════ */
(function createBubbles(){
  const container = document.getElementById('bubbles');
  for(let i=0;i<18;i++){
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 20 + Math.random()*80;
    b.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${6+Math.random()*12}s;
      animation-delay:${Math.random()*10}s;
    `;
    container.appendChild(b);
  }
})();

/* ══════════════════════════════════════════════
   TEXT WRAP HELPER
   Parte un texto en líneas según maxChars por línea
══════════════════════════════════════════════ */
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  words.forEach(word => {
    const candidate = current ? current + ' ' + word : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Si la palabra sola es más larga que maxChars, la parte con guión
      if (word.length > maxChars) {
        lines.push(word.slice(0, maxChars - 1) + '-');
        current = word.slice(maxChars - 1);
      } else {
        current = word;
      }
    }
  });
  if (current) lines.push(current);
  // Máximo 2 líneas para no desbordar el segmento
  return lines.slice(0, 2);
}

/* ══════════════════════════════════════════════
   WHEEL SVG BUILD
══════════════════════════════════════════════ */
function buildWheel() {
  svgEl.innerHTML = '';
  const n = participants.length;
  const palette = THEMES[currentTheme];
  const txtColor = THEME_TEXT[currentTheme];
 
  svgEl.setAttribute('viewBox',`${-WHEEL_SIZE/2} ${-WHEEL_SIZE/2} ${WHEEL_SIZE} ${WHEEL_SIZE}`);
  svgEl.style.width  = WHEEL_SIZE + 'px';
  svgEl.style.height = WHEEL_SIZE + 'px';
 
  wheelRim.style.width  = (WHEEL_SIZE + 24) + 'px';
  wheelRim.style.height = (WHEEL_SIZE + 24) + 'px';
 
  if(n === 0){
    const circle = makeSVG('circle',{cx:0,cy:0,r:R,fill:'rgba(255,255,255,0.3)',stroke:'rgba(255,255,255,0.5)','stroke-width':3});
    svgEl.appendChild(circle);
    const txt = makeSVG('text',{'x':0,'y':0,'text-anchor':'middle','dominant-baseline':'middle',
      fill:'rgba(255,255,255,0.7)','font-family':'Fredoka One, cursive','font-size':18});
    txt.textContent = '¡Agrega participantes!';
    svgEl.appendChild(txt);
    return;
  }
 
  if(n === 1){
    const circle = makeSVG('circle',{cx:0,cy:0,r:R,fill:palette[0],stroke:'rgba(255,255,255,0.4)','stroke-width':3});
    svgEl.appendChild(circle);
    const txt = makeSVG('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'middle',
      fill:txtColor,'font-family':'Fredoka One, cursive','font-size':22,'font-weight':'bold'});
    txt.textContent = participants[0].name;
    svgEl.appendChild(txt);
    addHub(txtColor);
    return;
  }
 
  const arc = 360 / n;

  // maxChars y fontSize según cantidad de segmentos
  const fontSize = n > 20 ? 9 : n > 12 ? 11 : 13;
  const maxChars = n > 20 ? 8 : n > 12 ? 10 : 13;
  // Espacio entre líneas proporcional al fontSize
  const lineHeight = fontSize * 1.25;

  participants.forEach((p, i) => {
    const color    = palette[i % palette.length];
    const startDeg = i * arc - 90;
    const endDeg   = startDeg + arc;
    const start    = polar(R, startDeg);
    const end      = polar(R, endDeg);
    const largeArc = arc > 180 ? 1 : 0;
 
    // Segmento
    const path = makeSVG('path',{
      d:`M 0 0 L ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y} Z`,
      fill: p.eliminated ? 'rgba(150,150,150,0.4)' : color,
      stroke:'rgba(255,255,255,0.5)',
      'stroke-width':1.5
    });
    svgEl.appendChild(path);
 
    // Posición central del texto en el segmento
    const midDeg = startDeg + arc / 2;
    const tp     = polar(R_TEXT, midDeg);
    const textFill = p.eliminated ? 'rgba(255,255,255,0.3)' : txtColor;

    // Calcular líneas
    const lines = wrapText(p.name, maxChars);
    const totalHeight = lines.length * lineHeight;
    const startY = -(totalHeight / 2) + lineHeight / 2;

    // Grupo rotado para que el texto siga el radio
    const g = makeSVG('g', {
      transform: `translate(${tp.x},${tp.y}) rotate(${midDeg})`
    });

    lines.forEach((line, li) => {
      const tspan = makeSVG('text', {
        x: 0,
        y: startY + li * lineHeight,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: textFill,
        'font-family': 'Fredoka One, cursive',
        'font-size': fontSize,
      });
      tspan.textContent = line;
      g.appendChild(tspan);
    });

    svgEl.appendChild(g);
  });
 
  // Anillos decorativos interiores
  [R_HUB+20, R_HUB+10].forEach((r,i) => {
    const c = makeSVG('circle',{cx:0,cy:0,r,fill:'none',stroke:'rgba(255,255,255,0.4)','stroke-width':i===0?2:1});
    svgEl.appendChild(c);
  });
 
  addHub(txtColor);
}
 
function addHub(txtColor){
  const hub = makeSVG('circle',{cx:0,cy:0,r:R_HUB,fill:'rgba(255,255,255,0.9)',stroke:'rgba(255,255,255,0.5)','stroke-width':2});
  svgEl.appendChild(hub);
  const hubInner = makeSVG('circle',{cx:0,cy:0,r:R_HUB-8,fill:'rgba(255,255,255,0.5)'});
  svgEl.appendChild(hubInner);
  const hubDot = makeSVG('circle',{cx:0,cy:0,r:5,fill:'rgba(0,0,0,0.2)'});
  svgEl.appendChild(hubDot);
}
 
function makeSVG(tag, attrs){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
  return el;
}
function polar(r, deg){
  const rad = deg * Math.PI / 180;
  return {x: r * Math.cos(rad), y: r * Math.sin(rad)};
}
 
/* ══════════════════════════════════════════════
   PARTICIPANTS
══════════════════════════════════════════════ */
function syncTextarea() {
  namesTextarea.value = participants.map(p => p.name).join('\n');
}
 
function addParticipantsFromTextarea() {
  const raw = namesTextarea.value;
  const names = raw.split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 0);
 
  if(names.length === 0){
    showToast('✏️ Escribe al menos un nombre'); return;
  }
 
  participants = names
    .filter(name => name.length <= 40)
    .map(name => ({ name, eliminated: false }));
 
  renderList();
  buildWheel();
  showToast(`✅ ${participants.length} participante${participants.length!==1?'s':''} cargado${participants.length!==1?'s':''} en la ruleta`);
}
 
function renderList(){
  const active = participants.filter(p => !p.eliminated);
  const total  = participants.length;
  if(total === 0){
    countBadge.textContent = '0 participantes';
  } else if(active.length === total){
    countBadge.textContent = `${total} participante${total!==1?'s':''}`;
  } else {
    countBadge.textContent = `${active.length} activos · ${total} total`;
  }
}
 
function escapeHTML(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
 
/* ══════════════════════════════════════════════
   SPIN
══════════════════════════════════════════════ */
function spin(){
  const active = participants.filter(p => !p.eliminated);
  if(active.length === 0){
    showToast('👥 Agrega participantes primero'); return;
  }
  if(isSpinning) return;
  isSpinning = true;
  btnSpin.disabled = true;
  winnerDisplay.innerHTML = `<div class="winner-placeholder">🎰 Girando…</div>`;
 
  const winner = active[Math.floor(Math.random() * active.length)];
  const winnerIdx = participants.indexOf(winner);
  const n = participants.length;
  const arc = 360 / n;
 
  const extraSpins = 5 + Math.floor(Math.random() * 5);
  const duration   = 4500 + Math.random() * 1500;
 
  const targetLocal = -(winnerIdx * arc + arc / 2);
  const totalRot = rotation + targetLocal - (rotation % 360) + extraSpins * 360;
 
  svgEl.style.setProperty('--spin-dur', `${duration}ms`);
  svgEl.classList.add('spinning');
  svgEl.style.transform = `rotate(${totalRot}deg)`;
  rotation = totalRot;
 
  setTimeout(() => {
    svgEl.classList.remove('spinning');
    isSpinning = false;
    btnSpin.disabled = false;
    showWinner(winner, winnerIdx);
  }, duration + 80);
}
 
function showWinner(winner, idx){
  spawnConfetti();
  winnerDisplay.innerHTML = `
    <div class="winner-emoji">🎉</div>
    <div class="winner-name pop">${escapeHTML(winner.name)}</div>
  `;
  history.unshift(winner.name);
  renderHistory();
  if(!repeatSwitch.checked){
    participants[idx].eliminated = true;
    syncTextarea();
    renderList(); buildWheel();
    const remaining = participants.filter(p=>!p.eliminated).length;
    if(remaining === 0){
      setTimeout(()=>showToast('🎊 ¡Todos han sido sorteados!'), 500);
    }
  }
}
 
function renderHistory(){
  historyList.innerHTML = '';
  if(history.length === 0){
    historyList.innerHTML = '<li class="no-history">Aún no hay sorteos</li>';
    return;
  }
  history.slice(0,15).forEach((name,i) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.textContent = `${i+1}. ${name}`;
    historyList.appendChild(li);
  });
}
 
/* ══════════════════════════════════════════════
   CONFETTI BURST
══════════════════════════════════════════════ */
function spawnConfetti(){
  const emojis = ['🎉','🎊','⭐','✨','🌟','💫','🎈','🥳'];
  const rect = wheelOuter.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top  + rect.height/2;
  for(let i=0;i<14;i++){
    const el = document.createElement('div');
    el.className = 'confetti-burst';
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    const angle = (Math.random()*360) * Math.PI/180;
    const dist  = 80 + Math.random()*120;
    el.style.setProperty('--dx', Math.cos(angle)*dist+'px');
    el.style.setProperty('--dy', Math.sin(angle)*dist+'px');
    el.style.left = (cx - 20) + 'px';
    el.style.top  = (cy - 20) + 'px';
    el.style.position = 'fixed';
    el.style.zIndex = 999;
    el.style.animationDelay = Math.random()*0.3+'s';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1500);
  }
}
 
/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
function applyTheme(theme){
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme === 'fiesta' ? '' : theme);
  buildWheel();
}
 
/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
let toastTimer;
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toastEl.classList.remove('show'), 2500);
}
 
/* ══════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════ */
btnAdd.addEventListener('click', addParticipantsFromTextarea);
namesTextarea.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
    e.preventDefault();
    addParticipantsFromTextarea();
  }
});
btnSpin.addEventListener('click', spin);
btnClear.addEventListener('click', () => {
  if(participants.length===0) return;
  participants = [];
  namesTextarea.value = '';
  renderList(); buildWheel();
  showToast('🗑 Lista limpiada');
});
btnResetHist.addEventListener('click', () => {
  history = [];
  renderHistory();
  showToast('🗑 Historial borrado');
});
themeSelect.addEventListener('change', e => applyTheme(e.target.value));
repeatSwitch.addEventListener('change', () => {
  if(repeatSwitch.checked){
    participants.forEach(p => p.eliminated = false);
    syncTextarea();
    renderList(); buildWheel();
    showToast('✅ Repetición activada — todos vuelven a participar');
  } else {
    showToast('❌ El ganador se eliminará de la ruleta');
  }
});

/* INIT — participantes de ejemplo */
const defaultData = JSON.parse(
  document.getElementById('wheel-svg').closest('[data-defaults]')?.getAttribute('data-defaults')
  || document.body.getAttribute('data-defaults')
  || '["Ana","Carlos","Lucía","Miguel","Sofía","Diego","Valentina","Sebastián"]'
);
defaultData.forEach(n => {
  participants.push({ name: n, eliminated: false });
});
syncTextarea();
renderList();
renderHistory();
buildWheel();