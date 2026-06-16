/* ===========================================================
   TRANSMISSION TO MARCUS  ·  scroll experience controller
   Edit CLIPS below to set names / order. Files live in /clips.
   =========================================================== */
const CLIPS = [
  { file:'clips/c1.mp4', poster:'posters/p1.jpg', name:'CREW MEMBER 1', sector:'SECTOR 01' },
  { file:'clips/c2.mp4', poster:'posters/p2.jpg', name:'CREW MEMBER 2', sector:'SECTOR 02' },
  { file:'clips/c3.mp4', poster:'posters/p3.jpg', name:'CREW MEMBER 3', sector:'SECTOR 03' },
  { file:'clips/c4.mp4', poster:'posters/p4.jpg', name:'CREW MEMBER 4', sector:'SECTOR 04' },
  { file:'clips/c5.mp4', poster:'posters/p5.jpg', name:'CREW MEMBER 5', sector:'SECTOR 05' },
  { file:'clips/c6.mp4', poster:'posters/p6.jpg', name:'CREW MEMBER 6', sector:'SECTOR 06' },
  { file:'clips/c7.mp4', poster:'posters/p7.jpg', name:'CREW MEMBER 7', sector:'SECTOR 07' },
];
// Samuel's finale clip — set file to enable (added when he records it)
const FINALE = { file:null, poster:null, name:'YOUR COMMANDER', label:'A MESSAGE FROM YOUR COMMANDER' };

const CREW_SIGNOFF = 'WITH LOVE, FROM THE WHOLE CREW';

/* ---------- build sections ---------- */
const scroll = document.getElementById('scroll');
const score  = document.getElementById('score');
let soundOn = false;

function makeTx(c, label){
  const s = document.createElement('section');
  s.className = 'snap tx';
  s.innerHTML = `
    <div class="tx-head">
      <div class="tx-label"><span class="tx-blink"></span>${label||'INCOMING TRANSMISSION'} &middot; ${c.sector||''}</div>
      <div class="tx-name">${c.name}</div>
    </div>
    <div class="holo">
      <span class="corner c-tl"></span><span class="corner c-tr"></span>
      <span class="corner c-bl"></span><span class="corner c-br"></span>
      <span class="scan"></span>
      <video src="${c.file}" ${c.poster?`poster="${c.poster}"`:''} playsinline preload="metadata" muted></video>
      <div class="tap-sound">tap for sound</div>
    </div>`;
  return s;
}

CLIPS.forEach((c,i)=> scroll.appendChild(makeTx(c, 'INCOMING TRANSMISSION')));
if(FINALE.file){ scroll.appendChild(makeTx(FINALE, FINALE.label)); }

/* outro */
const outro = document.createElement('section');
outro.className = 'snap outro';
outro.id = 'outro';
outro.innerHTML = `
  <h2>MAY THE FORCE<br>BE WITH YOU,<br>MARCUS</h2>
  <p class="sub">Happy birthday, Commander &mdash; a few rotations late, but sent with the whole crew behind it. Now go conquer that distant world of China.</p>
  <p class="crew">${CREW_SIGNOFF}</p>`;
scroll.appendChild(outro);

/* ---------- starfield ---------- */
const cv = document.getElementById('stars'), cx = cv.getContext('2d');
let W,H,stars,warp=0;
function resize(){ W=cv.width=innerWidth*devicePixelRatio; H=cv.height=innerHeight*devicePixelRatio;
  const n = Math.min(260, Math.floor(innerWidth*innerHeight/6000));
  stars = Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,z:Math.random()*0.8+0.2,
    r:Math.random()*1.4+0.3,tw:Math.random()*Math.PI*2}));
}
resize(); addEventListener('resize',resize);
function tick(t){
  cx.clearRect(0,0,W,H);
  const drift = warp>0 ? 6 : 0.25;
  for(const s of stars){
    s.y += drift*s.z*devicePixelRatio;
    if(s.y>H){ s.y=0; s.x=Math.random()*W; }
    const a = 0.5+0.5*Math.sin(t/700 + s.tw);
    cx.globalAlpha = (warp>0?0.9:0.5+0.5*s.z)*a;
    cx.fillStyle = s.z>0.7 ? '#cfe8ff' : '#ffffff';
    if(warp>0){ cx.fillRect(s.x, s.y, s.r*s.z, 14*s.z); }
    else { cx.beginPath(); cx.arc(s.x,s.y,s.r*s.z,0,7); cx.fill(); }
  }
  if(warp>0) warp = Math.max(0, warp-0.02);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
function warpBurst(){ warp = 1; }

/* ---------- begin ---------- */
const begin = document.getElementById('begin');
const crawl = document.getElementById('crawlContent');
const muteBtn = document.getElementById('mute');
begin.addEventListener('click', ()=>{
  soundOn = true;
  score.volume = 0.6;
  score.play().catch(()=>{});
  muteBtn.hidden = false;
  document.getElementById('crawl').scrollIntoView({behavior:'smooth'});
  warpBurst();
  setTimeout(()=> crawl.classList.add('play'), 600);
});

/* crawl auto-start if reached by scroll */
new IntersectionObserver((es)=>{ es.forEach(e=>{ if(e.isIntersecting) crawl.classList.add('play'); });},
  {threshold:.4}).observe(document.getElementById('crawl'));

/* ---------- music ducking ---------- */
function duck(on){ if(!soundOn) return; score.volume = on ? 0.10 : 0.6; }

/* ---------- video play/pause + sound on scroll ---------- */
const vids = [...document.querySelectorAll('.holo video')];
vids.forEach(v=>{
  const tap = v.parentElement.querySelector('.tap-sound');
  v.parentElement.addEventListener('click', ()=>{
    v.muted = !v.muted;
    tap.style.display = v.muted ? '' : 'none';
    duck(!v.muted);
    if(v.muted) score.volume = soundOn?0.6:0;
  });
});

const vio = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    const v = e.target;
    const tap = v.parentElement.querySelector('.tap-sound');
    if(e.isIntersecting && e.intersectionRatio>0.55){
      vids.forEach(o=>{ if(o!==v){ o.pause(); } });
      warpBurst();
      v.currentTime = 0;
      v.play().then(()=>{
        if(soundOn){ v.muted=false; if(v.muted===false){ tap.style.display='none'; duck(true);} }
      }).catch(()=>{});
      // if browser refused unmute, keep hint visible
      setTimeout(()=>{ if(v.muted){ tap.style.display=''; score.volume = soundOn?0.6:0; } }, 250);
    } else {
      v.pause();
      if(!vids.some(o=>!o.paused && !o.muted)) score.volume = soundOn?0.6:0;
    }
  });
},{threshold:[0,0.55,0.9]});
vids.forEach(v=> vio.observe(v));

/* ---------- mute (music) ---------- */
muteBtn.addEventListener('click', ()=>{
  if(score.paused){ score.play().catch(()=>{}); score.volume=0.6; soundOn=true; muteBtn.textContent='🔊'; }
  else { score.pause(); muteBtn.textContent='🔇'; }
});

/* ---------- replay ---------- */
const replay = document.getElementById('replay');
new IntersectionObserver((es)=>{ es.forEach(e=> replay.hidden = !e.isIntersecting ); },
  {threshold:.5}).observe(outro);
replay.addEventListener('click', ()=>{
  crawl.classList.remove('play'); void crawl.offsetWidth;
  document.getElementById('intro').scrollIntoView({behavior:'smooth'});
});
