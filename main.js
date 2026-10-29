
document.querySelectorAll('.meter').forEach(m=>{
  const on=+m.dataset.on;
  for(let i=0;i<10;i++){const s=document.createElement('i');if(i<on)s.className='on';m.appendChild(s)}
});
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{
  const el=document.getElementById(b.dataset.copy),txt=el.textContent;
  const done=()=>{b.textContent='OK!';setTimeout(()=>b.textContent='COPY',1200)};
  const sel=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)};
  try{navigator.clipboard.writeText(txt).then(done,sel)}catch(e){sel()}
}));
(function(){
  const c=document.getElementById('sprite');if(!c)return;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const P={'.':null,K:'#3b0a31',H:'#3b1a2a',S:'#ffd9c2',E:'#3b0a31',P:'#ff2e93',L:'#c49bff',Y:'#ffe066',R:'#ff8cc6',B:'#ff2e93'};
  const map=[
    '......B..B......',
    '.....HHBBHH.....',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHSSSSSSHH...',
    '...HSSSSSSSSH...',
    '...HSEESSEESH...',
    '...HSSSSSSSSH...',
    '...HSRSSSSRSH...',
    '...HSSSKKSSSH...',
    '...HH.SSSS.HH...',
    '....PPPYYPPP....',
    '...PPPPLLPPPP...',
    '..SPPPPLLPPPPS..',
    '..SPPPPPPPPPPS..',
    '....KKK..KKK....'];
  let t=0;
  function draw(){
    x.fillStyle='#fff3f9';x.fillRect(0,0,160,160);
    for(let i=0;i<16;i++){const sx=(i*37+t*2)%160,sy=(i*53)%160;x.fillStyle=['#ffe066','#c49bff','#ff8cc6','#7ff0c8'][i%4];x.fillRect(sx-sx%5,sy-sy%5,5,5)}
    const bob=(Math.floor(t/8)%2)*10;
    map.forEach((row,r)=>[...row].forEach((ch,col)=>{if(P[ch]){x.fillStyle=P[ch];x.fillRect(col*10,r*10-bob+10,10,10)}}));
    t++;
  }
  draw();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(draw,120);
})();
