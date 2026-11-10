/* Standalone rotating/exploding pseudo-3D car renderer, no libraries needed. */
(()=>{
  const canvas=document.getElementById('car-canvas'); if(!canvas)return;
  const ctx=canvas.getContext('2d'); if(!ctx)return;
  const mode=document.body.dataset.mode||'explode';
  let yaw=-.60, explode=mode==='explode'?.63:0, target=explode, auto=mode==='spin', zoom=1, dragging=false, down=null, last=0, chosen='Двигатель', highlights=[];
  const $=id=>document.getElementById(id);
  const W=()=>canvas.clientWidth||600, H=()=>canvas.clientHeight||440;
  const tint=['#ffdf28','#f3bb18','#aab2b9','#26313d','#0c1017'];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches; if(reduce)auto=false;
  let scale=1,cx=0,cy=0;
  function project(p){ const c=Math.cos(yaw),s=Math.sin(yaw); const x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c; const k=1/(1+y*.085); return [cx+x*scale*k,cy+(y*.48-p[2]*.95)*scale*k,y]; }
  function face(points,color,stroke){ const f=points.map(project); const dep=f.reduce((a,x)=>a+x[2],0)/f.length; faces.push({f,color,dep,stroke}); }
  let faces=[];
  function box(x0,x1,y0,y1,z0,z1,colors,off=[0,0,0]){
    const [ox,oy,oz]=off, v=(x,y,z)=>[x+ox,y+oy,z+oz];
    const a=v(x0,y0,z0),b=v(x1,y0,z0),c=v(x1,y1,z0),d=v(x0,y1,z0),e=v(x0,y0,z1),f=v(x1,y0,z1),g=v(x1,y1,z1),h=v(x0,y1,z1);
    face([a,b,c,d],colors[4]||colors[2]); face([e,f,g,h],colors[0]); face([a,b,f,e],colors[1]); face([d,c,g,h],colors[2]); face([b,c,g,f],colors[3]||colors[1]); face([a,d,h,e],colors[3]||colors[1]);
  }
  function disk(x,y,z,r,off=[0,0,0],dark='#0a0f16',ring='#bcc3c7'){
    const [ox,oy,oz]=off, outer=[],inner=[],hub=[];
    for(let j=0;j<=24;j++){const a=j*Math.PI/12; const px=x+Math.cos(a); const pz=z+Math.sin(a); outer.push([x+ox+Math.cos(a)*r,y+oy,z+oz+Math.sin(a)*r]);inner.push([x+ox+Math.cos(a)*r*.62,y+oy,z+oz+Math.sin(a)*r*.62]);hub.push([x+ox+Math.cos(a)*r*.25,y+oy,z+oz+Math.sin(a)*r*.25]);}
    face(outer,dark);face(inner,ring);face(hub,'#333b41');
    for(let j=0;j<5;j++){let a=j*Math.PI*2/5;const t=[];for(let m=0;m<=4;m++){const q=a+m*.18;t.push([x+ox+Math.cos(q)*r*.57,y+oy+(y>0?.012:-.012),z+oz+Math.sin(q)*r*.57]);} face(t,'#48545d');}
  }
  function label(name,p){highlights.push({name,p:project(p)});}
  function render(){
    const dpr=Math.min(window.devicePixelRatio||1,2), w=W(),h=H();if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=w*dpr;canvas.height=h*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);scale=Math.min(w/6.6,h/4.8)*zoom;cx=w/2;cy=h*.66;
    const grd=ctx.createRadialGradient(cx,cy-40,20,cx,cy,Math.min(w,h)*.58);grd.addColorStop(0,'rgba(255,221,30,.09)');grd.addColorStop(1,'rgba(255,221,30,0)');ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(220,221,230,.12)';ctx.lineWidth=1;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(cx+(i-4)*70,cy+38);ctx.lineTo(cx+(i-4)*150,cy+118);ctx.stroke();}for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx,cy+48+i*20,75+i*35,14+i*8,0,0,Math.PI*2);ctx.stroke();}
    faces=[];highlights=[];const e=explode;
    const main=['#d6dce1','#8d979f','#68727e','#a4aeb4','#252f3a'];
    const roof=['#f5d924','#c7a615','#b6921c','#f2ce26','#6c5811'];
    const motor=['#cfd3d4','#67717a','#3e4852','#7e8a91'];
    box(-2.13,2.16,-.92,.92,.43,1.27,main);
    box(.87,2.15,-.85,.85,1.24,1.31,roof,[e*.5,0,e*.85]);
    box(-2.1,-1.28,-.86,.86,1.25,1.35,roof,[-e*.42,0,e*.18]);
    // cabin with lift and windows
    box(-1.16,.72,-.79,.79,1.28,1.94,['#c8d2dc','#1b2c3a','#182938','#273743'],[0,0,e*1.12]);
    box(-.92,.50,-.80,.80,1.91,1.98,roof,[0,0,e*1.12]);
    // window stripe and door handles
    box(-.91,.58,-.805,-.796,1.38,1.75,['#192d43','#0a2030','#162b3d','#31465a'],[0,0,e*1.12]);
    box(-.25,.35,-.823,-.812,1.22,1.27,['#f8f3d7','#f8f3d7','#c9d0d0'],[0,0,0]);
    // rear / front bumpers
    box(2.03,2.27,-.88,.88,.48,.77,['#15191d','#15191d','#343b40'],[e*.65,0,0]);
    box(-2.27,-2.03,-.88,.88,.52,.76,['#15191d','#23262a','#343b40'],[-e*.48,0,0]);
    // headlights / tail lights
    for(const y of [-.63,.63]){
      box(2.17,2.28,y-.22,y+.22,.95,1.13,['#fff9da','#f4e08c','#fff4c3'],[e*.65,0,0]);
      box(-2.24,-2.14,y-.22,y+.22,.91,1.07,['#eb3945','#982229','#a12431'],[-e*.48,0,0]);
    }
    // engine visible when exploded
    if(e>.08){box(.93,1.52,-.42,.42,1.33,1.75,motor,[e*.5,0,e*.40]);box(1.06,1.36,-.25,.25,1.73,1.80,roof,[e*.5,0,e*.40]);}
    for(let x of [-1.35,1.42])for(let y of [-1,1]){
      const off=[x>0?e*.22:-e*.22,y*e*.74,-e*.07];
      disk(x,y*1.02,.53,.48,off,'#080c12','#b2bec6');
      label(x>0?'Колёса и шиномонтаж':'Развал-схождение',[x+off[0],y*1.02+off[1],.53]);
    }
    label('Двигатель',[1.35+e*.5,-.3,1.5+e*.4]);label('Кузов и уход',[-.25,.5,1.7+e*1.12]);
    faces.sort((a,b)=>b.dep-a.dep);
    for(const {f,color} of faces){ctx.beginPath();f.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=color;ctx.globalAlpha=.98;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='rgba(12,19,27,.27)';ctx.lineWidth=1;ctx.stroke();}
    // neon guide lines and hotspot pins on nearest visible components
    highlights.forEach(o=>{if(o.name!==chosen)return;let [x,y]=o.p;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle='#ffe303';ctx.fill();ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.strokeStyle='rgba(255,227,3,.7)';ctx.lineWidth=1.5;ctx.stroke();});
    $('car-mode-text').textContent=(e>.35?'РЕЖИМ / EXPLODED VIEW':'РЕЖИМ / 360° VIEW');
  }
  function frame(ts){const dt=Math.min(.04,(ts-last)/1000||.016); last=ts;explode+=(target-explode)*Math.min(1,dt*5.5);if(auto&&!dragging)yaw+=dt*.32;render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  function setService(s){chosen=s;const el=$('car-service');if(el)el.textContent=s;document.querySelectorAll('[data-service-control]').forEach(b=>b.classList.toggle('active',b.dataset.serviceControl===s));}
  const controls=document.querySelectorAll('[data-service-control]');controls.forEach(b=>b.addEventListener('click',()=>setService(b.dataset.serviceControl)));
  $('car-explode')?.addEventListener('click',()=>{target=target>.3?0:.86;auto=false;});
  $('car-spin')?.addEventListener('click',()=>{target=0;auto=!auto;});
  $('car-reset')?.addEventListener('click',()=>{yaw=-.60;target=mode==='explode'?.63:0;zoom=1;auto=mode==='spin'&&!reduce;});
  $('car-zoom')?.addEventListener('click',()=>{zoom=zoom>1.15?1:1.3;});
  canvas.addEventListener('pointerdown',ev=>{dragging=true;down={x:ev.clientX,y:ev.clientY,yaw};auto=false;canvas.setPointerCapture(ev.pointerId)});
  canvas.addEventListener('pointermove',ev=>{if(dragging&&down)yaw=down.yaw+(ev.clientX-down.x)*.009;});
  const end=ev=>{if(!dragging)return;dragging=false;if(down&&Math.abs(ev.clientX-down.x)<6){let b=null,m=30;for(let p of highlights){let dist=Math.hypot(ev.offsetX-p.p[0],ev.offsetY-p.p[1]);if(dist<m){m=dist;b=p;}}if(b)setService(b.name);}down=null;};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',()=>{dragging=false;down=null});
  canvas.addEventListener('wheel',ev=>{ev.preventDefault();zoom=Math.max(.75,Math.min(1.45,zoom-ev.deltaY*.0006));},{passive:false});
})();