/* Boarding pass personalisation, live local times, gold-dust cursor trail */
(()=>{const $=s=>document.querySelector(s);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function flip(el,str){if(!el)return;const old=el.dataset.val||'';if(old===str)return;el.dataset.val=str;
 if(el.children.length!==str.length){el.textContent='';for(const c of str){const n=document.createElement('span');n.className='flipchar';n.textContent=c===' '?' ':c;el.append(n)}}
 [...el.children].forEach((n,i)=>{if(old[i]!==str[i]){n.textContent=str[i]===' '?' ':str[i];n.classList.remove('f');void n.offsetWidth;if(!reduced){n.style.animationDelay=(i*.025)+'s';n.classList.add('f')}}})}
 document.querySelectorAll('.airportcode').forEach(e=>flip(e,e.textContent));
 setInterval(()=>{if(!reduced)document.querySelectorAll('.airportcode,.flightno').forEach(e=>{const v=e.dataset.val||e.textContent;e.dataset.val='';flip(e,v)})},11000);
 document.querySelectorAll('.card .eyebrow,.card .chips span,.card .localtime,.card .hint,.card .lead').forEach((n,i)=>{n.classList.add('orbital-detail');n.style.setProperty('--orb',i%5)});
const CITIES={Dubai:['DXB','Asia/Dubai'],London:['LHR','Europe/London'],'New York':['JFK','America/New_York'],Chicago:['ORD','America/Chicago'],'Los Angeles':['LAX','America/Los_Angeles'],Toronto:['YYZ','America/Toronto'],
 Singapore:['SIN','Asia/Singapore'],Sydney:['SYD','Australia/Sydney'],Tokyo:['HND','Asia/Tokyo'],Paris:['CDG','Europe/Paris'],Berlin:['BER','Europe/Berlin'],Riyadh:['RUH','Asia/Riyadh'],Doha:['DOH','Asia/Qatar'],
 'Kuala Lumpur':['KUL','Asia/Kuala_Lumpur'],Colombo:['CMB','Asia/Colombo'],Delhi:['DEL','Asia/Kolkata']};
$('#cities').innerHTML=Object.keys(CITIES).map(c=>`<option value="${c}">`).join('');
const V=window.__visitor||JSON.parse(localStorage.getItem('sv-visitor')||'null')||{name:'',city:'Dubai'};
const apply=()=>{const c=CITIES[V.city]?V.city:'Dubai',[code,tz]=CITIES[c];flip($('#pCode'),code);$('#pToC').textContent=c.toUpperCase();
 document.querySelectorAll('.vcity').forEach(e=>e.textContent=c);$('#tCity').textContent=c;window.__vtz=tz;if(window.__visitor)window.__visitor.city=c;window.__relabel&&window.__relabel();
 localStorage.setItem('sv-visitor',JSON.stringify(V))};
$('#pName').value=V.name;$('#pCity').value=V.city;
$('#pName').addEventListener('input',e=>{V.name=e.target.value;localStorage.setItem('sv-visitor',JSON.stringify(V))});
$('#pCity').addEventListener('change',e=>{const m=Object.keys(CITIES).find(c=>c.toLowerCase()===e.target.value.trim().toLowerCase());if(m){V.city=m;e.target.value=m;apply()}});
const fmt=tz=>new Intl.DateTimeFormat('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:tz}).format(new Date());
const clock=()=>{$('#tChn').classList.add('flipclock');$('#tVis').classList.add('flipclock');flip($('#tChn'),fmt('Asia/Kolkata'));flip($('#tVis'),fmt(window.__vtz||'Asia/Dubai'))};
const pers=()=>{$('#finPersonal').textContent=V.name.trim()?`${V.name.trim()}, your next journey is in good hands.`:'Your next journey is in good hands.'};
$('#pName').addEventListener('input',pers);setTimeout(()=>{apply();clock();pers();flip($('#flightno'),'SV 001')},0);setInterval(clock,1000);
// gold dust trail (pointer & touch)
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const cv=$('#dustfx'),x=cv.getContext('2d');let W,H;const fit=()=>{W=cv.width=innerWidth*Math.min(devicePixelRatio,2);H=cv.height=innerHeight*Math.min(devicePixelRatio,2);x.setTransform(Math.min(devicePixelRatio,2),0,0,Math.min(devicePixelRatio,2),0,0)};fit();addEventListener('resize',fit);
const ps=[];let running=false;const add=(px,py)=>{for(let i=0;i<2;i++)ps.push({x:px,y:py,vx:(Math.random()-.5)*.6,vy:Math.random()*.6+.2,l:1,s:Math.random()*2+1});if(!running){running=true;requestAnimationFrame(loop)}};
if(!matchMedia('(pointer: coarse)').matches)addEventListener('pointermove',e=>add(e.clientX,e.clientY),{passive:true});
function loop(){x.clearRect(0,0,W,H);for(let i=ps.length-1;i>=0;i--){const p=ps[i];p.x+=p.vx;p.y+=p.vy;p.l-=.022;if(p.l<=0){ps.splice(i,1);continue}
 const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s*3);g.addColorStop(0,`rgba(255,236,180,${p.l})`);g.addColorStop(1,'rgba(201,162,77,0)');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.s*3,0,7);x.fill()}
 if(ps.length>80)ps.splice(0,ps.length-80);if(ps.length)requestAnimationFrame(loop);else running=false}})();

// The perforated stub peels away as the flight moves into the globe chapter.
(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const pass=document.querySelector('.pass'),stub=pass.querySelector('.s');
const cards=[...document.querySelectorAll('.card')];let lastP=-1;function tick(){const p=window.__P||0;if(p===lastP){requestAnimationFrame(tick);return}lastP=p;const k=Math.max(0,Math.min(1,(p-.45)/.5));pass.style.setProperty('--ticketPeel',(-k*25)+'deg');stub.style.opacity=1-k*.7;cards.forEach((c,i)=>{const d=Math.max(0,1-Math.abs(p-i));c.style.setProperty('--sceneLife',d)});requestAnimationFrame(tick)}tick()})();
