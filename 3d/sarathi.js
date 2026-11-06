/* Sarathi AI: gold orb launcher, glass panel, personalised greeting, quick-reply chips, streamed local FAQ answers. */
(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA='https://wa.me/919940299543',TEL='tel:+919940299543';
const FAQ=[
 {k:/flight|ticket|fare|fly|air/i,chip:'✈ Flights',a:`We book domestic and international flights with smart connections and fair fares. Share your route and dates on <a href="${WA}">WhatsApp</a> and our desk will send the best options.`},
 {k:/car|cab|taxi|rent|driver|pickup|airport/i,chip:'🚘 Car rental',a:`Sarvadhara Car Rentals covers airport transfers, outstation trips and temple tours with sedans, SUVs and tempo travellers. Tell us your pickup point and time on <a href="${WA}">WhatsApp</a>.`},
 {k:/courier|parcel|cargo|ship(ping)?|send|track/i,chip:'📦 Courier',a:`SarvadharaSai Courier compares top carriers for you. Get a live price on the <a href="https://sarvadharatravels.in/courier.html">courier page</a>, with pickup from your door and tracking all the way.`},
 {k:/export|import|trade|sourc|freight/i,chip:'🌍 Export-Import',a:`SarvadharaSai Enterprises handles sourcing, documentation and freight for spices, textiles and handicrafts. Visit <a href="https://sarvadharatravels.in/export-import.html">Export-Import</a> or talk to our trade desk.`},
 {k:/holiday|tour|package|visa|hotel/i,chip:'🏝 Holidays',a:`We plan holidays and tours around you: flights, hotels and local travel in one plan. Tell us where you dream of going.`},
 {k:/call|phone|contact|number|talk|human/i,chip:'📞 Call us',a:`Call our desk on <a href="${TEL}">+91 99402 99543</a> or chat on <a href="${WA}">WhatsApp</a>. We're happy to help.`},
 {k:/name|sarvadhara|mean/i,chip:null,a:`Sarvadhara means “the one who holds all”: <i>Sarva</i>, all, and <i>Dhara</i>, held. We hold every journey of yours with care.`}];
const el=(h)=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild};
const orb=el('<button class="sx-orb" aria-label="Ask Sarathi" aria-expanded="false"><span class="core"></span><b>S</b></button>');
const tip=el('<span class="sx-tip">Ask Sarathi</span>');
const panel=el(`<section class="sx-panel" role="dialog" aria-label="Sarathi AI assistant"><div class="sx-head"><span class="mini"></span><div><h3>Sarathi</h3><small>Your Sarvadhara guide</small></div><span class="sx-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><button class="sx-x" aria-label="Close">×</button></div><div class="sx-log" aria-live="polite"></div><div class="sx-chips"></div><form class="sx-form"><input placeholder="Ask about flights, cars, courier…" aria-label="Your question"><button>Send</button></form></section>`);
document.body.append(orb,tip,panel);
const log=panel.querySelector('.sx-log'),chips=panel.querySelector('.sx-chips'),inp=panel.querySelector('input');
FAQ.filter(f=>f.chip).forEach(f=>{const b=document.createElement('button');b.type='button';b.textContent=f.chip;b.onclick=()=>ask(f.chip.replace(/^\S+\s/,''));chips.append(b)});
const visitor=()=>{try{return (JSON.parse(localStorage.getItem('sv-visitor')||'{}').name||'').trim()}catch(e){return ''}};
function say(html,who){const m=document.createElement('div');m.className='sx-m '+who;log.append(m);
 if(who==='me'||reduced){m.innerHTML=html;log.scrollTop=1e6;return Promise.resolve()}
 panel.classList.add('think');const words=html.split(/(\s+)/);let i=0;
 return new Promise(res=>setTimeout(function step(){i+=2;m.innerHTML=words.slice(0,i).join('');log.scrollTop=1e6;if(i<words.length)setTimeout(step,38);else{panel.classList.remove('think');res()}},420))}
function ask(q){if(!q.trim())return;say(q.replace(/</g,'&lt;'),'me');const f=FAQ.find(f=>f.k.test(q));
 say(f?f.a:`I'll pass that to our desk. For a quick answer, <a href="${WA}">message us on WhatsApp</a> or call <a href="${TEL}">+91 99402 99543</a>.`,'bot')}
let greeted=false;
function open(v){panel.classList.toggle('open',v);orb.setAttribute('aria-expanded',v);orb.style.visibility=v&&innerWidth<=820?'hidden':'';
 if(v&&!greeted){greeted=true;const n=visitor();say(`${n?`Vanakkam ${n.replace(/</g,'')}!`:'Vanakkam!'} I'm Sarathi, your guide at Sarvadhara Travels. Where shall we take you today?`,'bot')}
 if(v&&innerWidth>820)setTimeout(()=>inp.focus({preventScroll:true}),400)}
orb.onclick=()=>open(!panel.classList.contains('open'));panel.querySelector('.sx-x').onclick=()=>open(false);
panel.querySelector('form').onsubmit=e=>{e.preventDefault();ask(inp.value);inp.value=''};
addEventListener('keydown',e=>{if(e.key==='Escape')open(false)});
addEventListener('pointermove',e=>{const r=orb.getBoundingClientRect(),d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));orb.classList.toggle('near',d<160)},{passive:true});
setTimeout(()=>{tip.classList.add('show');setTimeout(()=>tip.classList.remove('show'),4000)},9000);
window.__sarathi={open,ask};})();
