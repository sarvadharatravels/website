import * as T from 'three';
import {Water} from 'three/addons/objects/Water.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
export function cinema({T3,scene,cam,r,road,car,house,port,ship,crane,parcel,kraft,tape,sea,loader,small,reduce,mGold}){
const rec=new URLSearchParams(location.search).has('record');
const rand=(s)=>{let x=Math.sin(s*127.1)*43758.5453;return x-Math.floor(x)};
const canvasTex=(n,fn)=>{const c=document.createElement('canvas');c.width=c.height=n;fn(c.getContext('2d'),n);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t};
// Original procedural surface maps, no unlicensed texture files.
const roadMap=canvasTex(512,(x,n)=>{const im=x.createImageData(n,n);for(let i=0;i<n*n;i++){const v=32+rand(i)*38;im.data.set([v,v*.97,v*.94,255],i*4)}x.putImageData(im,0,0)});roadMap.repeat.set(3,40);roadMap.colorSpace=T.SRGBColorSpace;
const roadNorm=canvasTex(256,(x,n)=>{const im=x.createImageData(n,n);for(let i=0;i<n*n;i++){const v=rand(i);im.data.set([123+v*10,123+rand(i+99)*10,250,255],i*4)}x.putImageData(im,0,0)});roadNorm.repeat.set(5,65);
road.children.forEach(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.material.type!=='ShadowMaterial'&&o.geometry.parameters.width===3.4){o.material=new T.MeshPhysicalMaterial({map:roadMap,normalMap:roadNorm,normalScale:new T.Vector2(.12,.12),roughness:.2,metalness:.2,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.6});}});
// runway becomes a coastal expressway; buildings on inland side, sea on the other.
const env=new T.Group();road.add(env);
const sand=new T.Mesh(new T.PlaneGeometry(120,120),new T.MeshStandardMaterial({color:0xd1bd97,roughness:.95}));sand.rotation.x=-Math.PI/2;sand.position.y=-.045;env.add(sand);
const coast=new T.Mesh(new T.PlaneGeometry(40,100),new T.MeshPhysicalMaterial({color:0xa6d6d2,roughness:.18,metalness:.3,clearcoat:1,transparent:true,opacity:.85}));coast.rotation.x=-Math.PI/2;coast.position.set(-25,-.035,0);env.add(coast);
const skyline=new T.Group();env.add(skyline);
const winTex=canvasTex(128,(x,n)=>{x.fillStyle='#5d6b70';x.fillRect(0,0,n,n);for(let y=3;y<n;y+=13)for(let xx=3;xx<n;xx+=10){x.fillStyle=rand(y*32+xx)>.7?'#ffe5a5':'#192c35';x.fillRect(xx,y,5,8)}});winTex.colorSpace=T.SRGBColorSpace;
for(let i=0;i<28;i++){const h=1.2+rand(i)*5.5,w=.8+rand(i+90)*1.5;const tex=winTex.clone();tex.repeat.set(w*.6,h*.6);tex.needsUpdate=true;const b=new T.Mesh(new T.BoxGeometry(w,h,w),new T.MeshStandardMaterial({map:tex,color:0xcad1ce,roughness:.6,emissive:0xdab775,emissiveMap:tex,emissiveIntensity:.12}));b.position.set(8+rand(i+20)*15,h/2,-50+i*4);skyline.add(b)}
const lineMat=new T.LineBasicMaterial({color:0xe0c06a,transparent:true,opacity:.35});
const streaks=new T.Group();road.add(streaks);
for(let i=0;i<(small?20:60);i++){const z=rand(i+900)*70-35,x=(i%2?-1:1)*(1.8+rand(i+700)*2);const g=new T.BufferGeometry().setFromPoints([new T.Vector3(x,.1,z),new T.Vector3(x,.1,z+1+rand(i)*3)]);const l=new T.Line(g,lineMat);l.userData.z=z;streaks.add(l)}
// gold reflective barrier / street lamps
const poleMat=new T.MeshStandardMaterial({color:0x7b7a72,metalness:.85,roughness:.28});const lamps=[];
for(let i=0;i<12;i++){const g=new T.Group(),p=new T.Mesh(new T.CylinderGeometry(.028,.04,2.5,8),poleMat);p.position.y=1.25;g.add(p);const arm=new T.Mesh(new T.BoxGeometry(.5,.035,.035),poleMat);arm.position.set(-.24,2.5,0);g.add(arm);const light=new T.Mesh(new T.BoxGeometry(.22,.02,.08),new T.MeshStandardMaterial({color:0xffe1a1,emissive:0xffca6a,emissiveIntensity:4}));light.position.set(-.45,2.48,0);g.add(light);g.position.set(2.15,0,-36+i*6);env.add(g);lamps.push(g)}
// headlight beams and road reflections: additive soft cones, not opaque geometry
const beamMat=new T.MeshBasicMaterial({color:0xffedbc,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
for(const x of [-.43,.43]){const b=new T.Mesh(new T.ConeGeometry(.8,5.5,24,1,true),beamMat);b.rotation.x=-Math.PI/2;b.position.set(x,.22,4.0);car.add(b)}
const foamTex=canvasTex(128,(x,n)=>{const g=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.5,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,n,n)});
// Detailed cardboard fibres, with a separate micro-bump texture; tape has its own ridged bump.
const card=canvasTex(512,(x,n)=>{x.fillStyle='#bc925b';x.fillRect(0,0,n,n);for(let i=0;i<70000;i++){const p=rand(i),v=rand(i+2000);x.strokeStyle=`rgba(${p>.5?'242,220,178':'66,40,18'},${.05+v*.1})`;const xx=rand(i+10)*n,yy=rand(i+80)*n;x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+1+v*5,yy+v*.7);x.stroke()}for(let i=0;i<12;i++){x.fillStyle='rgba(65,37,15,.04)';x.fillRect(i*47,0,1,n)}});card.colorSpace=T.SRGBColorSpace;
kraft.map=card;kraft.color.set(0xffffff);kraft.bumpMap=card;kraft.bumpScale=.008;kraft.roughness=.85;kraft.needsUpdate=true;
const tapeBump=canvasTex(128,(x,n)=>{x.fillStyle='#888';x.fillRect(0,0,n,n);for(let i=0;i<n;i+=3){x.strokeStyle='#bbb';x.beginPath();x.moveTo(i,0);x.lineTo(i,n);x.stroke()}});tape.material.bumpMap=tapeBump;tape.material.bumpScale=.003;tape.material.roughness=.23;tape.material.needsUpdate=true;
// Warm modern neutral apartment: compact gated entrance, porch light and a ringing doorbell.
const court=new T.Group();court.userData.court=1;house.add(court);
// A modern portico bridges the model's shopfront and our branded doorstep.
const stoneM=new T.MeshStandardMaterial({color:0xddd4c1,roughness:.7});
const canopy=new T.Mesh(new T.BoxGeometry(1.6,.09,1.6),stoneM);canopy.position.set(0,1.72,1.2);court.add(canopy);
for(const sd of [-1,1]){const col=new T.Mesh(new T.BoxGeometry(.12,1.65,.12),stoneM);col.position.set(sd*.7,.82,1.82);court.add(col)}
const paving=new T.Mesh(new T.BoxGeometry(4.2,.08,2.7),new T.MeshStandardMaterial({color:0x9b9181,roughness:.75}));paving.position.set(0,-.05,1);court.add(paving);
const warm=new T.PointLight(0xffd299,12,7,2);warm.position.set(0,1.45,1.8);court.add(warm);
const doorframe=new T.Mesh(new T.BoxGeometry(.95,1.6,.08),new T.MeshStandardMaterial({color:0x251a16,roughness:.35}));doorframe.position.set(0,.8,1.82);court.add(doorframe);
const door=new T.Mesh(new T.BoxGeometry(.75,1.45,.09),new T.MeshStandardMaterial({color:0x7A1F2B,metalness:.2,roughness:.3}));door.position.set(0,.74,1.88);court.add(door);
const handle=new T.Mesh(new T.CylinderGeometry(.013,.013,.3,8),mGold);handle.position.set(.25,.8,1.94);court.add(handle);
const doorbell=new T.Mesh(new T.TorusGeometry(.04,.012,8,24),new T.MeshStandardMaterial({color:0xe0c06a,emissive:0xe0c06a,emissiveIntensity:2}));doorbell.position.set(.64,1.05,1.94);court.add(doorbell);
const bellHalo=new T.Sprite(new T.SpriteMaterial({map:foamTex,color:0xe0c06a,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));bellHalo.position.set(.64,1.05,2);bellHalo.scale.setScalar(.35);court.add(bellHalo);
// Real ocean normals derived from a periodic sinusoidal field (local original texture).
const waveNormal=canvasTex(256,(x,n)=>{const im=x.createImageData(n,n);for(let yy=0;yy<n;yy++)for(let xx=0;xx<n;xx++){const u=xx/n*Math.PI*2,v=yy/n*Math.PI*2;im.data.set([128+35*Math.sin(u*7+Math.cos(v*3))+13*Math.sin(v*11),128+35*Math.cos(v*5+Math.sin(u*2)),235,255],(yy*n+xx)*4)}x.putImageData(im,0,0)});
let water=null;
if(!small){water=new Water(new T.PlaneGeometry(100,100,80,80),{textureWidth:256,textureHeight:256,waterNormals:waveNormal,sunDirection:new T.Vector3(.6,.35,-.4).normalize(),sunColor:0xffe6b1,waterColor:0x174548,distortionScale:4.5,fog:true});water.rotation.x=-Math.PI/2;water.position.y=-.045;const reflect=water.onBeforeRender.bind(water);let reflCount=0;water.onBeforeRender=(...args)=>{if(reflCount++%(rec?10:1)===0)reflect(...args)};port.add(water);sea.visible=false;}
const wake=new T.Group();port.add(wake);const bubbles=[];for(let i=0;i<(small?24:75);i++){const s=new T.Sprite(new T.SpriteMaterial({map:foamTex,color:0xe7fffa,transparent:true,opacity:.3,depthWrite:false}));s.userData={a:rand(i),j:i};wake.add(s);bubbles.push(s)}
const harbour=new T.Group();port.add(harbour);const quay=new T.Mesh(new T.BoxGeometry(20,.3,1.8),new T.MeshStandardMaterial({color:0x6d7069,roughness:.8}));quay.position.set(0,-.08,-4.5);harbour.add(quay);
for(let i=0;i<12;i++){const m=new T.Mesh(new T.CylinderGeometry(.035,.05,2.4,8),poleMat);m.position.set(-10+i*1.8,1.2,-5.1);harbour.add(m);const glow=new T.Sprite(new T.SpriteMaterial({map:foamTex,color:0xffc676,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));glow.position.set(m.position.x,2.4,m.position.z);glow.scale.setScalar(.4);harbour.add(glow)}
const birds=new T.Group();port.add(birds);for(let i=0;i<7;i++){const a=new T.Vector3(-.12,0,0),b=new T.Vector3(0,.04,0),c=new T.Vector3(.12,0,0);const g=new T.BufferGeometry().setFromPoints([a,b,c]);const bird=new T.Line(g,new T.LineBasicMaterial({color:0xfaf7f2}));bird.userData.a=i*1.2;birds.add(bird)}
// Bloom + rack focus; desktop only. Mobile uses original tone-mapping & CSS vignette/grain.
let composer=null,bloom=null,dof=null;
if(false){composer=new EffectComposer(r);composer.addPass(new RenderPass(scene,cam));dof=new BokehPass(scene,cam,{focus:9,aperture:.000025,maxblur:.003,width:innerWidth,height:innerHeight});if(!rec)composer.addPass(dof);bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.22,.5,1.4);composer.addPass(bloom);composer.addPass(new OutputPass());}
// Route unspools into the road: continuous gold ribbon follows a spline before landing.
const ribbonC=new T.CatmullRomCurve3([new T.Vector3(-2,2,-2),new T.Vector3(3,3,-1),new T.Vector3(2,.4,2),new T.Vector3(0,.04,3),new T.Vector3(0,.04,-30)]);
const ribbon=new T.Mesh(new T.TubeGeometry(ribbonC,140,.025,6),new T.MeshBasicMaterial({color:0xe0c06a,transparent:true}));scene.add(ribbon);
const portal=new T.Mesh(new T.TorusGeometry(1.4,.035,8,96),new T.MeshStandardMaterial({color:0xc9a24d,metalness:1,roughness:.2,emissive:0x8f6e2a,emissiveIntensity:.4}));scene.add(portal);
// Spreader frame and four suspension lines keep the lift mechanically connected.
const spread=new T.Group();port.add(spread);const cableLines=[];
for(const x of [-.4,.4]){const rail=new T.Mesh(new T.BoxGeometry(.025,.035,.62),mGold);rail.position.x=x;spread.add(rail)}
for(const z of [-.3,.3]){const rail=new T.Mesh(new T.BoxGeometry(.83,.035,.025),mGold);rail.position.z=z;spread.add(rail)}
for(const x of [-.38,.38])for(const z of [-.28,.28]){const l=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0x4a4740}));l.userData={x,z};port.add(l);cableLines.push(l)}
// One particle field reshapes plane->globe->road->parcel->ship, bridge between scenes.
const Q=small?150:450,positions=new Float32Array(Q*3),morphGeo=new T.BufferGeometry();morphGeo.setAttribute('position',new T.BufferAttribute(positions,3));const morph=new T.Points(morphGeo,new T.PointsMaterial({color:0xe0c06a,size:small?.035:.028,transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending}));scene.add(morph);
function update(P,t,dt){const moving=P>1.9&&P<3.05;
 const lift=P>4.15&&P<4.9;spread.visible=lift;cableLines.forEach(l=>l.visible=lift);
 if(lift){spread.position.copy(parcel.position);spread.position.y+=.24;for(const l of cableLines){const d=l.userData;l.geometry.setFromPoints([new T.Vector3(parcel.position.x+d.x*.3,3.98,parcel.position.z+d.z*.3),new T.Vector3(parcel.position.x+d.x,parcel.position.y+.24,parcel.position.z+d.z)])}}

 streaks.visible=moving;streaks.children.forEach(l=>{l.position.z=moving?(t*9)%60-30:0});
 skyline.position.z=moving?(t*3)%4:0;lamps.forEach((l,i)=>l.position.z=((-36+i*6+(moving?t*6:0))%72+72)%72-36);
 car.traverse(o=>{if(/^wheel_(FL|FR|RL|RR)$/.test(o.name)&&!reduce&&moving)o.rotation.x-=dt*16});
 coast.material.color.setHSL(.49,.24,.67+Math.sin(t*.6)*.025);
 doorbell.material.emissiveIntensity=2+Math.sin(t*4)*1.5;bellHalo.material.opacity=.3+Math.sin(t*4)*.15;
 if(water){water.material.uniforms.time.value=t*.36;const pa=water.geometry.attributes.position;for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i);pa.setZ(i,Math.sin(x*.7+t*.8)*.045+Math.cos(y*.55+t*.7)*.035)}pa.needsUpdate=true;water.material.uniforms.sunDirection.value.set(.6,.4,-.5).normalize();}
 bubbles.forEach((s,i)=>{const a=(t*.12+i/bubbles.length)%1,sd=i%2?1:-1;s.position.set(-4-a*5,.03,.1+sd*a*.7);s.scale.set(lerp(.1,.75,a),lerp(.1,.3,a),1);s.material.opacity=(1-a)*.25});
 wake.position.copy(ship.position);wake.rotation.y=ship.rotation.y;birds.children.forEach((b,i)=>{const a=t*.15+b.userData.a;b.position.set(Math.cos(a)*7,4+Math.sin(a*2)*.5,-4+Math.sin(a)*2);b.rotation.z=Math.sin(t*4+i)*.15});
 if(composer){dof.uniforms.focus.value=cam.position.distanceTo(P>3&&P<4?parcel.position:P>4&&P<5?ship.position:new T.Vector3());dof.uniforms.aperture.value=P>2.8&&P<3.25?.00004:.000018;bloom.strength=P>4?.28:.17;}
 const a=Math.max(0,Math.min(1,(P-1.7)/.5));ribbon.visible=P>1.7&&P<2.3;ribbon.geometry.setDrawRange(0,Math.floor(ribbon.geometry.index.count*a));ribbon.material.opacity=Math.min(1,(2.3-P)*3);
 portal.visible=P>.7&&P<1.03;portal.position.set(0,.2,-1);portal.scale.setScalar(.4+(P-.7)*9);portal.material.transparent=true;portal.material.opacity=Math.min(1,(1.03-P)*8);
 const bridge=Math.max(0,1-Math.min(...[.9,1.95,3.0,3.95,5.25].map(k=>Math.abs(P-k)))/.24);morph.visible=bridge>0&&!reduce;
 for(let i=0;i<Q;i++){const a=i/Q*Math.PI*2,f=i/Q;let x,y,z;
 if(P<1.5){x=Math.sin(a*8)*2*f;y=Math.cos(a*8)*2*f;z=Math.sin(a)*2}
 else if(P<2.8){x=(f-.5)*3;y=.1+Math.sin(a*3)*.2;z=(rand(i)-.5)*15}
 else if(P<3.8){x=(rand(i)-.5)*.9;y=1+(rand(i+9)-.5)*.7;z=(rand(i+23)-.5)*.9}
 else{x=(f-.5)*7;y=.5+rand(i+5);z=(rand(i+18)-.5)*1.5}
 positions[i*3]=x+Math.sin(t+i)*.03;positions[i*3+1]=y;positions[i*3+2]=z}morphGeo.attributes.position.needsUpdate=true;morph.material.opacity=bridge*.8;
}
const lerp=(a,b,t)=>a+(b-a)*t;
addEventListener('resize',()=>{if(composer)composer.setSize(innerWidth,innerHeight)});
return {update,render:()=>composer?composer.render():r.render(scene,cam)};
}
