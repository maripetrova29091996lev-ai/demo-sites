import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const viewport=document.querySelector('#car-viewport');
const stage=document.querySelector('#car-stage');
const fallback=document.querySelector('#car-fallback');
const explodeButton=document.querySelector('#car-explode');
const resetButton=document.querySelector('#car-reset');
const title=document.querySelector('#car-part-title');
const detail=document.querySelector('#car-part-text');
const bar=document.querySelector('.car-progress b');
if (viewport && stage) {
  try {
    const scene=new THREE.Scene();
    const w=viewport.clientWidth||1000;
    const h=viewport.clientHeight||430;
    const camera=new THREE.PerspectiveCamera(31,w/h,0.1,100);
    camera.position.set(7.4,3.45,7.6);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setSize(w,h,false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.35;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    viewport.appendChild(renderer.domElement);
    const env=new RoomEnvironment();
    const pmrem=new THREE.PMREMGenerator(renderer);
    scene.environment=pmrem.fromScene(env,0.06).texture;
    env.dispose();pmrem.dispose();
    const ambient=new THREE.HemisphereLight(0xf8ffef,0x343b31,2.5);scene.add(ambient);
    const keyLight=new THREE.DirectionalLight(0xffffff,4.2);keyLight.position.set(4,8,6);scene.add(keyLight);
    const accentLight=new THREE.PointLight(0xffe303,30,14,2);accentLight.position.set(-4,2,-3);scene.add(accentLight);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=.055;
    controls.enablePan=false;controls.autoRotate=true;controls.autoRotateSpeed=.46;
    controls.minDistance=5.5;controls.maxDistance=13;
    controls.maxPolarAngle=Math.PI*.78;controls.minPolarAngle=.29;
    controls.target.set(0,.15,0);
    controls.update();
    const root=new THREE.Group();scene.add(root);
    const objects=[];
    let targetSpread=0,spread=0,partsView='all',loaded=false,carObject=null,originalCamera=camera.position.clone();
    const bodyMaterial=new THREE.MeshPhysicalMaterial({color:0xb6bcb1,metalness:.68,roughness:.25,clearcoat:1,clearcoatRoughness:.11,envMapIntensity:1.7});
    const trimMaterial=new THREE.MeshStandardMaterial({color:0x111612,metalness:.75,roughness:.27,envMapIntensity:1.3});
    const glassMaterial=new THREE.MeshPhysicalMaterial({color:0x252d29,metalness:.2,roughness:.15,transparent:true,opacity:.83,clearcoat:1});
    const loading=new THREE.LoadingManager();
    const loader=new GLTFLoader(loading);
    const draco=new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/draco/gltf/');
    loader.setDRACOLoader(draco);
    const modelURL='https://threejs.org/examples/models/gltf/ferrari.glb';
    loader.load(modelURL,gltf=>{
      const model=gltf.scene.children[0]||gltf.scene;
      carObject=model;
      root.add(model);
      // Car proportions are measured from real GLB mesh, never synthesized from boxes.
      const bounds=new THREE.Box3().setFromObject(model);
      const size=bounds.getSize(new THREE.Vector3());
      const center=bounds.getCenter(new THREE.Vector3());
      const uniform=4.85/Math.max(size.x,size.z);
      model.scale.setScalar(uniform);
      model.position.set(-center.x*uniform,-center.y*uniform+.25,-center.z*uniform);
      root.updateMatrixWorld(true);
      const body=model.getObjectByName('body');
      const glass=model.getObjectByName('glass');
      const trim=model.getObjectByName('trim');
      if(body)body.material=bodyMaterial;
      if(glass)glass.material=glassMaterial;
      if(trim)trim.material=trimMaterial;
      ['rim_fl','rim_fr','rim_rl','rim_rr'].forEach(name=>{let part=model.getObjectByName(name);if(part)part.material=trimMaterial});
      // Named wheels and glass are independently moveable meshes in the source GLB.
      const wheels=['wheel_fl','wheel_fr','wheel_rl','wheel_rr'].map(name=>model.getObjectByName(name)).filter(Boolean);
      const rims=['rim_fl','rim_fr','rim_rl','rim_rr'].map(name=>model.getObjectByName(name)).filter(Boolean);
      function register(node,kind,delta){if(node)objects.push({node,kind,base:node.position.clone(),delta})}
      wheels.forEach((wheel,index)=>{
        const signX=index%2===0?-1:1,signZ=index<2?-1:1;
        register(wheel,'wheel',new THREE.Vector3(signX*.64,.10,signZ*.31));
      });
      rims.forEach((rim,index)=>{
        const signX=index%2===0?-1:1,signZ=index<2?-1:1;
        register(rim,'wheel',new THREE.Vector3(signX*.64,.10,signZ*.31));
      });
      register(glass,'body',new THREE.Vector3(0,.48,0));
      register(trim,'body',new THREE.Vector3(0,-.12,.12));
      register(body,'body',new THREE.Vector3(0,-.08,0));
      const ground=new THREE.Mesh(new THREE.CircleGeometry(3.45,80),new THREE.MeshBasicMaterial({color:0xffe303,transparent:true,opacity:.045,side:THREE.DoubleSide,depthWrite:false}));
      ground.rotation.x=-Math.PI/2;ground.position.y=-.75;root.add(ground);
      const halo=new THREE.Group();
      for(let j=0;j<2;j++){const circle=new THREE.Mesh(new THREE.RingGeometry(2.9+j*.32,2.905+j*.32,120),new THREE.MeshBasicMaterial({color:0xffe303,transparent:true,opacity:j===0?.24:.09,side:THREE.DoubleSide,depthWrite:false}));circle.rotation.x=-Math.PI/2;circle.position.y=-.74;halo.add(circle)}
      root.add(halo);
      loaded=true;fallback?.classList.add('hidden');
      draco.dispose();
    },undefined,error=>{
      console.warn('GudAvto 3D model loading failed',error);
      if(fallback){fallback.querySelector('strong').textContent='3D-МОДЕЛЬ НЕ ЗАГРУЗИЛАСЬ';fallback.querySelector('span').textContent='Проверьте подключение к интернету или откройте в другом браузере.'}
    });
    function selectView(next){partsView=next;document.querySelectorAll('.car-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===next));
      const data={all:['ПОЛНЫЙ ОБЗОР','Вращайте автомобиль мышью или пальцем. Включайте разборку и смотрите детали.','33%'],wheel:['КОЛЁСА И ДИСКИ','В режиме разборки колёса и диски отделяются от автомобиля.','68%'],body:['КУЗОВ И ОСТЕКЛЕНИЕ','В режиме разборки кузовные элементы и остекление расходятся по слоям.','100%']};
      const info=data[next]||data.all;title.textContent=info[0];detail.textContent=info[1];bar.style.width=info[2];
      if(next!=='all')targetSpread=1;
      explodeButton.innerHTML=`<span>${targetSpread?'⊖':'⊕'}</span> ${targetSpread?'СОБРАТЬ АВТОМОБИЛЬ':'РАЗОБРАТЬ АВТОМОБИЛЬ'}`;
    }
    document.querySelectorAll('.car-tab').forEach(b=>b.addEventListener('click',()=>selectView(b.dataset.view)));
    explodeButton.addEventListener('click',()=>{targetSpread=targetSpread?0:1;explodeButton.innerHTML=`<span>${targetSpread?'⊖':'⊕'}</span> ${targetSpread?'СОБРАТЬ АВТОМОБИЛЬ':'РАЗОБРАТЬ АВТОМОБИЛЬ'}`});
    resetButton.addEventListener('click',()=>{targetSpread=0;partsView='all';selectView('all');camera.position.copy(originalCamera);controls.target.set(0,.15,0);controls.update()});
    controls.addEventListener('start',()=>{controls.autoRotate=false});
    let onScreen=true;
    if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{onScreen=entries[0]?.isIntersecting??true;accentLight.intensity=onScreen?30:10},{threshold:.1});io.observe(stage)}
    const clock=new THREE.Clock();
    const animate=()=>{requestAnimationFrame(animate);if(!onScreen)return;
      const dt=Math.min(clock.getDelta(),.1);
      spread+= (targetSpread-spread)*Math.min(1,dt*4.7);
      if(loaded){for(const o of objects){let factor=partsView==='all'?1:(o.kind===partsView?1:.28);o.node.position.copy(o.base).addScaledVector(o.delta,spread*factor)}
        const lightPulse=.1+.07*Math.sin(performance.now()*.0017);accentLight.intensity=30+lightPulse*12;
      }
      controls.update();renderer.render(scene,camera)
    };
    animate();
    const resize=()=>{const ww=viewport.clientWidth||1000,hh=viewport.clientHeight||435;camera.aspect=ww/hh;camera.updateProjectionMatrix();renderer.setSize(ww,hh,false)};
    new ResizeObserver(resize).observe(viewport);
    window.addEventListener('resize',resize,{passive:true});
  }catch(error){console.warn('3D viewer initialization error',error);if(fallback){fallback.querySelector('strong').textContent='WEBGL НЕ ДОСТУПЕН';fallback.querySelector('span').textContent='Попробуйте открыть сайт в Chrome, Safari или Firefox с включенной графикой.'}}
}