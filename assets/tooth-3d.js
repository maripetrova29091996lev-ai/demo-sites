// Interactive anatomical 3D tooth — reused from dantist-1-site.
// Controls, structure and mechanics retain the source design.
// Requires importmap mapping 'three' and 'three/addons/' in the consuming HTML.
import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    const canvas=document.querySelector('#tooth-canvas'), holder=document.querySelector('#tooth-container'), placeholder=document.querySelector('#tooth-placeholder');
    const desc=document.querySelector('#part-description'), title=document.querySelector('#part-title'), tooltip=document.querySelector('#model-tooltip'), labels=document.querySelector('#model-labels');
    const explodeBtn=document.querySelector('#explode-btn'), assembleBtn=document.querySelector('#reassemble-btn'), spinBtn=document.querySelector('#spin-btn');
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(37,1,.1,100);camera.position.set(5.2,3.6,7.8);
    const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.065;orbit.autoRotate=true;orbit.autoRotateSpeed=.9;orbit.enablePan=false;orbit.minDistance=4.2;orbit.maxDistance=15;orbit.maxPolarAngle=Math.PI*.89;orbit.target.set(0,0,0);
    scene.add(new THREE.HemisphereLight(0xe6fff4,0x46616a,2.25));
    const key=new THREE.DirectionalLight(0xfff5e8,3.8);key.position.set(-3,7,5);scene.add(key);
    const rim=new THREE.DirectionalLight(0x71e7cf,3.0);rim.position.set(3,2,-4);scene.add(rim);
    const ambientPoint=new THREE.PointLight(0x9adfcd,50,16);ambientPoint.position.set(-3,-3,1);scene.add(ambientPoint);
    const model=new THREE.Group();model.rotation.set(.06,.28,-.04);scene.add(model);
    const defs={
      enamel:{name:'Эмаль',description:'Плотная внешняя оболочка коронки. Защищает чувствительные внутренние ткани зуба.'},
      dentin:{name:'Дентин',description:'Основная твёрдая ткань зуба, располагается под эмалью и окружает пульпу.'},
      pulp:{name:'Пульпа',description:'Мягкая ткань в центре зуба. Здесь находятся нервные окончания и сосуды.'},
      roots:{name:'Корни зуба',description:'Удерживают зуб в челюсти, а через корневые каналы проходят сосуды и нервы.'},
      nerves:{name:'Каналы и сосуды',description:'Питают пульпу и обеспечивают чувствительность зуба.'}
    };
    const parts={};const objects=[];let exploded=false, hovered=null, autoRotate=true;
    function makePart(key){const g=new THREE.Group();g.userData.partKey=key;model.add(g);parts[key]={group:g,home:new THREE.Vector3(),target:new THREE.Vector3()};return g;}
    function tag(mesh,key){mesh.userData.partKey=key;objects.push(mesh);return mesh;}
    function crownGeometry(scale=1, yOffset=0){
      const segments=96;const rings=[[-.08,.64],[.08,.74],[.29,.88],[.55,.98],[.90,1.035],[1.18,1.04],[1.40,1.0],[1.56,.9],[1.70,.72],[1.73,.37],[1.68,.02]];
      const pos=[],uv=[],indices=[];
      rings.forEach(([y,r],j)=>{for(let i=0;i<=segments;i++){
        const a=i/segments*Math.PI*2;const modulation=1+.045*Math.cos(a*4+.24)+.018*Math.sin(a*6);
        const cusp=j>=7 ? .085*Math.cos(a*4+.3)*((j-6)/4) : .012*Math.cos(a*4);
        const x=Math.cos(a)*r*1.03*modulation*scale,z=Math.sin(a)*r*.91*modulation*scale;
        pos.push(x,(y+cusp-.7)*scale+yOffset,z);uv.push(i/segments,j/(rings.length-1));
        if(j<rings.length-1&&i<segments){const u=j*(segments+1)+i,v=u+segments+1;indices.push(u,v,u+1,v,v+1,u+1);}
      }});
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
    }
    const enamelGroup=makePart('enamel');
    const enamelMat=new THREE.MeshPhysicalMaterial({color:0xfffbf1,metalness:.02,roughness:.22,clearcoat:.8,clearcoatRoughness:.15,transparent:true,opacity:.89,side:THREE.DoubleSide,depthWrite:true});
    const crown=tag(new THREE.Mesh(crownGeometry(1),enamelMat),'enamel');crown.castShadow=true;enamelGroup.add(crown);
    const dentinGroup=makePart('dentin');const dentinMat=new THREE.MeshPhysicalMaterial({color:0xf0c887,metalness:0,roughness:.47,transparent:true,opacity:.94,side:THREE.DoubleSide});
    dentinGroup.add(tag(new THREE.Mesh(crownGeometry(.79,.01),dentinMat),'dentin'));
    const rootsGroup=makePart('roots');const rootMat=new THREE.MeshPhysicalMaterial({color:0xe5d8b1,roughness:.47,metalness:.02,clearcoat:.3});
    function taperedTube(points,r0,r1,count=28,sides=12){
      const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
      const frames=curve.computeFrenetFrames(count,false);const vertices=[],normals=[],indices=[];
      for(let i=0;i<=count;i++){const t=i/count,p=curve.getPointAt(t);const rad=r0*(1-t)+r1*t;for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;const n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));vertices.push(p.x+n.x*rad,p.y+n.y*rad,p.z+n.z*rad);normals.push(n.x,n.y,n.z);if(i<count&&j<sides){let k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);return g;
    }
    const rootPaths=[[[ -.46,-.61,.18],[-.48,-.98,.2],[-.63,-1.51,.27],[-.91,-2.01,.33]],[[.43,-.61,.16],[.49,-1.02,.17],[.62,-1.56,.14],[.82,-2.06,.14]],[[0,-.58,-.4],[-.04,-1.11,-.51],[-.02,-1.59,-.65],[-.2,-1.88,-.75]]];
    for(const path of rootPaths){rootsGroup.add(tag(new THREE.Mesh(taperedTube(path,.35,.045),rootMat),'roots'));}
    const pulpGroup=makePart('pulp'),pulpMat=new THREE.MeshPhysicalMaterial({color:0xd67978,roughness:.37,transparent:true,opacity:.95,clearcoat:.3});
    const pulp=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),pulpMat);pulp.scale.set(.31,.61,.29);pulp.position.set(0,.04,0);tag(pulp,'pulp');pulpGroup.add(pulp);
    const pulpTop=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),pulpMat);pulpTop.scale.set(.43,.23,.37);pulpTop.position.set(0,.41,0);tag(pulpTop,'pulp');pulpGroup.add(pulpTop);
    const nervesGroup=makePart('nerves');
    const redMat=new THREE.MeshStandardMaterial({color:0xdb616b,emissive:0x4c101c,emissiveIntensity:.17,roughness:.45});const blueMat=new THREE.MeshStandardMaterial({color:0x6398c9,emissive:0x10214b,emissiveIntensity:.2,roughness:.45});
    for(let k=0;k<3;k++){const path=rootPaths[k];const redpts=path.map((p,i)=>[p[0]+.06,p[1],p[2]+.03]);redpts.unshift([.08,-.08,.01]);const bluepts=path.map((p,i)=>[p[0]-.06,p[1],p[2]-.02]);bluepts.unshift([-.08,-.08,-.02]);
      nervesGroup.add(tag(new THREE.Mesh(taperedTube(redpts,.041,.02),redMat),'nerves'));
      nervesGroup.add(tag(new THREE.Mesh(taperedTube(bluepts,.038,.016),blueMat),'nerves'));
    }
    const baseline=new THREE.Group();scene.add(baseline);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.0,.012,6,120),new THREE.MeshBasicMaterial({color:0x41796d,transparent:true,opacity:.45}));ring.rotation.x=Math.PI/2;ring.position.y=-2.63;baseline.add(ring);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.53,.009,6,100),new THREE.MeshBasicMaterial({color:0x8bd1bf,transparent:true,opacity:.2}));ring2.rotation.x=Math.PI/2;ring2.position.y=-2.64;baseline.add(ring2);
    const pts=[];for(let i=0;i<100;i++){const a=Math.random()*Math.PI*2,r=2.5+Math.random()*2.8;pts.push(Math.cos(a)*r,(Math.random()-.5)*5.4,Math.sin(a)*r);}
    const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0x7acebe,size:.025,transparent:true,opacity:.55,depthWrite:false}));scene.add(particles);
    const explodeTargets={enamel:[-2.05,.85,.15],dentin:[1.47,.5,-.25],pulp:[1.78,-.88,.65],roots:[-.6,-1.08,-.2],nerves:[1.2,-1.62,1.05]};
    for(const [key,obj] of Object.entries(parts)){obj.home.copy(obj.group.position);obj.target.copy(obj.home);const l=document.createElement('span');l.className='model-label';l.textContent=defs[key].name;l.dataset.key=key;labels.append(l);obj.label=l;}
    const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    function highlight(key){if(hovered===key)return;hovered=key;title.textContent=key?defs[key].name:'Что внутри?';desc.textContent=key?defs[key].description:'Вращайте зуб мышью. Наведите на часть модели, чтобы узнать, как она устроена.';
      for(const [partId,obj] of Object.entries(parts)){obj.group.traverse(n=>{if(!n.isMesh)return; if(!n.userData.originalMaterial)n.userData.originalMaterial=n.material; if(partId===key){if(!n.userData.glowMaterial){n.userData.glowMaterial=n.material.clone();n.userData.glowMaterial.emissive=new THREE.Color(0x87cabc);n.userData.glowMaterial.emissiveIntensity=.27;}n.material=n.userData.glowMaterial;}else{n.material=n.userData.originalMaterial;}});}}
    function pointerHandler(e){const rect=canvas.getBoundingClientRect();mouse.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(objects,false);const key=hits.length?hits[0].object.userData.partKey:null;highlight(key);if(key){tooltip.style.display='block';tooltip.textContent=defs[key].name;tooltip.style.left=Math.min(e.clientX-holder.getBoundingClientRect().left+15,holder.clientWidth-120)+'px';tooltip.style.top=(e.clientY-holder.getBoundingClientRect().top-28)+'px';}else tooltip.style.display='none';}
    canvas.addEventListener('pointermove',pointerHandler);canvas.addEventListener('pointerleave',()=>{highlight(null);tooltip.style.display='none';});canvas.addEventListener('click',e=>{pointerHandler(e);if(hovered&&window.innerWidth<700){title.textContent=defs[hovered].name;desc.textContent=defs[hovered].description;}});
    function setExploded(value){exploded=value;for(const [key,obj] of Object.entries(parts)){obj.target.set(...(value?explodeTargets[key]:[0,0,0]));}explodeBtn.classList.toggle('active',!value);assembleBtn.classList.toggle('active',value);explodeBtn.setAttribute('aria-pressed',String(value));}
    explodeBtn.addEventListener('click',()=>setExploded(true));assembleBtn.addEventListener('click',()=>setExploded(false));
    spinBtn.addEventListener('click',()=>{autoRotate=!autoRotate;orbit.autoRotate=autoRotate;spinBtn.classList.toggle('active',!autoRotate);spinBtn.textContent=autoRotate?'◉ Вращение':'⊙ Включить вращение';spinBtn.setAttribute('aria-pressed',String(autoRotate));});
    canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')model.rotation.y-=.15;if(e.key==='ArrowRight')model.rotation.y+=.15;if(e.key==='ArrowUp')camera.position.z=Math.max(4.4,camera.position.z-.3);if(e.key==='ArrowDown')camera.position.z=Math.min(13,camera.position.z+.3);});
    function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
    const center=new THREE.Vector3();let frames=0;const smallScreen=()=>window.innerWidth<600;
    function animate(){requestAnimationFrame(animate);if(document.hidden)return;orbit.update();for(const obj of Object.values(parts))obj.group.position.lerp(obj.target,.064);
      if(!exploded){for(const obj of Object.values(parts))obj.label.classList.remove('visible');}
      else{for(const [key,obj] of Object.entries(parts)){obj.group.getWorldPosition(center);center.y+=key==='roots'?-.34:.2;center.project(camera);const x=(center.x*.5+.5)*canvas.clientWidth+canvas.offsetLeft;const y=(-center.y*.5+.5)*canvas.clientHeight+canvas.offsetTop;obj.label.style.left=x+'px';obj.label.style.top=y+'px';obj.label.classList.toggle('visible',center.z<1&&x>0&&x<holder.clientWidth&&y>0&&y<holder.clientHeight);}}
      renderer.render(scene,camera);if(frames++===1)placeholder.style.display='none';}
    window.addEventListener('visibilitychange',()=>{if(!document.hidden)resize();});animate();
