import * as THREE from 'three';
import {cinema} from './cinema.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';import {clone as skClone} from 'three/addons/utils/SkeletonUtils.js';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, small=innerWidth<820;
const MAROON=0x7A1F2B,MAROON_D=0x5c1520,GOLD=0xc9a24d,GOLD_B=0xe0c06a,CREAM=0xfaf7f2;
const $=s=>document.querySelector(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
const win=(P,a,b)=>clamp((P-a)/(b-a));               // 0..1 within window
const bell=(P,a,b,c,d)=>Math.min(win(P,a,b),1-win(P,c,d)); // fade in a-b, out c-d

/* ---------- kinetic headlines ---------- */
document.querySelectorAll('.kin').forEach(h=>{
  const walk=n=>{[...n.childNodes].forEach(c=>{if(c.classList&&c.classList.contains('sweep'))return;if(c.nodeType===3){const f=document.createDocumentFragment();
    c.textContent.split(/(\s+)/).forEach(w=>{if(!w.trim()){f.append(w);return}const o=document.createElement('span');o.className='w';const i=document.createElement('span');i.textContent=w;o.append(i);f.append(o)});c.replaceWith(f)}else walk(c)})};
  walk(h);});
if(!reduce){
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);
 e.target.querySelectorAll('.w>span').forEach((n,i)=>n.animate([{transform:'translateY(14%) rotate(1deg)'},{transform:'translateY(0) rotate(0)'}],{duration:1100,delay:i*65,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
 e.target.closest('.card').querySelectorAll('.eyebrow,.lead,.btns,.chips,.hint').forEach((n,i)=>n.animate([{opacity:.82,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:900,delay:200+i*70,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
 }),{threshold:.2});document.querySelectorAll('.kin').forEach(k=>io.observe(k));
}

/* ---------- renderer ---------- */
const stage=$('#stage');
const r=new THREE.WebGLRenderer({antialias:!small,alpha:true,powerPreference:'high-performance'});
r.setPixelRatio(new URLSearchParams(location.search).has('record')?.65:Math.min(devicePixelRatio,small?1.5:1.5));r.setSize(stage.clientWidth,stage.clientHeight);
r.shadowMap.enabled=!small;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;r.outputColorSpace=THREE.SRGBColorSpace;
stage.appendChild(r.domElement);
const scene=new THREE.Scene();scene.environment=new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.8;scene.fog=new THREE.Fog(0xf3ece0,14,42);
const cam=new THREE.PerspectiveCamera(small?50:38,stage.clientWidth/stage.clientHeight,.1,120);
scene.add(new THREE.HemisphereLight(0xfffaf0,0xd9c9a8,1.15));
const sun=new THREE.DirectionalLight(0xfff1d6,2.4);sun.position.set(6,10,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:40});scene.add(sun);scene.add(sun.target);
const rim=new THREE.DirectionalLight(0xe0c06a,1.2);rim.position.set(-6,3,-6);scene.add(rim);

const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.45,metalness:.1,...o});
const mGold=M(GOLD,{metalness:.85,roughness:.25,emissive:0x3a2a08}),mMaroon=M(MAROON,{roughness:.3,metalness:.25}),mCream=M(0xfffaf0,{roughness:.6}),mDark=M(0x2a2224,{roughness:.8});
const mesh=(g,m,cast=true)=>{const x=new THREE.Mesh(g,m);x.castShadow=cast;x.receiveShadow=true;return x};

/* gold dust particles everywhere */
const dustN=small?400:1200,dg=new THREE.BufferGeometry(),dp=new Float32Array(dustN*3);
for(let i=0;i<dustN;i++){dp[i*3]=(Math.random()-.5)*30;dp[i*3+1]=(Math.random()-.5)*18;dp[i*3+2]=(Math.random()-.5)*30}
dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dot=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(.4,'rgba(224,192,106,.6)');g.addColorStop(1,'rgba(224,192,106,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const dust=new THREE.Points(dg,new THREE.PointsMaterial({size:.09,map:dot,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:GOLD_B}));scene.add(dust);

/* ---------- VISITOR (auto-detected city, typed name) ---------- */
const TZ={'Asia/Dubai':['Dubai',25.2,55.27,'DXB'],'Europe/London':['London',51.5,-.12,'LHR'],'America/New_York':['New York',40.7,-74,'JFK'],'America/Chicago':['Chicago',41.9,-87.6,'ORD'],
 'America/Los_Angeles':['Los Angeles',34,-118.2,'LAX'],'America/Toronto':['Toronto',43.7,-79.4,'YYZ'],'Asia/Singapore':['Singapore',1.35,103.8,'SIN'],'Australia/Sydney':['Sydney',-33.86,151.2,'SYD'],
 'Asia/Tokyo':['Tokyo',35.7,139.7,'HND'],'Europe/Paris':['Paris',48.86,2.35,'CDG'],'Europe/Berlin':['Berlin',52.5,13.4,'BER'],'Asia/Riyadh':['Riyadh',24.7,46.7,'RUH'],'Asia/Qatar':['Doha',25.3,51.5,'DOH'],
 'Asia/Kuala_Lumpur':['Kuala Lumpur',3.14,101.7,'KUL'],'Asia/Colombo':['Colombo',6.9,79.86,'CMB'],'Asia/Kolkata':['Delhi',28.6,77.2,'DEL'],'Asia/Calcutta':['Delhi',28.6,77.2,'DEL']};
const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;const V=JSON.parse(localStorage.getItem('sv-visitor')||'null')||{name:'',city:(TZ[tz]||['Dubai'])[0]};
const cityData=c=>Object.values(TZ).find(v=>v[0].toLowerCase()===String(c).toLowerCase())||['Dubai',25.2,55.27,'DXB'];
window.__visitor=V;

/* ---------- PLANE (shared hero) ---------- */
function makePlane(){const g=new THREE.Group();
  const body=mesh(new THREE.CapsuleGeometry(.22,1.5,8,24),mCream);body.rotation.x=Math.PI/2;g.add(body);
  const nose=mesh(new THREE.SphereGeometry(.22,24,16),mMaroon);nose.position.z=.95;nose.scale.set(1,1,.6);g.add(nose);
  const stripe=mesh(new THREE.CylinderGeometry(.226,.226,1.3,24,1,true),mMaroon);stripe.rotation.x=Math.PI/2;stripe.scale.set(1,1,1);stripe.position.y=-.0;stripe.material=M(MAROON,{side:THREE.DoubleSide});stripe.scale.set(1.0,1,1);stripe.visible=false;g.add(stripe);
  const wingShape=new THREE.Shape();wingShape.moveTo(0,.25);wingShape.lineTo(1.5,-.2);wingShape.lineTo(1.5,-.38);wingShape.lineTo(0,-.3);
  const wg=new THREE.ExtrudeGeometry(wingShape,{depth:.04,bevelEnabled:false});
  [1,-1].forEach(s=>{const w=mesh(wg,mCream);w.rotation.x=-Math.PI/2;w.scale.x=s;w.position.set(0,-.05,.1);g.add(w);
    const tip=mesh(new THREE.BoxGeometry(.04,.22,.18),mGold);tip.position.set(1.5*s,.06,-.25);g.add(tip);
    const eng=mesh(new THREE.CylinderGeometry(.11,.09,.42,16),mMaroon);eng.rotation.x=Math.PI/2;eng.position.set(.62*s,-.2,.05);g.add(eng);
    const ring=mesh(new THREE.TorusGeometry(.11,.02,8,20),mGold);ring.position.set(.62*s,-.2,.26);g.add(ring);
    const tw=mesh(new THREE.BoxGeometry(.6,.03,.22),mCream);tw.position.set(.3*s,.05,-.85);g.add(tw)});
  const fin=new THREE.Shape();fin.moveTo(0,0);fin.lineTo(-.45,0);fin.lineTo(-.7,.62);fin.lineTo(-.5,.62);
  const f=mesh(new THREE.ExtrudeGeometry(fin,{depth:.04,bevelEnabled:false}),mMaroon);f.rotation.y=Math.PI/2;f.position.set(-.02,.12,-.5);g.add(f);
  const ch=mesh(new THREE.BoxGeometry(.36,.04,.9),mGold);ch.position.set(0,.0,.2);ch.scale.set(.0,1,1);g.add(ch);
  // window band
  const wb=mesh(new THREE.BoxGeometry(.02,.05,1.1),mDark);[.215,-.215].forEach(x=>{const c=wb.clone();c.position.set(x,.07,.05);g.add(c)});
  return g}

// contrail
const TRAIL=small?40:80,tg=new THREE.BufferGeometry(),tp=new Float32Array(TRAIL*3*2),tc=new Float32Array(TRAIL*3*2);
tg.setAttribute('position',new THREE.BufferAttribute(tp,3));tg.setAttribute('color',new THREE.BufferAttribute(tc,3));
const trail=new THREE.Points(tg,new THREE.PointsMaterial({size:small?.16:.2,map:dot,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(trail);
const hist=[];

/* ---------- REAL MODELS: airliner (CC0) + hands (MIT) ---------- */
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/').detectSupport(r));
const air=new THREE.Group();scene.add(air);air.visible=false;let airReady=false,nacL=null,nacR=null;
const liveryTex=(draw,w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const emblemImg=new Image();emblemImg.src='3d/img/logo-emblem.png';
Promise.all([loader.loadAsync('3d/models/airliner.glb'),document.fonts.ready,emblemImg.decode().catch(()=>{})]).then(([g])=>{
 const m=g.scene;m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const n=o.material.name;
   if(/paint_white/.test(n)){o.material=o.material.clone();o.material.color.set(0xfdfcf9);o.material.roughness=.28;o.material.metalness=.05;o.material.envMapIntensity=1.2}
   if(/paint_stripe/.test(n)){o.material=o.material.clone();o.material.color.set(MAROON)}
   if(/paint_belly/.test(n)){o.material=o.material.clone();o.material.color.set(0xd8d2c8)}
   if(/paint_wing/.test(n)){o.material=o.material.clone();o.material.color.set(0xc9c6c0)}}});
 m.traverse(o=>{if(/^gear_/.test(o.name))o.userData.gear=1});
 const fus=[];m.getObjectByName('fuselage').traverse(o=>{if(o.isMesh&&/paint_white/.test(o.material.name))fus.push(o)});
 const fin=[];m.getObjectByName('fin').traverse(o=>{if(o.isMesh)fin.push(o)});
 m.updateMatrixWorld(true);
 const nameTex=liveryTex((x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#7A1F2B';x.font='600 150px "Playfair Display",Georgia,serif';x.textBaseline='middle';x.fillText('Sarvadhara',20,h*.5);
   const w1=x.measureText('Sarvadhara ').width;x.font='italic 600 150px "Playfair Display",Georgia,serif';x.fillStyle='#a6853a';x.fillText('Travels',20+w1,h*.5)},1500,220);
 const nameTexL=nameTex.clone();nameTexL.flipY=false;nameTexL.wrapS=THREE.RepeatWrapping;nameTexL.repeat.x=-1;nameTexL.offset.x=1;nameTexL.needsUpdate=true;
 const stripeTex=liveryTex((x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#7A1F2B';x.fillRect(0,h*.3,w,h*.34);x.fillStyle='#c9a24d';x.fillRect(0,h*.7,w,h*.12)},1024,64);
 const embTex=liveryTex((x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#7A1F2B';x.beginPath();x.arc(w/2,h/2,w*.48,0,7);x.fill();x.strokeStyle='#c9a24d';x.lineWidth=14;x.stroke();
   if(emblemImg.complete&&emblemImg.naturalWidth){x.save();x.beginPath();x.arc(w/2,h/2,w*.4,0,7);x.clip();x.drawImage(emblemImg,w*.1,h*.1,w*.8,h*.8);x.restore()}},512,512);
 const dm=t=>new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:.3,metalness:.05});
 const decal=(meshes,pos,rot,size,mat)=>meshes.forEach(ms=>{const d=new THREE.Mesh(new DecalGeometry(ms,pos,rot,size),mat);d.renderOrder=2;m.attach?m.attach(d):m.add(d)});
 [1,-1].forEach(sd=>{
   decal(fus,new THREE.Vector3(1.98*sd,4.95,3.5),new THREE.Euler(0,sd*Math.PI/2,sd<0?Math.PI:0),new THREE.Vector3(15,2.2,3),dm(sd<0?nameTexL:nameTex));
   decal(fus,new THREE.Vector3(1.98*sd,3.35,-1),new THREE.Euler(0,sd*Math.PI/2,0),new THREE.Vector3(34,.9,3),dm(stripeTex));
   decal(fin,new THREE.Vector3(.43*sd,8.4,-15.2),new THREE.Euler(0,sd*Math.PI/2,0),new THREE.Vector3(4.6,4.6,2),dm(embTex));});
 m.position.y=-3.95;air.add(m);nacL=m.getObjectByName('nacelle_L');nacR=m.getObjectByName('nacelle_R');airReady=true;
 const mm=m.clone();mm.traverse(o=>{if(o.userData.gear)o.visible=false});mm.scale.setScalar(.0075);mm.rotation.y=0;mm.position.y=0;
 mini.clear();mini.scale.setScalar(1);mini.add(mm);
}).catch(e=>console.warn('airliner',e));
const handsG=new THREE.Group();scene.add(handsG);
const goldPBR=new THREE.MeshPhysicalMaterial({color:0xf2c76a,metalness:1,roughness:.24,clearcoat:.5,clearcoatRoughness:.15,envMapIntensity:2.6,emissive:0x5a3a08,emissiveIntensity:.35});
['left','right'].forEach(side=>loader.loadAsync('3d/models/hand-'+side+'.glb').then(g=>{const h=g.scene,sg=side==='right'?1:-1;
 h.traverse(o=>{if(o.isMesh){o.material=goldPBR;o.frustumCulled=false;o.castShadow=true}});
 const pv=new THREE.Group();pv.add(h);h.scale.setScalar(R*8.2);h.rotation.set(0,.35*sg,(-Math.PI/2-.42)*sg);
 pv.position.set(R*1.05*sg,-R*.78,R*.2);pv.userData.sg=sg;handsG.add(pv)}));

/* ---------- CLOUDS ---------- */
const clouds=new THREE.Group();scene.add(clouds);
const cMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92,emissive:0xf5edd8,emissiveIntensity:.25});
for(let i=0;i<(small?14:28);i++){const c=new THREE.Group();for(let j=0;j<5;j++){const s=new THREE.Mesh(new THREE.SphereGeometry(.5+Math.random()*.6,16,12),cMat);s.position.set((j-2)*.6,Math.random()*.3,Math.random()*.4);s.scale.y=.6;c.add(s)}
  c.userData={x:(Math.random()-.5)*14,y:(Math.random()-.5)*6-1,z:-Math.random()*40};clouds.add(c)}

/* ---------- GLOBE ---------- */
const globe=new THREE.Group();scene.add(globe);const R=2.2;
const gMat=new THREE.MeshPhysicalMaterial({color:0xfffbf2,roughness:.3,clearcoat:1,clearcoatRoughness:.08,emissive:0xf5edd8,emissiveIntensity:.18,envMapIntensity:.9});
const sphere=mesh(new THREE.SphereGeometry(R,96,96),gMat);globe.add(sphere);
const atm=new THREE.Mesh(new THREE.SphereGeometry(R*1.18,64,64),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{c:{value:new THREE.Color(GOLD_B)}},vertexShader:'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 c;varying vec3 n;void main(){float i=pow(.68-dot(n,vec3(0,0,1.)),2.5);gl_FragColor=vec4(c,1.)*i*.45;}'}));globe.add(atm);
const ll=(lat,lon,rad)=>{const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;return new THREE.Vector3(-rad*Math.sin(p)*Math.cos(t),rad*Math.cos(p),rad*Math.sin(p)*Math.sin(t))};
const spin=new THREE.Group();globe.add(spin);spin.add(sphere);
const N=small?9000:24000;
const img=new Image();img.crossOrigin='anonymous';
const build=mask=>{const pts=[];for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,lat=Math.asin(y)*180/Math.PI,lon=((i*137.508)%360)-180;if(mask(lat,lon))pts.push(...ll(lat,lon,R*1.004).toArray())}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));spin.add(new THREE.Points(g,new THREE.PointsMaterial({color:MAROON,size:small?.04:.032,transparent:true,opacity:.9})))};
img.onload=()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.drawImage(img,0,0,512,256);const d=x.getImageData(0,0,512,256).data;build((la,lo)=>d[((Math.floor((90-la)/180*255))*512+Math.floor((lo+180)/360*511))*4]<90)};
img.onerror=()=>build((la,lo)=>[[8,37,68,97],[20,55,-10,60],[-35,37,-18,52],[24,70,-130,-60],[-55,12,-80,-35],[10,70,60,140],[-40,-10,113,153]].some(b=>la>b[0]&&la<b[1]&&lo>b[2]&&lo<b[3]));
img.src='https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_specular_2048.jpg';
const CHN=[13.08,80.27],vc=cityData(V.city),dests=[[vc[1],vc[2]],[51.5,-.12],[40.7,-74],[1.35,103.8],[-33.86,151.2],[35.7,139.7]];
const arcs=dests.map(d=>{const a=ll(...CHN,R),b=ll(...d,R),m=a.clone().add(b).multiplyScalar(.5);m.setLength(R+a.distanceTo(b)*.42);
  const c=new THREE.QuadraticBezierCurve3(a,m,b),g=new THREE.TubeGeometry(c,80,.012,6);const t=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:GOLD}));spin.add(t);
  const pin=new THREE.Mesh(new THREE.SphereGeometry(.045,12,12),new THREE.MeshBasicMaterial({color:MAROON}));pin.position.copy(b);spin.add(pin);return {c,t,n:g.index.count}});
const hub=new THREE.Mesh(new THREE.SphereGeometry(.07,16,16),mGold);hub.position.copy(ll(...CHN,R));spin.add(hub);
const ringG=new THREE.Mesh(new THREE.TorusGeometry(R*1.45,.008,8,240),new THREE.MeshBasicMaterial({color:GOLD}));ringG.rotation.x=1.2;globe.add(ringG);
const mini=new THREE.Group();spin.add(mini);
// drag spin
let drag=null,dragVel=0,dragRot=0;
stage.addEventListener('pointerdown',e=>{drag=e.clientX});addEventListener('pointerup',()=>drag=null);
addEventListener('pointermove',e=>{if(drag!==null){const d=e.clientX-drag;drag=e.clientX;dragVel=d*.006;dragRot+=dragVel}});

/* ---------- ROAD + CAR ---------- */
const road=new THREE.Group();scene.add(road);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;road.add(ground);
const tarmac=mesh(new THREE.PlaneGeometry(3.4,80),M(0x3d3336,{roughness:.9}),false);tarmac.rotation.x=-Math.PI/2;tarmac.position.y=.01;road.add(tarmac);
[1.6,-1.6].forEach(x=>{const e=mesh(new THREE.PlaneGeometry(.08,80),mGold,false);e.rotation.x=-Math.PI/2;e.position.set(x,.02,0);road.add(e)});
const dashes=new THREE.Group();road.add(dashes);for(let i=0;i<40;i++){const d=mesh(new THREE.PlaneGeometry(.1,.9),new THREE.MeshBasicMaterial({color:GOLD_B}),false);d.rotation.x=-Math.PI/2;d.position.set(0,.025,-40+i*2);dashes.add(d)}
const palms=new THREE.Group();road.add(palms);
for(let i=0;i<16;i++){const p=new THREE.Group();const tr=mesh(new THREE.CylinderGeometry(.06,.09,1.8,8),M(0x8f6e2a));tr.position.y=.9;p.add(tr);
  for(let k=0;k<6;k++){const l=mesh(new THREE.ConeGeometry(.12,1.1,4),M(0x6f8a4a,{roughness:.8}));l.position.y=1.8;l.rotation.z=1.2;l.rotation.y=k;l.geometry.translate(0,.55,0);p.add(l)}
  p.position.set((i%2?1:-1)*(2.6+Math.random()),0,-40+i*5);palms.add(p)}
const car=new THREE.Group();road.add(car);
{const b=mesh(new THREE.BoxGeometry(1.3,.42,2.8),mMaroon);b.position.y=.5;car.add(b);
 const hood=mesh(new THREE.BoxGeometry(1.28,.1,.9),mMaroon);hood.position.set(0,.74,1.0);hood.rotation.x=-.08;car.add(hood);
 const cab=mesh(new THREE.BoxGeometry(1.14,.46,1.35),M(0x3a3640,{roughness:.08,metalness:.8}));cab.position.set(0,.9,-.15);cab.scale.set(.95,.8,1);car.add(cab);
 const roof=mesh(new THREE.BoxGeometry(1.16,.06,1.2),mMaroon);roof.position.set(0,1.17,-.15);car.add(roof);
 const trim=mesh(new THREE.BoxGeometry(1.32,.05,2.82),mGold);trim.position.y=.46;car.add(trim);
 [[.62,1.0],[-.62,1.0],[.62,-.95],[-.62,-.95]].forEach(([x,z])=>{const w=mesh(new THREE.CylinderGeometry(.28,.28,.22,24),mDark);w.rotation.z=Math.PI/2;w.position.set(x,.3,z);car.add(w);
   const hc=mesh(new THREE.CylinderGeometry(.13,.13,.23,16),mGold);hc.rotation.z=Math.PI/2;hc.position.copy(w.position);car.add(hc);w.userData.wheel=1});
 [.45,-.45].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.28,.08,.04),new THREE.MeshBasicMaterial({color:0xfff3d0}));h.position.set(x,.58,1.41);car.add(h);
   const t=new THREE.Mesh(new THREE.BoxGeometry(.3,.07,.04),new THREE.MeshBasicMaterial({color:0xff4a4a}));t.position.set(x,.6,-1.41);car.add(t)});}
const boot=new THREE.Group();boot.position.set(0,.71,-.82);car.add(boot);
const lid=mesh(new THREE.BoxGeometry(1.28,.08,.6),mMaroon);lid.position.z=-.3;boot.add(lid);
const head=new THREE.SpotLight(0xfff1d6,0,10,.5,.6);head.position.set(0,.6,1.4);head.target.position.set(0,0,6);car.add(head,head.target);

/* ---------- PARCEL ---------- */
const parcel=new THREE.Group();scene.add(parcel);
const kraft=M(0xc9a26a,{roughness:.85});
const shapeP=new THREE.Shape();shapeP.moveTo(-.392,-.292);shapeP.lineTo(.392,-.292);shapeP.lineTo(.392,.292);shapeP.lineTo(-.392,.292);shapeP.closePath();
const boxG=new THREE.ExtrudeGeometry(shapeP,{depth:.784,steps:1,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2});boxG.translate(0,0,-.392);const pBox=mesh(boxG,kraft);parcel.add(pBox);
const flaps=[];[[0,.4,1],[0,-.4,1],[.4,0,0],[-.4,0,0]].forEach(([x,z,ax],i)=>{const piv=new THREE.Group();piv.position.set(x,.3,z);const f=mesh(new THREE.BoxGeometry(ax?.8:.4,.02,ax?.4:.8),kraft);
  f.position.set(ax?0:(x>0?-.2:.2),0,ax?(z>0?-.2:.2):0);piv.add(f);piv.userData={ax,s:(x||z)>0?1:-1};parcel.add(piv);flaps.push(piv)});
const tape=mesh(new THREE.BoxGeometry(.16,.012,.82),mGold);tape.position.y=.32;parcel.add(tape);tape.scale.z=.001;
const labelTex=liveryTex((x,w,h)=>{x.fillStyle='#fffaf0';x.fillRect(0,0,w,h);x.fillStyle='#7A1F2B';x.fillRect(0,0,w,46);x.fillStyle='#fff';x.font='800 26px Manrope,sans-serif';x.font='800 22px Manrope,sans-serif';x.fillText('SARVADHARASAI ENTERPRISES',14,31);
 x.fillStyle='#1a1214';x.font='700 22px Manrope,sans-serif';x.fillText('FROM  CHENNAI (MAA)',14,84);x.font='600 40px "Playfair Display",serif';x.fillStyle='#7A1F2B';x.fillText('To '+V.city,14,136);
 for(let i=0;i<36;i++){x.fillStyle='#1a1214';x.fillRect(14+i*8,154,(i*7%3)+2,40)}},340,210);window.__relabel=()=>{const c=labelTex.image,x=c.getContext('2d');x.fillStyle='#fffaf0';x.fillRect(0,100,340,48);x.font='600 40px "Playfair Display",serif';x.fillStyle='#7A1F2B';x.fillText('To '+window.__visitor.city,14,136);labelTex.needsUpdate=true};
const label=mesh(new THREE.PlaneGeometry(.5,.31),new THREE.MeshStandardMaterial({map:labelTex,roughness:.7}));label.position.set(0,0,.401);parcel.add(label);
// container ribs (for morph)
const ribs=new THREE.Group();parcel.add(ribs);for(let i=0;i<9;i++){const rb=mesh(new THREE.BoxGeometry(.03,.62,.82),mMaroon);rb.position.x=-.38+i*.095;ribs.add(rb)}ribs.visible=false;
// doorstep house
const house=new THREE.Group();scene.add(house);
{const w=mesh(new THREE.BoxGeometry(3,2.2,2),mCream);w.position.y=1.1;house.add(w);
 const roof=mesh(new THREE.ConeGeometry(2.3,1.2,4),mMaroon);roof.rotation.y=Math.PI/4;roof.position.y=2.8;roof.scale.z=.75;house.add(roof);
 const door=mesh(new THREE.BoxGeometry(.7,1.3,.06),M(MAROON_D));door.position.set(0,.75,1.02);house.add(door);
 const knob=mesh(new THREE.SphereGeometry(.05,8,8),mGold);knob.position.set(.22,.75,1.07);house.add(knob);
 const step=mesh(new THREE.BoxGeometry(1.4,.12,.7),M(0xe8dfd0));step.position.set(0,.06,1.35);house.add(step);
 const lamp=new THREE.PointLight(0xe0c06a,2,4);lamp.position.set(0,1.7,1.4);house.add(lamp);
 [-.95,.95].forEach(x=>{const wn=mesh(new THREE.BoxGeometry(.5,.5,.05),M(0xf5edd8,{emissive:0xe0c06a,emissiveIntensity:.4}));wn.position.set(x,1.3,1.02);house.add(wn)});}

/* ---------- PORT: sea, ship, crane ---------- */
const port=new THREE.Group();scene.add(port);
const seaG=new THREE.PlaneGeometry(60,60,small?40:90,small?40:90);const sea=mesh(seaG,new THREE.MeshPhysicalMaterial({color:0xcfe0e3,roughness:.15,metalness:.1,clearcoat:1,transparent:true,opacity:.95}),false);sea.rotation.x=-Math.PI/2;port.add(sea);
const seaBase=seaG.attributes.position.array.slice();
const ship=new THREE.Group();port.add(ship);
{const hs=new THREE.Shape();hs.moveTo(-3.4,0);hs.lineTo(3.0,0);hs.quadraticCurveTo(4.2,0,4.4,.9);hs.lineTo(-3.6,.9);hs.lineTo(-3.4,0);
 const hull=mesh(new THREE.ExtrudeGeometry(hs,{depth:1.6,bevelEnabled:false}),mMaroon);hull.position.set(0,-.4,-.8);ship.add(hull);
 const deck=mesh(new THREE.BoxGeometry(7.6,.06,1.6),mCream);deck.position.set(.3,.52,0);ship.add(deck);
 const band=mesh(new THREE.BoxGeometry(7.9,.08,1.62),mGold);band.position.set(.35,.3,0);ship.add(band);
 const br=mesh(new THREE.BoxGeometry(.9,1.1,1.3),mCream);br.position.set(-2.9,1.1,0);ship.add(br);
 const brw=mesh(new THREE.BoxGeometry(.92,.15,1.32),mDark);brw.position.set(-2.9,1.45,0);ship.add(brw);
 const cols=[MAROON,GOLD,0xfffaf0,MAROON_D,0xa6853a];
 for(let x=0;x<6;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){if(x===3&&y===1&&z===0)continue;const c=mesh(new THREE.BoxGeometry(.78,.42,.66),M(cols[(x*3+y+z*2)%5],{roughness:.55}));c.position.set(-1.9+x*.82,.76+y*.44,-.36+z*.72);ship.add(c)}}
const crane=new THREE.Group();port.add(crane);
{const legM=M(GOLD,{metalness:.7,roughness:.3});[[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]].forEach(([x,z])=>{const l=mesh(new THREE.BoxGeometry(.12,5,.12),legM);l.position.set(x,2.5,z);crane.add(l)});
 const top=mesh(new THREE.BoxGeometry(1.4,.25,1.4),legM);top.position.y=5;crane.add(top);
 const jib=mesh(new THREE.BoxGeometry(.25,.25,8),legM);jib.position.set(0,5.2,2.2);crane.add(jib);
 const cab=mesh(new THREE.BoxGeometry(.6,.5,.6),mMaroon);cab.position.set(0,4.6,.9);crane.add(cab);}
crane.position.set(1.0,0,-4.0);
const trolley=mesh(new THREE.BoxGeometry(.4,.15,.4),mDark);port.add(trolley);
const cableG=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const cable=new THREE.Line(cableG,new THREE.LineBasicMaterial({color:0x3d3336}));port.add(cable);

/* ---------- REALISTIC MODELS for car, house, ship, crane, parcel, container (tevy.dev, CC0) ---------- */
const swap=(grp,model,keep=o=>o.userData.brand||o.isLight)=>{grp.children.slice().forEach(c=>{if(!keep(c))c.visible=false});grp.add(model)};
const prep=(m,f)=>{m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;f&&f(o)}});return m};
const paint=(o,re,col,extra={})=>{if(re.test(o.material.name)){o.material=o.material.clone();o.material.color.set(col);Object.assign(o.material,extra)}};
loader.loadAsync('3d/models/suv.glb').then(g=>{const m=prep(g.scene,o=>{paint(o,/^paint/,MAROON,{roughness:.22,metalness:.6,envMapIntensity:1.4});paint(o,/^rim_paint/,0xc9a24d,{metalness:.9,roughness:.25})});
 m.scale.setScalar(.6);swap(car,m);boot.visible=false});
loader.loadAsync('3d/models/apartment-block.glb').then(g=>{const m=prep(g.scene);m.scale.setScalar(.19);m.position.z=-.95;swap(house,m,o=>o.userData.brand||o.isLight||o.userData.court)});
loader.loadAsync('3d/models/container-ship.glb').then(g=>{const m=prep(g.scene,o=>{paint(o,/body1$/,0x7A1F2B,{roughness:.45});
  const k=o.material.name.match(/container_(\d)/);if(k){o.material=o.material.clone();o.material.color.set([MAROON,GOLD,0xfffaf0,MAROON_D,0xa6853a][k[1]%5])}});
 m.scale.setScalar(.055);m.rotation.y=Math.PI/2;swap(ship,m);window.__shipTop=new THREE.Box3().setFromObject(m).max.y});
loader.loadAsync('3d/models/harbour-crane.glb').then(g=>{const m=prep(g.scene,o=>paint(o,/body1$/,GOLD,{metalness:.75,roughness:.3}));m.scale.setScalar(.1);m.traverse(o=>{if(['hoist_ropes','spreader','trolley'].includes(o.name))o.visible=false});swap(crane,m)});
kraft.color.set(0xc49a5e);kraft.roughness=.9;
loader.loadAsync('3d/models/shipping-container.glb').then(g=>{const m=prep(g.scene,o=>paint(o,/body1$/,MAROON,{roughness:.4,metalness:.5}));const b=new THREE.Box3().setFromObject(m),sz=b.getSize(new THREE.Vector3());
 const sc=.8/Math.max(sz.x,sz.z);m.scale.setScalar(sc);if(sz.z>sz.x)m.rotation.y=Math.PI/2;m.position.y=-.3*1;window.__cont=m;
 ribs.children.slice().forEach(c=>{if(!c.userData.brand)c.visible=false});ribs.add(m)});

/* ---------- BRAND everywhere ---------- */
const brandMesh=(w,h,cw,ch,draw,opts={})=>{const t=liveryTex(draw,cw,ch);return tagB(new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.4,metalness:.05,polygonOffset:true,polygonOffsetFactor:-2,...opts})))};const tagB=m=>{m.userData.brand=1;return m};
const drawEmb=(x,cx,cy,r)=>{x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.fillStyle='#fffaf0';x.fill();x.lineWidth=r*.12;x.strokeStyle='#c9a24d';x.stroke();x.clip();if(emblemImg.naturalWidth)x.drawImage(emblemImg,cx-r*.85,cy-r*.85,r*1.7,r*1.7);x.restore()};
const brandAll=()=>{
 // car doors
 [1,-1].forEach(sd=>{const d=brandMesh(1.5,.32,768,164,(x,w,h)=>{x.clearRect(0,0,w,h);drawEmb(x,80,h/2,62);x.fillStyle='#e0c06a';x.font='600 62px "Playfair Display",serif';x.textBaseline='middle';x.fillText('Sarvadhara',160,h/2-20);
   x.font='italic 600 46px "Playfair Display",serif';x.fillStyle='#fffaf0';x.fillText('Travels · Car Rentals',160,h/2+34)});d.position.set(.66*sd,.5,-.05);d.rotation.y=sd*Math.PI/2;car.add(d)});
 const rs=brandMesh(.9,.2,512,114,(x,w,h)=>{x.fillStyle='#7A1F2B';x.fillRect(0,0,w,h);x.fillStyle='#e0c06a';x.font='700 52px Manrope,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('SARVADHARA',w/2,h/2+2)});
 rs.position.set(0,1.18,-.1);car.add(rs);const rs2=rs.clone();rs2.rotation.y=Math.PI;rs2.position.z=-.16;car.add(rs2);
 const sb=tagB(mesh(new THREE.BoxGeometry(.06,.1,.06),mGold));sb.position.set(0,1.06,-.1);car.add(sb);rs2.position.set(0,1.18,-.11);
 // parcel tape text
 tape.material=new THREE.MeshStandardMaterial({map:liveryTex((x,w,h)=>{x.fillStyle='#c9a24d';x.fillRect(0,0,w,h);x.fillStyle='#5c1520';x.font='800 30px Manrope,sans-serif';x.textBaseline='middle';
   for(let i=0;i<3;i++)x.fillText('SARVADHARASAI ENTERPRISES  ·',10+i*520-0,h/2)},1024,64),metalness:.5,roughness:.35});
 tape.material.map.rotation=Math.PI/2;tape.material.map.center.set(.5,.5);
 // container side panels (shown after the parcel becomes a container)
 [1,-1].forEach(sd=>{const c=brandMesh(.74,.5,740,500,(x,w,h)=>{x.fillStyle='#7A1F2B';x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=6;for(let i=0;i<18;i++){x.beginPath();x.moveTo(20+i*40,0);x.lineTo(20+i*40,h);x.stroke()}
   drawEmb(x,120,h/2,82);x.fillStyle='#e0c06a';x.font='600 64px "Playfair Display",serif';x.textBaseline='middle';x.fillText('SarvadharaSai',230,h/2-40);x.font='700 34px Manrope,sans-serif';x.fillStyle='#fffaf0';x.fillText('ENTERPRISES · EXPORT-IMPORT',230,h/2+30)});
   c.position.z=.416*sd;if(sd<0)c.rotation.y=Math.PI;ribs.add(c)});
 // ship hull name
 [1,-1].forEach(sd=>{const n=brandMesh(4.2,.42,1400,140,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#e0c06a';x.font='600 80px "Playfair Display",serif';x.textBaseline='middle';x.fillText('SARVADHARASAI ENTERPRISES',20,h/2)});
   n.position.set(.2,.16,.67*sd);if(sd<0)n.rotation.y=Math.PI;ship.add(n)});
 // a branded container on deck
 // globe hub label
 const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:liveryTex((x,w,h)=>{x.fillStyle='rgba(255,250,240,.92)';x.beginPath();x.roundRect(4,4,w-8,h-8,40);x.fill();x.strokeStyle='#c9a24d';x.lineWidth=4;x.stroke();drawEmb(x,48,h/2,30);
   x.fillStyle='#7A1F2B';x.font='600 38px "Playfair Display",serif';x.textBaseline='middle';x.fillText('Sarvadhara Travels',92,h/2-12);x.fillStyle='#a6853a';x.font='700 20px Manrope,sans-serif';x.fillText('CHENNAI HUB',92,h/2+24)},460,96),depthTest:false}));
 gl.scale.set(1.15,.24,1);gl.position.copy(ll(...CHN,R*1.12));gl.center.set(0,.5);spin.add(gl);
 // house door plaque
 const pl=brandMesh(.6,.16,480,128,(x,w,h)=>{x.fillStyle='#fffaf0';x.fillRect(0,0,w,h);x.fillStyle='#7A1F2B';x.font='800 34px Manrope,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('DELIVERED BY',w/2,36);x.font='600 40px "Playfair Display",serif';x.fillText('SarvadharaSai',w/2,88)});
 pl.position.set(0,1.0,1.95);house.add(pl);
};
Promise.all([document.fonts.ready,emblemImg.decode().catch(()=>{})]).then(brandAll);

/* ---------- FINALE: every journey flows back as gold threads into the hands ---------- */
const fin=new THREE.Group();scene.add(fin);const finTarget=new THREE.Vector3(0,-1.1,0.4);
const thrMat=new THREE.MeshBasicMaterial({color:GOLD_B,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
const threads=[[-9,3,-3],[9,4,-4],[-8,-4,2],[8,-3,1],[0,7,-6],[-3,-6,-2],[4,6,-5]].map(([x,y,z])=>{const a=new THREE.Vector3(x,y,z),c=new THREE.CatmullRomCurve3([a,a.clone().multiplyScalar(.55).add(new THREE.Vector3(0,1.5,1)),new THREE.Vector3(x*.15,1.4,.8),finTarget]);
 const g=new THREE.TubeGeometry(c,120,.018,6);const m=new THREE.Mesh(g,thrMat);fin.add(m);const head=new THREE.Sprite(new THREE.SpriteMaterial({map:dot,color:0xfff1c8,blending:THREE.AdditiveBlending,depthWrite:false}));head.scale.setScalar(.45);fin.add(head);return {c,m,n:g.index.count,head}});
const finGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:dot,color:0xe0c06a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));finGlow.scale.setScalar(9);fin.add(finGlow);

/* ---------- SKY: scroll is the flight — dawn → day → golden hour → night ---------- */
const sky=$('.sky');const SK=[[0,'#fde9e1','#faf7f2','#f3e3d6'],[1.2,'#fffdf8','#faf7f2','#efe6d6'],[3,'#fff4dc','#f8ecd2','#ecd3a4'],[4.3,'#ffe7c2','#f2cfa0','#c98f66'],[5,'#3a2430','#24161d','#120c10'],[6,'#3a2430','#24161d','#120c10']];
const hx=h=>new THREE.Color(h);const skyCols=[0,0,0].map(()=>new THREE.Color());
const starG=new THREE.BufferGeometry(),sp=new Float32Array(900*3);for(let i=0;i<900;i++){const v=new THREE.Vector3().randomDirection().multiplyScalar(45);v.y=Math.abs(v.y)*.8+2;v.toArray(sp,i*3)}
starG.setAttribute('position',new THREE.BufferAttribute(sp,3));const stars=new THREE.Points(starG,new THREE.PointsMaterial({size:.35,map:dot,transparent:true,depthWrite:false,opacity:0,blending:THREE.AdditiveBlending,fog:false}));scene.add(stars);
function skyAt(p){let i=0;while(i<SK.length-2&&p>SK[i+1][0])i++;const a=SK[i],b=SK[i+1],t=clamp((p-a[0])/(b[0]-a[0]));
 for(let k=0;k<3;k++)skyCols[k].copy(hx(a[k+1])).lerp(hx(b[k+1]),t);
 sky.style.background=`radial-gradient(80% 60% at 60% 30%,#${skyCols[0].getHexString()} 0%,#${skyCols[1].getHexString()} 45%,#${skyCols[2].getHexString()} 100%)`;
 scene.fog.color.copy(skyCols[1]);if(!small)scene.background=skyCols[1].clone();stars.material.opacity=clamp((p-4.5)/.4);document.body.classList.toggle('night',p>4.75)}

/* ---------- scroll ---------- */
const secs=[...document.querySelectorAll('[data-s]')];
let P=0,PT=0;
const readScroll=()=>{let v=0;secs.forEach((s,i)=>{const b=s.getBoundingClientRect(),h=b.height-innerHeight;if(b.top<=0)v=i+clamp(-b.top/h)});
  const last=secs[secs.length-1].getBoundingClientRect();if(last.bottom<innerHeight)v=secs.length;PT=v;
  const mx=document.documentElement.scrollHeight-innerHeight;$('.progress').style.width=(scrollY/mx*100)+'%'};
addEventListener('scroll',readScroll,{passive:true});readScroll();P=PT;
/* journey: one swipe = one full scene (like a reel); it also plays on its own from welcome to finale */
(()=>{if(reduce)return;const REST=[0,1.6,2.4,3.37,3.87,4.9,5.9],HOLD=[5200,5200,5200,5200,5200,5200,0],LAST=REST[REST.length-1];let anim=0,timer=0,userT=0,done=false,lock=0;
 const yFor=v=>{const i=Math.min(secs.length-1,Math.floor(v)),f=v-i,s=secs[i],top=s.getBoundingClientRect().top+scrollY,h=Math.max(0,s.offsetHeight-innerHeight);return top+f*h};
 const stop=()=>{if(anim){cancelAnimationFrame(anim);anim=0}};
const typing=()=>{const ae=document.activeElement;return ae&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)};
 const glide=(to,cb)=>{stop();const y0=scrollY,y1=Math.min(to,document.documentElement.scrollHeight-innerHeight),d=y1-y0;if(Math.abs(d)<4){cb&&cb();return}
  const dur=Math.min(2600,Math.max(1300,Math.abs(d)*.9)),t0=performance.now();
  const step=t=>{const k=Math.min(1,(t-t0)/dur),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;scrollTo(0,y0+d*e);if(k<1)anim=requestAnimationFrame(step);else{anim=0;cb&&cb()}};anim=requestAnimationFrame(step)};
 const next=()=>{clearTimeout(timer);if(done)return;if(typing()||document.hidden||performance.now()-userT<2500){timer=setTimeout(next,1200);return}
  const v=PT,r=REST.find(x=>x>v+.02);if(r==null){done=true;return}
  glide(yFor(r),()=>{if(r>=REST[REST.length-1]-.01){done=true;return}timer=setTimeout(next,HOLD[REST.indexOf(r)])})};

 const idx=()=>{const v=PT;let b=0;REST.forEach((r,n)=>{if(v>=r-.05)b=n});return b};
 const inSnap=dir=>{const yl=yFor(LAST);return scrollY<yl-3||(dir<0&&scrollY<=yl+3)};
 const skip=t=>t&&t.closest&&t.closest('input,textarea,select,.sarathi,#sarathi,[class*="sarathi"],.lq-list');
 const go=dir=>{const now=performance.now();if(anim||now<lock)return;userT=now;clearTimeout(timer);
  let n=idx();const atRest=Math.abs(PT-REST[n])<.05;n=dir>0?Math.min(REST.length-1,n+1):(atRest?Math.max(0,n-1):n);
  lock=now+400;glide(yFor(REST[n]),()=>{lock=performance.now()+250;done=REST[n]>=LAST-.01;if(!done)timer=setTimeout(next,HOLD[n])})};
 addEventListener('wheel',e=>{if(skip(e.target)||Math.abs(e.deltaY)<4)return;const dir=Math.sign(e.deltaY);if(!inSnap(dir))return;e.preventDefault();go(dir)},{passive:false});
 let ty=null;addEventListener('touchstart',e=>{ty=skip(e.target)?null:e.touches[0].clientY;userT=performance.now()},{passive:true});
 addEventListener('touchmove',e=>{if(ty==null)return;const dir=Math.sign(ty-e.touches[0].clientY)||1;if(inSnap(dir))e.preventDefault()},{passive:false});
 addEventListener('touchend',e=>{if(ty==null)return;const d=ty-e.changedTouches[0].clientY;ty=null;if(Math.abs(d)<30)return;const dir=Math.sign(d);if(inSnap(dir))go(dir)},{passive:true});
 addEventListener('keydown',e=>{if(skip(e.target))return;const m={ArrowDown:1,PageDown:1,' ':1,ArrowUp:-1,PageUp:-1}[e.key];if(!m||!inSnap(m))return;e.preventDefault();go(m)});
 let idl=0;addEventListener('scroll',()=>{if(anim)return;clearTimeout(idl);idl=setTimeout(()=>{if(anim||typing()||!inSnap(1))return;const n=idx();if(Math.abs(PT-REST[n])<.05)return;go(1)},500)},{passive:true});
 timer=setTimeout(next,HOLD[0]);
 /* swipe hint */
 const hint=document.createElement('div');hint.className='swipehint';const touch=matchMedia('(pointer: coarse)').matches;
 hint.innerHTML='<i></i><i></i><span>'+(touch?'Swipe down':'Scroll down')+' · journey plays on its own</span>';document.body.appendChild(hint);
 const st=document.createElement('style');st.textContent=`.swipehint{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:20;display:flex;flex-direction:column;align-items:center;gap:0;pointer-events:none;transition:opacity .6s}
.swipehint i{width:14px;height:14px;border-right:2px solid #c9a24d;border-bottom:2px solid #c9a24d;transform:rotate(45deg);margin-top:-5px;opacity:0;animation:swh 1.8s infinite}
.swipehint i+i{animation-delay:.25s}.swipehint span{margin-top:8px;font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#a6853a;white-space:nowrap}
@keyframes swh{0%{opacity:0;transform:translateY(-6px) rotate(45deg)}50%{opacity:1}100%{opacity:0;transform:translateY(8px) rotate(45deg)}}
@media (max-width:819px){.swipehint span{font-size:.56rem}}`;document.head.appendChild(st);
 (function hv(){hint.style.opacity=PT>5.3?0:1;requestAnimationFrame(hv)})();})();
let mx=0,my=0,tmx=0,tmy=0;addEventListener('pointermove',e=>{tmx=e.clientX/innerWidth-.5;tmy=e.clientY/innerHeight-.5});
addEventListener('deviceorientation',e=>{if(e.gamma!=null){tmx=clamp(e.gamma/40,-.5,.5);tmy=clamp((e.beta-45)/60,-.5,.5)}});

/* tap parcel -> price */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const showPrice=()=>{$('#price').classList.add('on');if(window.gsap)gsap.fromTo(parcel.scale,{x:1.25,y:1.25,z:1.25},{x:1,y:1,z:1,duration:.8,ease:'elastic.out(1,.4)'})};
$('#tapPrice').addEventListener('click',showPrice);
stage.addEventListener('click',e=>{ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ndc,cam);if(parcel.visible&&ray.intersectObject(parcel,true).length)showPrice()});

/* ---------- intro ---------- */
let t0=performance.now();const INTRO=reduce?0:8;window.__restartIntro=()=>{if(performance.now()-t0<2500)t0=performance.now()};

/* ---------- camera keyframes along P (0..5) ---------- */
// [P, camPos, lookAt]
const K=[
 [0,[0,.5,small?12:13],[0,-.2,0]],
 [1,[0,.5,small?13:14],[0,-.2,0]],
 [1.7,[0,.5,small?13:14],[0,-.2,0]],
 [2.1,[-3,2,small?9:8],[0,.65,0]],
 [2.6,[-3,1.6,small?8.5:7.5],[0,.65,0]],
 [2.95,[2.2,2.8,-6.5],[0,1,-.7]],
 [3.25,[0,1.8,small?11:12],[0,1.4,-1]],
 [3.85,[0,2.1,small?11:12],[0,1.5,-1]],
 [4.15,[6,5,small?19:19],[0,1.65,0]],
 [4.8,[6,5,small?19:19],[0,1.65,0]],
 [5,[0,5,19],[0,1.5,0]],
 [5.35,[0,.5,small?13:12],[0,-.1,0]],
 [6,[0,.5,small?13:12],[0,-.1,0]]];
const cP=new THREE.Vector3(),cL=new THREE.Vector3(),tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3();
function camAt(p){let i=0;while(i<K.length-2&&p>K[i+1][0])i++;const a=K[i],b=K[i+1],t=ease(clamp((p-a[0])/(b[0]-a[0])));
  tmpA.fromArray(a[1]).lerp(tmpB.fromArray(b[1]),t);cP.copy(tmpA);tmpA.fromArray(a[2]).lerp(tmpB.fromArray(b[2]),t);cL.copy(tmpA)}
const look=new THREE.Object3D();const smoothCam=new THREE.Vector3(0,.5,13),smoothLook=new THREE.Vector3(0,-.2,0);let camInit=false;
const vis=(o,f)=>{o.visible=f>0.001;return f};

const cine=cinema({T3:THREE,scene,cam,r,road,car,house,port,ship,crane,parcel,kraft,tape,sea,loader,small,reduce,mGold});
window.__P=0;const clock=new THREE.Clock();let et=0;
function frame(){
 const dt=window.__forceDt!=null?window.__forceDt:Math.min(clock.getDelta(),.05);if(window.__forceDt!=null)clock.getDelta();if(!reduce)et+=dt;
 P+=(PT-P)*(reduce?1:(1-Math.exp(-3.2*dt)));if(window.__forceP!=null)P=window.__forceP;window.__P=P;
 mx+=(tmx-mx)*.05;my+=(tmy-my)*.05;

 const it=window.__forceIntro!=null?window.__forceIntro:reduce?99:(performance.now()-t0)/1000;           // intro seconds
 const ip=clamp(it/INTRO);
 camAt(P);
 // The camera is independent of cursor, gyro and all ambient oscillators.
 const damp=reduce?1:1-Math.exp(-4*dt);
 if(!camInit){smoothCam.copy(cP);smoothLook.copy(cL);camInit=true}
 smoothCam.lerp(cP,damp);smoothLook.lerp(cL,damp);cam.position.copy(smoothCam);cam.lookAt(smoothLook);
 const full=ease(win(P,5,5.35));
 if(!small){stage.style.left=(38*(1-full))+'vw';stage.style.width=(62+38*full)+'vw'}
 const sw=stage.clientWidth,sh=stage.clientHeight;
 if(r.domElement.style.width!==sw+'px'||r.domElement.style.height!==sh+'px'){r.setSize(sw,sh);cam.aspect=sw/sh;cam.updateProjectionMatrix()}
 skyAt(P);stars.rotation.y=et*.005;
 dust.rotation.y=et*.01;dust.position.y=Math.sin(et*.2)*.2;

 /* OPENING: real airliner takes off through clouds, banks past the camera, climbs away */
 const cl=1-win(it,3.6,5.2);vis(clouds,cl*(1-win(P,0,.2)));
 clouds.children.forEach(c=>{const d=c.userData;let z=d.z+(et*(reduce?0:4));z=((z%40)+40)%40-40+6;c.position.set(d.x,d.y-1.5,z-6);c.scale.setScalar(cl)});
 if(airReady){
  const f=clamp(it/5.2);air.visible=f<1;
  if(air.visible){
   // path: low-left far -> close pass (livery to camera) -> up-right away
   const pA=new THREE.Vector3(small?-4:-4,-1.8,-6),pB=new THREE.Vector3(small?0:0,small?0:0,small?0:0),pC=new THREE.Vector3(small?5:5,3.5,-9);
   const k=ease(clamp(f/.55)),k2=ease(clamp((f-.55)/.45));
   air.position.copy(pA).lerp(pB,k).lerp(pC,k2);
   const sc=(small?.075:.085)*(1-k2*.5);air.scale.setScalar(sc);
   air.rotation.set(0,0,0);air.rotateY(Math.PI/2-.35+k2*.5);   // heading right, slightly toward camera
   air.rotateX(-(.18+k2*.15));                                   // climb (nose up)
   air.rotateZ(-.25*Math.sin(k*Math.PI)-k2*.35);                 // bank
   air.traverse(o=>{if(o.userData.gear)o.visible=f<.3});
   ['fan_L','fan_R'].forEach(n=>{const fo=air.getObjectByName(n);if(fo)fo.rotation.z+=dt*30});
  }
 }
 // hands rise, globe settles into the palms
 const hRise=ease(win(it,3.4,6.2)),gDrop=ease(win(it,4.0,6.8));
 // contrail from both engines
 if(air.visible&&nacL){hist.unshift([nacL.getWorldPosition(new THREE.Vector3()),nacR.getWorldPosition(new THREE.Vector3())])}
 else{const m=mini.getWorldPosition(new THREE.Vector3());hist.unshift([m,m.clone()])}
 if(hist.length>TRAIL)hist.pop();
 for(let i=0;i<TRAIL;i++){const h=hist[i]||hist[hist.length-1];if(!h)break;const fz=1-i/TRAIL;
  h[0].toArray(tp,i*6);h[1].toArray(tp,i*6+3);for(let k=0;k<6;k++)tc[i*6+k]=fz*[1,.9,.6][k%3]}
 tg.attributes.position.needsUpdate=tg.attributes.color.needsUpdate=true;

 /* GLOBE in golden hands (hero + flights) */
 const gOut=win(P,1.85,2.15);const gs=vis(globe,gDrop>0?(1-gOut):0);
 globe.scale.setScalar(lerp(.6,1,gDrop)*(1+ease(gOut)*5));
 globe.position.set(0,lerp(7,0,gDrop)+Math.sin(et*.8)*.04*gDrop-ease(gOut)*14,0);
 vis(handsG,hRise*(1-win(P,1.8,2.0)));handsG.position.set(0,lerp(-6,0,hRise)-ease(win(P,1.75,2.05))*6,0);
 handsG.children.forEach(pv=>{const sg=pv.userData.sg;pv.rotation.z=sg*(1-hRise)*.5;pv.position.x=sg*R*lerp(1.6,1.05,hRise)});
 handsG.rotation.y=0;
 dragVel*=.95;if(drag===null)dragRot+=dragVel;
 spin.rotation.y=-1.65+P*1.2+dragRot+(reduce?0:et*.03);spin.rotation.x=.3;ringG.rotation.z=et*.05;ringG.visible=gOut<.05;
 const draw=win(P,.15,1.5);arcs.forEach((a,i)=>a.t.geometry.setDrawRange(0,Math.floor(a.n*clamp(draw*1.6-i*.12))));
 // after the take-off the airliner returns, small, orbiting the globe like the brand mark — then flies the visitor's route
 let mt;const orbit=P<.9;
 if(orbit){const a=et*.35;look.position.set(Math.cos(a)*R*1.42,Math.sin(a*.7)*.4,Math.sin(a)*R*1.42);mini.parent!==globe&&globe.add(mini);
   const a2=a+.02;mini.position.copy(look.position);look.lookAt(Math.cos(a2)*R*1.42,Math.sin(a2*.7)*.4,Math.sin(a2)*R*1.42);mini.quaternion.copy(look.quaternion);mini.scale.setScalar(2.4)}
 else{mini.parent!==spin&&spin.add(mini);mini.scale.setScalar(1);mt=clamp((P-.9)/.9);const cv=arcs[0].c;mini.position.copy(cv.getPoint(mt));look.position.copy(mini.position);look.lookAt(cv.getPoint(clamp(mt+.01)));mini.quaternion.copy(look.quaternion)}
 mini.visible=gs>0&&it>5.5;

 /* SCENE 2: the route lands as a road; car drives; boot opens */
 const rIn=win(P,1.9,2.15),rOut=win(P,3.0,3.3);vis(road,rIn*(1-rOut));
 road.position.y=lerp(-6,0,ease(rIn))-ease(rOut)*0;road.scale.setScalar(1);
 const drive=reduce?0:et*6*(P>1.9&&P<2.85?1:clamp(1-(P-2.85)*6));
 dashes.children.forEach((d,i)=>{d.position.z=((-40+i*2+drive)%80+80)%80-40});
 palms.children.forEach((p,i)=>{p.position.z=((-40+i*5+drive*.999)%80+80)%80-40});
 car.position.set(0,0,lerp(-9,0,ease(win(P,2.0,2.5))));
 car.children.forEach(c=>{if(c.userData.wheel)c.rotation.x+=(P<2.85?dt*12:0)});
 car.position.y=0;
 head.intensity=rIn*6;
 boot.rotation.x=-ease(win(P,2.7,2.95))*1.6;
 // house slides in later on the same road
 const hIn=win(P,3.15,3.5),hOut=win(P,3.95,4.15);vis(house,hIn*(1-hOut));house.position.set(small?0:-.2,lerp(-4,0,ease(hIn))-ease(hOut)*4,-3.2);

 /* SCENE 3: parcel rises from the boot, seals, flies to the doorstep */
 const pIn=win(P,2.72,2.95);vis(parcel,P>2.72&&P<5.2?1:0);
 const bootW=car.localToWorld(new THREE.Vector3(0,.7,-1.1));
 const rise=ease(win(P,2.75,3.05)),seal=ease(win(P,3.05,3.3)),toDoor=ease(win(P,3.4,3.85));
 const airPt=new THREE.Vector3(0,1.6,-.4),door=new THREE.Vector3(small?0:-.2,.32,-.75);
 const pp=bootW.clone().lerp(airPt,rise).lerp(door,toDoor);pp.y+=Math.sin(toDoor*Math.PI)*1.2+(1-toDoor)*Math.sin(et*2)*.05*rise;
 parcel.position.copy(pp);parcel.rotation.y=(1-toDoor)*(et*.4*(reduce?0:1)+rise*.6);
 flaps.forEach(f=>{const a=lerp(f.userData.ax?2.2:2.0,0,seal);if(f.userData.ax)f.rotation.x=-a*f.userData.s;else f.rotation.z=a*f.userData.s});
 tape.scale.z=Math.max(.001,ease(win(P,3.22,3.35)));

 /* SCENE 4: parcel becomes a container; crane lowers it onto the ship */
 const portIn=win(P,3.9,4.15);vis(port,portIn);port.position.y=lerp(-3,0,ease(portIn));
 const morph=ease(win(P,3.95,4.25));
 if(P>3.9){
  pBox.material=morph>.5?mMaroon:kraft;ribs.visible=morph>.5;label.visible=tape.visible=morph<.5;flaps.forEach(f=>f.visible=morph<.5);
  const sc=lerp(1,1,morph);parcel.scale.set(lerp(1,.98,morph),lerp(1,.7,morph),lerp(1,.83,morph)).multiplyScalar(sc);
  const lower=ease(win(P,4.25,4.8));
  const hookStart=new THREE.Vector3(.4,3.3,1.6),slot=new THREE.Vector3(.4,(window.__shipTop||1.2)+.05,0);
  slot.add(ship.position);
  const cur=door.clone().lerp(hookStart,morph);cur.lerp(new THREE.Vector3(slot.x,3.3,slot.z),ease(win(P,4.25,4.5)));cur.y=lerp(cur.y,slot.y,ease(win(P,4.5,4.85)));
  parcel.position.copy(cur);parcel.rotation.y=0;parcel.scale.multiplyScalar(lerp(1,1,lower));
  trolley.position.set(cur.x,3.98,cur.z);cable.geometry.setFromPoints([trolley.position.clone(),cur.clone().add(new THREE.Vector3(0,.25,0))]);
  crane.rotation.y=0;crane.position.set(.4,0,-3.15);
  trolley.position.x=cur.x;
  if(cur.z>3.45)cur.z=3.45;
 }else{pBox.material=kraft;ribs.visible=false;label.visible=tape.visible=true;flaps.forEach(f=>f.visible=true);parcel.scale.setScalar(1);}
 // the container in hand scaled: target ~ container size .78x.42x.66
 if(morph>0)parcel.scale.set(lerp(1,.97,morph),lerp(1,.7,morph),lerp(1,.82,morph));
 ship.position.y=Math.sin(et*.35)*.015;ship.rotation.z=Math.sin(et*.3)*.003;
 if(port.visible&&!reduce){const a=seaG.attributes.position.array;for(let i=0;i<a.length;i+=3){a[i+2]=Math.sin(seaBase[i]*.5+et)*.06+Math.cos(seaBase[i+1]*.4+et*.8)*.06}seaG.attributes.position.needsUpdate=true}

 /* FINALE */
 const fIn=ease(win(P,5.0,5.3)),fThr=win(P,5.15,5.55),fRes=ease(win(P,5.55,5.8));
 vis(fin,fIn);if(P>4.95){vis(port,1-win(P,4.95,5.1));}
 threads.forEach((t,i)=>{const k=clamp(fThr*1.25-i*.04);t.m.geometry.setDrawRange(0,Math.floor(t.n*k));t.head.position.copy(t.c.getPoint(k));t.head.visible=k>0&&k<1;t.m.material.opacity=.95*(1-fRes)});
 finGlow.position.copy(finTarget);finGlow.material.opacity=ease(win(P,5.45,5.6))*.9*(1-fRes*.5);
 if(P>5.0){vis(globe,fIn*(1-fRes));globe.scale.setScalar(lerp(.6,1,fIn));globe.position.set(0,.15+Math.sin(et*.8)*.04,0);ringG.visible=true;
   vis(handsG,fIn*(1-fRes));handsG.position.set(0,lerp(-5,0,fIn),0);handsG.children.forEach(pv=>{pv.rotation.z=0;pv.position.x=pv.userData.sg*R*1.05});
   mini.visible=false;}
 stage.style.opacity=String(1-fRes*.92);
 document.body.dataset.fin=P<5.5?0:P<5.62?1:P<5.75?2:P<5.88?3:4;
 sun.position.set(6,10,8);sun.target.position.set(0,0,0);
 window.__camera={pos:cam.position.toArray(),look:smoothLook.toArray(),p:P};cine.update(P,reduce?0:et,reduce?0:dt);cine.render();requestAnimationFrame(frame)}
frame();
addEventListener('resize',()=>{cam.aspect=stage.clientWidth/stage.clientHeight;cam.updateProjectionMatrix();r.setSize(stage.clientWidth,stage.clientHeight)});
