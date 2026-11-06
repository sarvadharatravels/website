/* Synthesised, copyright-free sound design (Web Audio API). Starts on first gesture; mute remembered. */
(()=>{const KEY='sv-sound',btn=document.getElementById('snd');
let on=localStorage.getItem(KEY)!=='off',ctx=null,nodes=null,last=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ui=()=>{btn.classList.toggle('off',!on);btn.setAttribute('aria-pressed',on);btn.querySelector('span').textContent=on?'Sound on':'Sound off'};ui();
function noiseBuf(c){const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function init(){ctx=new (window.AudioContext||window.webkitAudioContext)();const c=ctx,master=c.createGain();master.gain.value=0;master.connect(c.destination);
 const comp=c.createDynamicsCompressor();comp.connect(master);
 const nb=noiseBuf(c);const loopNoise=()=>{const s=c.createBufferSource();s.buffer=nb;s.loop=true;s.start();return s};
 // music bed: warm pad (D major add9), slow filter breathing
 const pad=c.createGain();pad.gain.value=0;const pf=c.createBiquadFilter();pf.type='lowpass';pf.frequency.value=900;pf.connect(pad);pad.connect(comp);
 [146.83,220,293.66,369.99,329.63].forEach((f,i)=>{[-4,4].forEach(dt=>{const o=c.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.detune.value=dt;const g=c.createGain();g.gain.value=.12;o.connect(g);g.connect(pf);o.start()})});
 const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.07;lg.gain.value=400;lfo.connect(lg);lg.connect(pf.frequency);lfo.start();
 // jet: low rumble + whistle
 const jn=loopNoise(),jf=c.createBiquadFilter();jf.type='lowpass';jf.frequency.value=500;const jg=c.createGain();jg.gain.value=0;jn.connect(jf);jf.connect(jg);jg.connect(comp);
 const wh=c.createOscillator();wh.type='sine';wh.frequency.value=2400;const whg=c.createGain();whg.gain.value=0;wh.connect(whg);whg.connect(comp);wh.start();
 // wind
 const wn=loopNoise(),wf=c.createBiquadFilter();wf.type='bandpass';wf.frequency.value=700;wf.Q.value=.8;const wg=c.createGain();wg.gain.value=0;wn.connect(wf);wf.connect(wg);wg.connect(comp);
 // car hum
 const co=c.createOscillator();co.type='sawtooth';co.frequency.value=48;const cf=c.createBiquadFilter();cf.type='lowpass';cf.frequency.value=260;const cg=c.createGain();cg.gain.value=0;co.connect(cf);cf.connect(cg);cg.connect(comp);co.start();
 const rn=loopNoise(),rf=c.createBiquadFilter();rf.type='lowpass';rf.frequency.value=180;rn.connect(rf);rf.connect(cg);
 // sea
 const sn=loopNoise(),sf=c.createBiquadFilter();sf.type='lowpass';sf.frequency.value=400;const sg=c.createGain();sg.gain.value=0;sn.connect(sf);sf.connect(sg);sg.connect(comp);
 nodes={master,jg,jf,whg,wg,wf,cg,co,sg,nb,comp,pad};
 // opening: the brand's own business-card sound (8 s), then crossfade into the scene sound design
 const op=new Audio('3d/opening-sound.mp3');op.preload='auto';const os=c.createMediaElementSource(op),og=c.createGain();og.gain.value=.9;os.connect(og);og.connect(master);nodes.op=op;nodes.og=og;}
function opening(){const c=ctx,t=c.currentTime,n=nodes;n.opStart=t;n.op.currentTime=0;n.op.play().catch(()=>{});window.__restartIntro&&window.__restartIntro();
 n.og.gain.setValueAtTime(.9,t);n.og.gain.setValueAtTime(.9,t+6.5);n.og.gain.linearRampToValueAtTime(0,t+8.5);
 n.pad.gain.setValueAtTime(0,t);n.pad.gain.setValueAtTime(0,t+6);n.pad.gain.linearRampToValueAtTime(.05,t+9)}
const env=(g,t,a,peak,d)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)};
const fx={
 whoosh(){const c=ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=nodes.nb;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(3000,t+1.4);const g=c.createGain();env(g,t,.6,.5,1);s.connect(f);f.connect(g);g.connect(nodes.comp);s.start(t);s.stop(t+2)},
 tape(){const c=ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=nodes.nb;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=2500;const g=c.createGain();g.gain.setValueAtTime(0,t);for(let i=0;i<14;i++)g.gain.setValueAtTime(.18+Math.random()*.12,t+i*.035),g.gain.setValueAtTime(.04,t+i*.035+.018);g.gain.linearRampToValueAtTime(0,t+.55);s.connect(f);f.connect(g);g.connect(nodes.comp);s.start(t);s.stop(t+.6)},
 thud(){const c=ctx,t=c.currentTime,o=c.createOscillator();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(45,t+.3);const g=c.createGain();env(g,t,.005,.6,.35);o.connect(g);g.connect(nodes.comp);o.start(t);o.stop(t+.5)},
 horn(){const c=ctx,t=c.currentTime,f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=600;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.25);g.gain.setValueAtTime(.22,t+1.6);g.gain.linearRampToValueAtTime(0,t+2.3);f.connect(g);g.connect(nodes.comp);
   [87.3,110,130.8].forEach(fr=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.connect(f);o.start(t);o.stop(t+2.4)})},
 clank(){const c=ctx,t=c.currentTime;[523,787,1180,1630].forEach((fr,i)=>{const o=c.createOscillator();o.type='square';o.frequency.value=fr;const g=c.createGain();env(g,t+i*.004,.002,.05,.5-i*.08);o.connect(g);g.connect(nodes.comp);o.start(t);o.stop(t+.7)});fx.thud()}};
fx.chime=()=>{const c=ctx,t=c.currentTime;[523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f;const g=c.createGain();env(g,t+i*.09,.01,.08,2.4);o.connect(g);g.connect(nodes.comp);o.start(t+i*.09);o.stop(t+3)})};
const cues=[[5.58,'chime'],[.55,'whoosh'],[1.0,'whoosh'],[3.24,'tape'],[3.82,'thud'],[4.12,'horn'],[4.82,'clank']];
const bell=(P,a,b,c,d)=>Math.max(0,Math.min(1,(P-a)/(b-a),1-(P-c)/(d-c)));
function tick(){requestAnimationFrame(tick);if(!ctx||ctx.state!=='running')return;const P=window.__P||0,t=ctx.currentTime,n=nodes,k=.15;
 n.master.gain.setTargetAtTime(on?.55:0,t,.3);
 const inOp=n.opStart!=null&&t-n.opStart<7.5;const jet=inOp?0:bell(P,-1,0,.3,.6)*0;n.jg.gain.setTargetAtTime(jet*.22,t,k);n.jf.frequency.setTargetAtTime(400+P*900,t,k);n.whg.gain.setTargetAtTime(jet*.006,t,k);
 n.wg.gain.setTargetAtTime(bell(P,.9,1.2,1.85,2.1)*.12,t,k);n.wf.frequency.setTargetAtTime(500+Math.sin(t*.3)*200,t,.5);
 const car=bell(P,1.95,2.2,2.8,3.0);n.cg.gain.setTargetAtTime(car*.12,t,k);n.co.frequency.setTargetAtTime(44+car*14,t,k);
 n.sg.gain.setTargetAtTime(bell(P,3.95,4.2,5,5.4)*.14,t,k);
 if(on)cues.forEach(([at,name])=>{if((last<at&&P>=at)||(last>at&&P<=at&&name==='whoosh'))fx[name]()});last=P}
tick();
let opened=false;const start=()=>{const fresh=!ctx;if(!ctx)init();if(ctx.state==='suspended')ctx.resume();last=window.__P||0;if(!opened){opened=true;ctx.resume().then(opening)}else if(!fresh)nodes.pad.gain.setTargetAtTime(.05,ctx.currentTime,.5)};
const evs=['pointerdown','keydown','touchstart','wheel'];
const first=()=>{if(!on)return;start();setTimeout(()=>{if(ctx&&ctx.state==='running')evs.forEach(e=>removeEventListener(e,first,true))},50)};
if(!reduce)evs.forEach(e=>addEventListener(e,first,{capture:true,passive:true}));
btn.addEventListener('click',e=>{e.stopPropagation();on=!on;localStorage.setItem(KEY,on?'on':'off');ui();if(on)start()});
window.__svAudio={start,fx,rec(){const d=ctx.createMediaStreamDestination();nodes.master.connect(d);const r=new MediaRecorder(d.stream,{mimeType:'audio/webm'});const ch=[];r.ondataavailable=e=>ch.push(e.data);r.start();return{stop:()=>new Promise(res=>{r.onstop=async()=>{const b=new Blob(ch);const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)};r.stop()})}}};})();
