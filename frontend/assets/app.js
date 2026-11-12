'use strict';
const API=(window.BG_API||'').replace(/\/$/,'');
const el=(t,a={},...c)=>{const e=document.createElement(t);for(const[k,v]of Object.entries(a)){if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v)}c.flat().forEach(x=>e.append(x&&x.nodeType?x:document.createTextNode(x==null?'':x)));return e};
const get=async(p,ms=15000)=>{const r=await fetch(/^http/.test(p)?p:API+p,{signal:AbortSignal.timeout(ms)});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
const store={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const timers=[];const every=(f,ms)=>{f();timers.push(setInterval(f,ms))};
const H='Astronaut Health',E='Earth & Space',O='Offline Technology',P='Platform';
const SITES={bio:'https://bio-revive-ai-genius.vercel.app/',vita:'https://ashishmca-a3z.caffeine.xyz/'};
/* 30 modules: [title, group, summary, widgets] */
const M=[
['Health Command Center',H,'Live crew vitals, alerts and trends in one view.',['crew','alerts']],
['Vitals Logger',H,'Record heart rate, HRV, SpO₂, temperature, sleep and stress.',['vitals']],
['Face Mesh Analysis',H,'Camera-based facial analysis with 466 landmarks.',[['embed',{url:SITES.bio,cam:1,t:'Face Mesh and health check'}]]],
['Biological Age',H,'PhenoAge from nine routine blood markers.',['phenoage']],
['Brain MRI Review',H,'Open MRI images locally and run the brain analysis module.',[['upload',{kind:'image/*',t:'MRI viewer (stays on this device)'}],['embed',{url:SITES.bio,t:'Brain MRI analysis module'}]]],
['Mental Wellness',H,'Track stress and mood, and see what actually helps.',['stress','gazelog']],
['Earth-Gazing Therapy',H,'Stress level in, calming NASA Earth view out. Rate how it felt.',['gaze']],
['Medical Report Analysis',H,'Read a lab report with on-device OCR, then open AI analysis.',['ocr',[ 'embed',{url:SITES.vita,t:'Vita AI report and vitals analysis'}]]],
['Emergency and Flight Surgeon',H,'Detect critical vitals and escalate to the flight surgeon.',['alerts','emergency']],
['NASA Medical Checklist',H,'Step-by-step response checklists that save progress.',[['checklist',{k:'chk1',t:'Cardiac or breathing event',items:['Check responsiveness and airway','Attach pulse oximeter and record SpO₂','Administer oxygen if SpO₂ is below 92%','Record heart rate and rhythm','Contact flight surgeon','Prepare crew medical restraint system']}],['checklist',{k:'chk2',t:'Radiation event',items:['Move crew to the most shielded module','Log dosimeter readings','Confirm solar activity on the Space Radiation page','Report to mission control','Keep shelter until all-clear']}]]],
['Earth Now',E,'The latest full-disk views of Earth from NASA EPIC.',['epic']],
['Space Radiation',E,'Solar flares, CMEs and geomagnetic storms from NASA DONKI.',['donki']],
['Astronomy Picture of the Day',E,'NASA’s daily image with its explanation.',['apod']],
['Near-Earth Objects',E,'Asteroids passing Earth today, with size and distance.',['neo']],
['Earth Observation Imagery',E,'Daily NASA MODIS satellite imagery of any region.',['gaze']],
['Moon Explorer',E,'Explore lunar terrain, LRO imagery, polar regions and mission sites using NASA mapping tools.',['moon']],
['Mars Explorer',E,'Interactive NASA Mars mapping.',[['embed',{url:'https://trek.nasa.gov/mars/',t:'NASA Mars Trek'}]]],
['ISS Tracker',E,'Live position, altitude and speed of the station.',['iss']],
['South Atlantic Anomaly',E,'See when the station crosses the region of higher radiation.',['iss','donki']],
['Environmental Intelligence',E,'Earth imagery and space weather side by side.',['epic','donki']],
['Offline Edge AI',O,'On-device risk scoring that works without a connection.',['edge']],
['Hardware Connectivity',O,'Connect a Bluetooth heart-rate sensor directly to the browser.',['ble','vitals']],
['Ayurvedic Nadi Analysis',O,'Experimental pulse-pattern analysis with Vita AI.',[['embed',{url:SITES.vita,t:'Vita AI Nadi analysis (experimental)'}]]],
['Lifestyle History',O,'Every logged reading, searchable and exportable.',['history']],
['Health Reports',O,'A printable summary for your flight surgeon or doctor.',['report']],
['Trend Forecast',P,'Forecast your next reading from your own history.',['trend']],
['Backend Telemetry',P,'Live feed from the BRAHMAND GANGA server.',['crew','status']],
['System Status',P,'Check every connection and offline readiness.',['status']],
['Data Sources and Privacy',P,'Where every number comes from, and where your data stays.',[['info',{items:[['NASA EPIC','Earth imagery from the DSCOVR satellite.'],['NASA DONKI','Solar flare, CME and geomagnetic storm records.'],['NASA APOD and NeoWs','Daily astronomy image and near-Earth asteroid feed.'],['NASA GIBS MODIS','Daily satellite imagery by region.'],['Crew telemetry','Simulated demonstration feed. Connect real sensors on Hardware Connectivity.'],['Your health data','Stored only in this browser. It leaves the device only when you press Alert flight surgeon or open an external analysis tool.']]}]]],
['About the Mission',P,'The NASA Space Apps challenge and why Earth belongs in astronaut care.',[['info',{items:[['The problem','Astronaut health tools and Earth observation data live in separate systems.'],['Our approach','Link what crews see to how they feel: when stress rises, suggest an Earth view and measure the change.'],['Important','BRAHMAND GANGA supports monitoring and is not a medical device. It does not diagnose. Always consult a qualified clinician.']]}]]]
];
const page=document.body.dataset.page;
const num=+page||0;
/* ---------- helpers ---------- */
const card=(t,body,note,w)=>el('section',{class:'card'+(w?' w':'')},t&&el('h3',{},t),body,note&&el('p',{class:'note'},note));
const log=()=>store.get('bg_log',[]);
const lvlOrder={ok:0,warn:1,critical:2};
function assess(v){const a=[];const add=(l,m)=>a.push({l,m});
if(v.hr<40||v.hr>130)add('critical','Heart rate '+v.hr+' bpm is outside the safe range.');else if(v.hr<50||v.hr>110)add('warn','Heart rate '+v.hr+' bpm is unusual.');
if(v.spo2<90)add('critical','SpO₂ '+v.spo2+'% is critically low.');else if(v.spo2<95)add('warn','SpO₂ '+v.spo2+'% is below normal.');
if(v.temp>=39||v.temp<35)add('critical','Body temperature '+v.temp+' °C needs immediate attention.');else if(v.temp>=38||v.temp<35.8)add('warn','Body temperature '+v.temp+' °C is abnormal.');
if(v.hrv!=null&&v.hrv<20)add('warn','HRV '+v.hrv+' ms is low, a sign of strain.');
if(v.stress>=80)add('warn','Stress level is very high. Try an Earth-gazing session.');
if(v.sleep!=null&&v.sleep<5)add('warn','Sleep of '+v.sleep+' h is too low.');
if(v.rad>1)add('warn','Radiation dose rate '+v.rad+' mSv/day is above the usual station level.');
if(!a.length)add('ok','All readings are within normal ranges.');return a}
const alertEls=l=>l.map(x=>el('div',{class:'alert '+x.l},x.m));
const worst=l=>l.reduce((m,x)=>lvlOrder[x.l]>lvlOrder[m]?x.l:m,'ok');
function spark(vals,color='#4cc3d9'){if(vals.length<2)return el('p',{class:'note'},'Not enough data yet.');const mn=Math.min(...vals),mx=Math.max(...vals),r=mx-mn||1;const pts=vals.map((v,i)=>(i/(vals.length-1)*300).toFixed(1)+','+(56-(v-mn)/r*52).toFixed(1)).join(' ');const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 300 60');s.setAttribute('class','spark');s.setAttribute('preserveAspectRatio','none');s.innerHTML='<polyline fill="none" stroke="'+color+'" stroke-width="2" points="'+pts+'"/>';return s}
const tile=(l,v,u='')=>el('div',{class:'tile'},el('small',{},l),el('b',{},v+u));
const field=(l,id,o={})=>el('label',{},l,el('input',{id,type:'number',step:o.step||'any',value:o.v??'',min:o.min,max:o.max,required:o.req?'':false}));
const fmt=d=>new Date(d).toLocaleString();
const yesterday=()=>new Date(Date.now()-864e5).toISOString().slice(0,10);

/* Safely render NASA APOD explanation: HTML + Markdown + escaped HTML. */
function apodRichText(raw){
 const source=String(raw??'')
  .replace(/\\</g,'<')
  .replace(/\\>/g,'>')
  .replace(/\\\//g,'/')
  // NASA content can contain a Markdown URL wrapped inside an HTML href.
  .replace(/href=(["'])\[?(https?:\/\/[^\]"')]+)\]?\((https?:\/\/[^)"']+)\)\1/gi, 'href="$3"');
 const parsed=new DOMParser().parseFromString(source,'text/html');
 const allowed=new Set(['P','STRONG','B','EM','I','BR','A','UL','OL','LI']);
 const safeUrl=value=>{
  const href=String(value||'').trim().replace(/^\[|\]$/g,'');
  try{
   const u=new URL(href,location.href);
   return (u.protocol==='https:'||u.protocol==='http:')?u.href:null;
  }catch{return null}
 };
 const inlineText=value=>{
  const frag=document.createDocumentFragment();
  // Convert Markdown links and bold markers in text nodes only, never in HTML attributes.
  const token=/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([\s\S]+?)\*\*|(\r?\n)/g;
  let last=0, match;
  while((match=token.exec(value))){
   if(match.index>last)frag.append(document.createTextNode(value.slice(last,match.index)));
   if(match[1]!==undefined){
    const href=safeUrl(match[2]);
    if(href){
     const a=document.createElement('a');
     a.href=href;a.target='_blank';a.rel='noopener noreferrer';
     a.textContent=match[1];frag.append(a);
    }else frag.append(document.createTextNode(match[1]));
   }else if(match[4]!==undefined){
    frag.append(document.createElement('br'));
   }else{
    const strong=document.createElement('strong');
    strong.textContent=match[3];frag.append(strong);
   }
   last=token.lastIndex;
  }
  if(last<value.length)frag.append(document.createTextNode(value.slice(last)));
  return frag;
 };
 const copy=node=>{
  if(node.nodeType===Node.TEXT_NODE)return inlineText(node.nodeValue||'');
  if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
  if(!allowed.has(node.tagName)){
   const frag=document.createDocumentFragment();
   [...node.childNodes].forEach(child=>frag.append(copy(child)));
   return frag;
  }
  const out=document.createElement(node.tagName.toLowerCase());
  if(node.tagName==='A'){
   let href=node.getAttribute('href')||'';
   // Also repair links whose href was itself serialized as Markdown.
   const wrapped=href.match(/^\[?(https?:\/\/[^\]]+?)\]?\((https?:\/\/[^)]+)\)$/);
   if(wrapped)href=wrapped[2];
   const safe=safeUrl(href);
   if(safe){out.href=safe;out.target='_blank';out.rel='noopener noreferrer';}
   else{
    const frag=document.createDocumentFragment();
    [...node.childNodes].forEach(child=>frag.append(copy(child)));
    return frag;
   }
  }
  [...node.childNodes].forEach(child=>out.append(copy(child)));
  return out;
 };
 const fragment=document.createDocumentFragment();
 [...parsed.body.childNodes].forEach(node=>fragment.append(copy(node)));
 return fragment;
}

/* ---------- widgets ---------- */
const W={
crew(){const box=el('div',{},el('p',{class:'note'},'Loading…'));const hist={hr:[]};
 const c=card('Crew vitals (simulated demonstration feed)',box,'Simulated until a real sensor is connected on the Hardware Connectivity page.',1);
 every(async()=>{try{const d=await get('/api/crew/telemetry');hist.hr.push(d.hr);hist.hr=hist.hr.slice(-40);
  box.replaceChildren(el('div',{class:'tiles'},tile('Heart rate',d.hr,' bpm'),tile('HRV',d.hrv,' ms'),tile('SpO₂',d.spo2,'%'),tile('Temp',d.temp,' °C'),tile('Radiation',d.rad,' mSv/d'),tile('Stress',d.stress)),spark(hist.hr),...alertEls(assess(d)));store.set('bg_live',d)}
  catch(e){box.replaceChildren(el('div',{class:'alert warn'},'Server not reachable. Showing your last logged reading instead.'),...(log().length?[el('div',{class:'tiles'},...Object.entries(log().at(-1)).filter(([k])=>k!=='t').map(([k,v])=>tile(k,v)))]:[]))}},3000);return c},
alerts(){const box=el('div');const draw=()=>{const l=log(),v=store.get('bg_live',null)||l.at(-1);box.replaceChildren(...(v?alertEls(assess(v)):[el('p',{class:'note'},'No readings yet. Log vitals or open the Health Command Center.')]))};every(draw,4000);return card('Health alerts',box,null,0)},
vitals(){const f=el('form',{class:'f'},field('Heart rate (bpm)','hr',{v:70,min:20,max:250,req:1}),field('HRV (ms)','hrv',{v:50,min:0,max:300}),field('SpO₂ (%)','spo2',{v:98,min:50,max:100,step:1,req:1}),field('Temperature (°C)','temp',{v:36.7,min:30,max:45,step:.1,req:1}),field('Sleep (hours)','sleep',{v:7,min:0,max:24,step:.5}),field('Stress (0–100)','stress',{v:30,min:0,max:100}),field('Radiation (mSv/day)','rad',{v:.5,min:0,max:50,step:.01}),el('button',{class:'btn pri',type:'submit'},'Save reading'));
 const out=el('div');f.addEventListener('submit',e=>{e.preventDefault();const v={t:Date.now()};f.querySelectorAll('input').forEach(i=>{if(i.value!=='')v[i.id]=+i.value});const l=log();l.push(v);store.set('bg_log',l.slice(-1000));store.set('bg_live',v);out.replaceChildren(el('p',{},'Saved. '),...alertEls(assess(v)))});
 W.vitals.fill=v=>{for(const[k,x]of Object.entries(v)){const i=f.querySelector('#'+k);if(i)i.value=x}};return card('Log a reading',el('div',{},f,out),'Stored only in this browser.',1)},
phenoage(){const F=[['Age (years)','age',45],['Albumin (g/dL)','alb',4.3],['Creatinine (mg/dL)','cre',0.9],['Glucose (mg/dL)','glu',90],['CRP (mg/L)','crp',1],['Lymphocytes (%)','lym',30],['MCV (fL)','mcv',90],['RDW (%)','rdw',13],['Alk. phosphatase (U/L)','alp',70],['WBC (10³/µL)','wbc',6]];
 const f=el('form',{class:'f'},F.map(([l,i,v])=>field(l,i,{v,req:1})),el('button',{class:'btn pri',type:'submit'},'Calculate'));const out=el('div');
 f.addEventListener('submit',e=>{e.preventDefault();const g=i=>+f.querySelector('#'+i).value;if(g('crp')<=0)return out.replaceChildren(el('div',{class:'alert warn'},'CRP must be above 0 mg/L (use 0.1 for undetectable).'));
  const xb=-19.9067-0.0336*g('alb')*10+0.0095*g('cre')*88.4+0.1953*g('glu')/18.016+0.0954*Math.log(g('crp')/10)-0.012*g('lym')+0.0268*g('mcv')+0.3306*g('rdw')+0.0019*g('alp')+0.0554*g('wbc')+0.0804*g('age');
  const m=1-Math.exp(-Math.exp(xb)*(Math.exp(120*0.0076927)-1)/0.0076927);const pa=141.50225+Math.log(-0.00553*Math.log(1-m))/0.090165;const d=pa-g('age');
  store.set('bg_pheno',{t:Date.now(),pa,age:g('age')});out.replaceChildren(el('div',{class:'tiles'},tile('Biological age',pa.toFixed(1),' y'),tile('Chronological',g('age'),' y'),tile('Difference',(d>0?'+':'')+d.toFixed(1),' y')),el('div',{class:'alert '+(d>3?'warn':'ok')},d>3?'Biologically older than your age. Share this with your clinician.':d<-3?'Biologically younger than your age.':'Close to your chronological age.'))});
 return card('PhenoAge calculator (Levine 2018)',el('div',{},f,out),'Research estimate, not a diagnosis. Uses the published PhenoAge coefficients.',1)},
moon(){
 const tools=[
  {name:'NASA Moon Trek',kind:'Primary LRO explorer',desc:'Explore the Moon in 3D, switch between global and polar maps, inspect LRO basemaps, search lunar features and use measurement tools.',url:'https://trek.nasa.gov/moon/',cta:'Launch Moon Trek',tag:'NASA · LRO data'},
  {name:'LROC QuickMap',kind:'High-detail lunar map',desc:'A specialist map viewer from the Lunar Reconnaissance Orbiter Camera team with detailed lunar imagery and map layers.',url:'https://quickmap.lroc.asu.edu/',cta:'Open QuickMap',tag:'LROC · Arizona State University'},
  {name:'NASA Eyes on the Solar System',kind:'3D mission visualisation',desc:'Travel through the Earth–Moon system and explore spacecraft, orbits and mission geometry in an interactive 3D environment.',url:'https://eyes.nasa.gov/apps/orrery/#/moon',cta:'Explore in NASA Eyes',tag:'NASA'},
  {name:'NASA Moon Interactives',kind:'Learning and exploration hub',desc:'Discover NASA tools for lunar landmarks, Moon events, surface features and exploration.',url:'https://science.nasa.gov/moon/interactives/',cta:'View NASA resources',tag:'NASA Science'}
 ];
 const hero=el('div',{class:'mod16-hero'},el('div',{class:'mod16-orb', 'aria-hidden':'true'},'☾'),el('div',{class:'mod16-hero-copy'},el('p',{class:'mod16-kicker'},'LUNAR RECONNAISSANCE ORBITER · LRO'),el('h2',{},'Explore the lunar surface'),el('p',{},'Open NASA’s dedicated lunar mapping tools for global mosaics, polar terrain, craters, landing regions and 3D mission visualisation.'),el('a',{class:'btn pri',href:'https://trek.nasa.gov/moon/',target:'_blank',rel:'noopener noreferrer'},'Launch NASA Moon Trek ↗')));
 const cards=el('div',{class:'mod16-tools'},tools.map((t,i)=>el('article',{class:'mod16-tool'},el('div',{class:'mod16-tool-top'},el('span',{class:'mod16-index'},String(i+1).padStart(2,'0')),el('span',{class:'mod16-tag'},t.tag)),el('p',{class:'mod16-kind'},t.kind),el('h3',{},t.name),el('p',{},t.desc),el('a',{class:'btn sm',href:t.url,target:'_blank',rel:'noopener noreferrer'},t.cta+' ↗'))));
 const note=el('div',{class:'mod16-note'},el('strong',{},'Why does the map open separately?'),el('p',{},'NASA Moon Trek controls its own mapping interface and may refuse to display inside another website. This module therefore opens the official tools directly instead of showing a blank embedded panel. Your BRAHMAND GANGA page remains available in its original tab.'));
 return card('NASA lunar exploration tools',el('div',{class:'mod16-panel'},hero,el('div',{class:'mod16-section-head'},el('h3',{},'Choose an exploration tool'),el('p',{},'Official lunar mapping and visualisation resources')),cards,note),'NASA Moon Trek uses LRO-derived lunar mapping products. External tools open in a new tab.',1)
},
embed(o){const f=el('iframe',{src:o.url,title:o.t,loading:'lazy',allow:o.cam?'camera; microphone':'',referrerpolicy:'no-referrer'});return card(o.t,el('div',{},el('div',{class:'row'},el('a',{class:'btn sm pri',href:o.url,target:'_blank',rel:'noopener'},'Open in a new tab'),el('span',{class:'note'},'If the panel stays blank, the tool blocks embedding. Use the button instead.')),f),o.cam?'Camera access is requested by the tool itself.':null,1)},
upload(o){const img=el('img',{class:'fit',alt:'Preview',hidden:''});const inp=el('input',{type:'file',accept:o.kind,onchange:e=>{const f=e.target.files[0];if(!f)return;img.src=URL.createObjectURL(f);img.hidden=false}});return card(o.t,el('div',{},inp,img),'Images are displayed locally and are not uploaded. This viewer does not diagnose.',1)},
ocr(){const inp=el('input',{type:'file',accept:'image/*'}),out=el('pre',{class:'out'},'Choose a photo or scan of a lab report.'),kv=el('div'),b=el('button',{class:'btn pri',onclick:async()=>{const f=inp.files[0];if(!f)return out.textContent='Choose an image first.';b.disabled=true;out.textContent='Loading on-device OCR (first run downloads the model)…';
 try{if(!window.Tesseract)await new Promise((r,j)=>document.head.append(el('script',{src:'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',onload:r,onerror:j})));const {data}=await Tesseract.recognize(f,'eng');out.textContent=data.text||'No text found.';
 const keys=['glucose','hemoglobin','haemoglobin','creatinine','cholesterol','triglycerides','albumin','wbc','platelet','crp'];const rows=[];data.text.split('\n').forEach(l=>{const k=keys.find(x=>l.toLowerCase().includes(x));const n=l.match(/(\d+(?:\.\d+)?)/);if(k&&n)rows.push(el('tr',{},el('td',{},k),el('td',{},n[1]),el('td',{},l.trim())))});kv.replaceChildren(rows.length?el('table',{},el('tr',{},el('th',{},'Marker'),el('th',{},'Value'),el('th',{},'Source line')),rows):el('p',{class:'note'},'No known markers detected. Check the text above.'))}
 catch(e){out.textContent='OCR could not load. Check your connection and try again.'}b.disabled=false}},'Read report');
 return card('Report OCR (runs in your browser)',el('div',{},inp,el('div',{class:'row'},b),out,kv),'Always verify extracted values against the original report.',1)},
stress(){const s=el('input',{type:'range',min:0,max:100,value:store.get('bg_stress',30)}),v=el('b',{},s.value),m=el('select',{},['Calm','Okay','Tense','Low','Anxious'].map(x=>el('option',{},x))),r=el('div');s.oninput=()=>v.textContent=s.value;
 return card('How are you right now?',el('div',{},el('label',{},'Stress ',v,s),el('label',{},'Mood',m),el('div',{class:'row'},el('button',{class:'btn pri',onclick:()=>{store.set('bg_stress',+s.value);const l=log();l.push({t:Date.now(),stress:+s.value,mood:m.value});store.set('bg_log',l);r.replaceChildren(...alertEls(assess({stress:+s.value})),+s.value>=60?el('a',{class:'btn sm',href:'page7.html',target:'_blank',rel:'noopener'},'Start Earth-gazing'):'')}},'Save check-in')),r),null,1)},
gaze(){
 const V=[
  ['Himalaya', '82,26,92,32'],
  ['Ganga delta', '86,20,92,26'],
  ['Pacific clouds', '-160,0,-148,12'],
  ['Patna (home)', '84.5,24.5,86.5,26.5'],
  ['Haldwani (home)', '79,28.7,80,29.7'],
  ['Amazon', '-64,-6,-54,2']
 ];
 const isExplorer=num===15;
 const sel=el('select',{},V.map(([n])=>el('option',{},n)));
 const pre=el('input',{type:'range',min:0,max:100,value:store.get('bg_stress',60)});
 const post=el('input',{type:'range',min:0,max:100,value:30});
 const img=el('img',{class:'fit',alt:'NASA Terra MODIS true-colour satellite image'});
 const msg=el('p',{class:'note','aria-live':'polite'},'Choose a region to load NASA satellite imagery.');
 const rec=el('p',{class:'note'});
 const dateLabel=el('span',{class:'pill'},'');
 const openLink=el('a',{class:'btn sm',target:'_blank',rel:'noopener noreferrer',href:'https://worldview.earthdata.nasa.gov/'},'Open NASA Worldview');
 const imageWrap=el('div',{class:'mod15-image-wrap'});
 const imgLink=el('a',{target:'_blank',rel:'noopener noreferrer',href:'https://worldview.earthdata.nasa.gov/','aria-label':'Open satellite image in a new tab'},img);
 imageWrap.append(imgLink);
 let attempt=0, dates=[], requestToken=0;
 const day=(n)=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
 const makeUrl=(bbox,date)=>{
  // Use NASA GIBS official WMS GetMap endpoint. The older wvs snapshot
  // endpoint is not the documented GIBS image service and can return a blank image.
  const q=new URLSearchParams({
   SERVICE:'WMS',
   VERSION:'1.1.1',
   REQUEST:'GetMap',
   LAYERS:'MODIS_Terra_CorrectedReflectance_TrueColor',
   STYLES:'',
   SRS:'EPSG:4326',
   BBOX:bbox,
   WIDTH:'1200',
   HEIGHT:'800',
   FORMAT:'image/jpeg',
   TIME:date
  });
  return 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?'+q.toString();
 };
 const show=()=>{
  const selected=V.find(x=>x[0]===sel.value)||V[0];
  dates=[1,2,3,4,5].map(day);attempt=0;
  const token=++requestToken;
  msg.textContent='Requesting NASA Terra MODIS imagery…';dateLabel.textContent='Loading satellite data';
  img.removeAttribute('src');
  const tryDate=()=>{
   if(token!==requestToken)return;
   if(attempt>=dates.length){
    img.removeAttribute('src');imgLink.href='https://worldview.earthdata.nasa.gov/';
    msg.textContent='NASA imagery could not be loaded for the recent dates. This can happen during satellite-data delays or temporary NASA service interruptions. Open NASA Worldview to inspect the region.';
    dateLabel.textContent='Imagery unavailable';return;
   }
   const date=dates[attempt++],url=makeUrl(selected[1],date);
   img.onload=()=>{
    if(token!==requestToken)return;
    if(!img.naturalWidth){tryDate();return;}
    imgLink.href=url;
    msg.textContent='NASA Terra MODIS · True Color · '+date+' · Region: '+selected[0];
    dateLabel.textContent='Image date: '+date;
   };
   img.onerror=()=>{if(token===requestToken)tryDate();};
   img.src=url;
  };
  tryDate();
 };
 const suggest=()=>{
  const s=+pre.value;
  if(isExplorer){rec.textContent='Suggested viewing region: '+(s>=70?'Himalaya — broad mountain terrain':s>=40?'Ganga delta — river and coastal patterns':'Patna — a familiar regional view');}
  else rec.textContent='Suggested: '+(s>=70?'Himalaya or Pacific clouds, wide and quiet views':s>=40?'Ganga delta, a familiar flowing landscape':'Your hometown, to keep a sense of connection');
  sel.value=s>=70?'Himalaya':s>=40?'Ganga delta':'Patna (home)';show();
 };
 sel.onchange=show;
 pre.oninput=()=>{rec.textContent='Stress before session: '+pre.value+'/100';};
 img.onerror=()=>{};
 const save=el('button',{class:'btn pri',onclick:()=>{
  const g=store.get('bg_gaze',[]);g.push({t:Date.now(),view:sel.value,before:+pre.value,after:+post.value});store.set('bg_gaze',g);
  msg.textContent='Session saved on this device. Stress change: '+(+post.value-+pre.value)+' points.';
 }},'Save session');
 const controls=el('div',{class:'mod15-controls'},
  el('label',{},'Select region',sel),
  el('label',{},'Stress before (0–100)',pre),
  rec,
  el('label',{},'Stress after (0–100)',post),
  el('div',{class:'row'},save,openLink)
 );
 if(isExplorer){
  const panel=el('div',{class:'mod15-panel'},
   el('div',{class:'mod15-image-head'},el('div',{},el('strong',{},'Satellite image'),el('p',{class:'note'},'Terra / MODIS · Corrected Reflectance · True Color')),dateLabel),
   imageWrap,msg,
   el('p',{class:'mod15-attribution'},'Imagery source: NASA Global Imagery Browse Services (GIBS) / Earthdata. Satellite imagery is not a real-time live feed.'),
   controls
  );
  const c=card('NASA MODIS Earth Observation',panel,'Choose a region to view the latest available daily satellite image. The service may publish imagery with a delay.',1);
  c.classList.add('mod15-card');
  queueMicrotask(()=>{pre.value=store.get('bg_stress',60);rec.textContent='Select a region, or use the stress-based suggestion.';sel.value='Ganga delta';show();});
  return c;
 }
 queueMicrotask(suggest);
 return card('Earth-gazing session',el('div',{},el('label',{},'Stress before (0–100)',pre),rec,el('label',{},'View',sel),img,msg,el('label',{},'Stress after (0–100)',post),save),'Wellness support only, not treatment.',1);
},
gazelog(){const g=store.get('bg_gaze',[]);const avg=g.length?(g.reduce((a,x)=>a+x.before-x.after,0)/g.length).toFixed(1):null;return card('Earth-gazing results',g.length?el('div',{},el('div',{class:'tiles'},tile('Sessions',g.length),tile('Average stress drop',avg)),el('table',{},g.slice(-8).reverse().map(x=>el('tr',{},el('td',{},fmt(x.t)),el('td',{},x.view),el('td',{},x.before+' → '+x.after))))):el('p',{},'No sessions yet. Start one on the Earth-Gazing Therapy page.'),null,1)},
epic(){const box=el('div',{},el('p',{class:'note'},'Loading NASA EPIC…'));let t;const c=card('Earth from NASA EPIC (DSCOVR)',box,'Full-disk Earth images, about 1.5 million km from Earth.',1);
 get('/api/nasa/epic').then(d=>{const im=d.images||[];if(!im.length)throw 0;const img=el('img',{class:'fit',alt:'Earth from DSCOVR EPIC'}),cap=el('p',{class:'note'});let i=0;const s=()=>{img.src=im[i].url;cap.textContent=fmt(im[i].date+'Z')+' UTC · '+im[i].caption;i=(i+1)%im.length};s();const b=el('button',{class:'btn sm',onclick:()=>{if(t){clearInterval(t);t=0;b.textContent='Play rotation'}else{t=setInterval(s,900);timers.push(t);b.textContent='Pause'}}},'Play rotation');box.replaceChildren(img,el('div',{class:'row'},b,el('button',{class:'btn sm',onclick:s},'Next frame')),cap)}).catch(()=>box.replaceChildren(el('div',{class:'alert warn'},'EPIC imagery is unavailable. Check the server NASA key or try later.')));return c},
donki(){const box=el('div',{},el('p',{class:'note'},'Loading NASA DONKI…'));get('/api/nasa/donki').then(d=>{const lvl=d.level;box.replaceChildren(el('div',{class:'alert '+(lvl==='high'?'critical':lvl==='elevated'?'warn':'ok')},'Space weather, last 7 days: '+lvl),el('div',{class:'tiles'},tile('Solar flares',d.flares.length),tile('CMEs',d.cmes.length),tile('Geomagnetic storms',d.storms.length)),el('table',{},[...d.flares.slice(-5).map(x=>['Flare '+(x.classType||''),x.beginTime]),...d.storms.slice(-3).map(x=>['Storm',x.startTime])].map(r=>el('tr',{},el('td',{},r[0]),el('td',{},r[1]||''))))) ;store.set('bg_space',d.level)}).catch(()=>box.replaceChildren(el('div',{class:'alert warn'},'Space weather data is unavailable right now.')));return card('Space radiation (NASA DONKI)',box,'Flares M-class and above raise crew radiation risk.',1)},
apod(){
 const box=el('div',{class:'apod-shell'},el('div',{class:'apod-loading'},el('span',{class:'apod-orbit'},'✦'),el('p',{},'Connecting to NASA Astronomy Picture of the Day…')));
 const validUrl=value=>{try{const u=new URL(String(value||''),location.href);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}};
 const articleUrl=d=>{
  const direct=validUrl(d.page_url||d.apod_url||d.permalink||d.article_url);
  if(direct)return direct;
  if(d.date&&d.title){
   const dt=new Date(d.date+'T12:00:00Z');
   if(!Number.isNaN(dt.getTime())){
    const month=dt.toLocaleString('en-US',{month:'long',timeZone:'UTC'}).toLowerCase();
    const slug=String(d.title).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    return 'https://science.nasa.gov/image-article/apod-'+dt.getUTCFullYear()+'-'+month+'-'+dt.getUTCDate()+'-'+slug+'/';
   }
  }
  return 'https://science.nasa.gov/apod/';
 };
 const dateLabel=value=>{if(!value)return 'NASA · Astronomy Picture of the Day';const dt=new Date(value+'T12:00:00');return Number.isNaN(dt.getTime())?value:dt.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})};
 const showError=()=>box.replaceChildren(el('div',{class:'apod-error'},el('span',{class:'apod-error-icon'},'!'),el('h3',{},'NASA APOD is temporarily unavailable'),el('p',{},'The page could not retrieve the daily astronomy feed. Check the server connection and try again.'),el('button',{class:'btn pri',type:'button',onclick:load},'Retry connection')));
 const load=()=>{
  box.replaceChildren(el('div',{class:'apod-loading'},el('span',{class:'apod-orbit'},'✦'),el('p',{},'Loading today’s NASA image…')));
  get('/api/nasa/apod').then(d=>{
   const title=String(d.title||'Astronomy Picture of the Day');
   const pageUrl=articleUrl(d);
   const header=el('div',{class:'apod-heading'},el('div',{class:'apod-eyebrow'},el('span',{class:'apod-live-dot'}),'NASA DAILY FEATURE'),el('h2',{},el('a',{href:pageUrl,target:'_blank',rel:'noopener noreferrer'},title)),el('p',{class:'apod-date'},dateLabel(d.date)));
   const mediaBox=el('div',{class:'apod-media'});
   if(d.media_type==='video'){
    const videoUrl=validUrl(d.url);
    if(videoUrl)mediaBox.append(el('div',{class:'apod-video-card'},el('span',{class:'apod-video-symbol'},'▶'),el('p',{},'Today’s APOD is a video'),el('a',{class:'btn pri',href:videoUrl,target:'_blank',rel:'noopener noreferrer'},'Watch NASA video ↗')));
    else mediaBox.append(el('p',{class:'note'},'NASA supplied a video entry without a valid video URL.'));
   }else{
    const imageUrl=validUrl(d.hdurl)||validUrl(d.url);
    if(imageUrl){
     const img=el('img',{class:'apod-image',src:imageUrl,alt:String(d.title||'NASA Astronomy Picture of the Day'),loading:'eager',decoding:'async'});
     img.addEventListener('error',()=>{const fallback=validUrl(d.url);if(fallback&&fallback!==img.src){img.src=fallback}else{mediaBox.replaceChildren(el('div',{class:'apod-image-fallback'},el('span',{},'Image unavailable'),el('p',{},'The NASA text feed loaded, but the image could not be displayed.')))}},{once:true});
     const imageLink=el('a',{class:'apod-image-link',href:imageUrl,target:'_blank',rel:'noopener noreferrer','aria-label':'Open the full-resolution NASA astronomy image'},img);
     mediaBox.append(imageLink,el('div',{class:'apod-image-hint'},'Select image to view full resolution ↗'));
    }else mediaBox.append(el('div',{class:'apod-image-fallback'},el('span',{},'No image URL supplied'),el('p',{},'NASA returned an APOD entry without an image URL.')));
   }
   const explain=el('section',{class:'apod-explanation-panel'},el('div',{class:'apod-section-label'},'THE STORY BEHIND THE IMAGE'),el('div',{class:'apod-explanation'}));
   explain.querySelector('.apod-explanation').append(apodRichText(d.explanation||'No explanation was supplied by NASA.'));
   const credit=el('div',{class:'apod-credit'},el('span',{},'IMAGE CREDIT'),el('p',{}));
   credit.querySelector('p').append(apodRichText(d.copyright||d.credit||'NASA'));
   const actions=el('div',{class:'apod-actions'},el('a',{class:'btn pri',href:pageUrl,target:'_blank',rel:'noopener noreferrer'},'Read on NASA Science ↗'),el('a',{class:'btn',href:'https://science.nasa.gov/apod/',target:'_blank',rel:'noopener noreferrer'},'Explore APOD archive'));
   box.replaceChildren(header,mediaBox,explain,el('div',{class:'apod-bottom'},credit,actions));
  }).catch(showError);
 };
 load();
 return card(null,box,'NASA Astronomy Picture of the Day · Image and explanation provided by NASA.',1)
},
neo(){const box=el('div',{},el('p',{class:'note'},'Loading…'));get('/api/nasa/neo').then(d=>{const l=Object.values(d.near_earth_objects||{}).flat();box.replaceChildren(el('div',{class:'tiles'},tile('Objects today',l.length),tile('Flagged hazardous',l.filter(x=>x.is_potentially_hazardous_asteroid).length)),l.length?el('table',{},el('tr',{},el('th',{},'Name'),el('th',{},'Diameter'),el('th',{},'Miss distance'),el('th',{},'Hazard')),l.slice(0,15).map(x=>el('tr',{},el('td',{},x.name),el('td',{},Math.round(x.estimated_diameter.meters.estimated_diameter_max)+' m'),el('td',{},Math.round(+x.close_approach_data[0].miss_distance.kilometers).toLocaleString()+' km'),el('td',{},x.is_potentially_hazardous_asteroid?'Yes':'No')))):el('p',{},'No data returned.'))}).catch(()=>box.replaceChildren(el('div',{class:'alert warn'},'Asteroid data is unavailable.')));return card('Near-Earth objects today (NASA NeoWs)',box,null,1)},
iss(){const box=el('div',{},el('p',{class:'note'},'Locating the station…'));every(async()=>{try{const d=await get('https://api.wheretheiss.at/v1/satellites/25544',8000);const saa=d.latitude>-50&&d.latitude<0&&d.longitude>-90&&d.longitude<40;box.replaceChildren(el('div',{class:'tiles'},tile('Latitude',d.latitude.toFixed(2),'°'),tile('Longitude',d.longitude.toFixed(2),'°'),tile('Altitude',Math.round(d.altitude),' km'),tile('Speed',Math.round(d.velocity).toLocaleString(),' km/h')),el('div',{class:'alert '+(saa?'warn':'ok')},saa?'Inside the approximate South Atlantic Anomaly region: radiation is higher here.':'Outside the South Atlantic Anomaly region.'))}catch{box.replaceChildren(el('div',{class:'alert warn'},'Live position unavailable. Retrying.'))}},6000);return card('International Space Station',box,'Position from wheretheiss.at. The anomaly region is an approximate box.',1)},
checklist(o){const st=store.get(o.k,{});return card(o.t,el('div',{},o.items.map((x,i)=>el('label',{class:'check'},el('input',{type:'checkbox',checked:st[i]?'':false,onchange:e=>{st[i]=e.target.checked;store.set(o.k,st)}}),x)),el('button',{class:'btn sm',onclick:()=>{store.set(o.k,{});location.reload()}},'Reset')),'Training aid. Follow your mission’s approved procedures.',0)},
emergency(){const out=el('div');return card('Escalate to flight surgeon',el('div',{},el('p',{},'Sends your latest reading and alert level to mission control.'),el('button',{class:'btn bad',onclick:async()=>{const v=store.get('bg_live',null)||log().at(-1)||{};const p={t:Date.now(),level:worst(assess(v)),vitals:v,note:'Manual escalation'};try{const r=await fetch(API+'/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw 0;const d=await r.json();out.replaceChildren(el('div',{class:'alert ok'},'Alert '+d.id+' sent at '+fmt(d.t)+'.'))}catch{const q=store.get('bg_queue',[]);q.push(p);store.set('bg_queue',q);out.replaceChildren(el('div',{class:'alert warn'},'No connection. The alert is queued and sends when you are back online. Use voice or radio now if this is urgent.'))}}},'Alert flight surgeon'),out),'Escalation level is computed from your latest readings.',0)},
edge(){const box=el('div'),on=el('span',{class:'pill'},'');const up=()=>{on.textContent=navigator.onLine?'Online':'Offline, still working';on.className='pill '+(navigator.onLine?'ok':'')};addEventListener('online',up);addEventListener('offline',up);up();
 const draw=()=>{const v=store.get('bg_live',null)||log().at(-1);if(!v)return box.replaceChildren(el('p',{class:'note'},'Log a reading to score it.'));let s=0;s+=Math.min(40,Math.abs(v.hr-70)*.6)+(v.spo2<96?(96-v.spo2)*6:0)+(v.temp>37.5?(v.temp-37.5)*20:0)+(v.stress>60?(v.stress-60)*.5:0)+(v.hrv<30?(30-v.hrv)*.8:0)+(v.rad>1?20:0);s=Math.min(100,Math.round(s));box.replaceChildren(el('div',{class:'tiles'},tile('Risk score',s,'/100')),el('div',{class:'alert '+(s>60?'critical':s>30?'warn':'ok')},s>60?'High risk. Escalate.':s>30?'Moderate risk. Monitor closely.':'Low risk.'))};every(draw,4000);
 return card('On-device risk score',el('div',{},on,box),'Transparent rule-based baseline that runs with no network. A trained TensorFlow.js model can replace it.',1)},
ble(){const out=el('div',{},el('p',{class:'note'},'Not connected.'));const b=el('button',{class:'btn pri',onclick:async()=>{if(!navigator.bluetooth)return out.replaceChildren(el('div',{class:'alert warn'},'Web Bluetooth needs Chrome or Edge on Android or desktop, over HTTPS.'));try{const d=await navigator.bluetooth.requestDevice({filters:[{services:['heart_rate']}]});const s=await d.gatt.connect();const ch=await(await s.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement');await ch.startNotifications();ch.addEventListener('characteristicvaluechanged',e=>{const dv=e.target.value,hr=dv.getUint8(0)&1?dv.getUint16(1,true):dv.getUint8(1);const v={...(store.get('bg_live',{})),hr,t:Date.now()};store.set('bg_live',v);if(W.vitals.fill)W.vitals.fill({hr});out.replaceChildren(el('div',{class:'tiles'},tile('Heart rate',hr,' bpm')),...alertEls(assess({hr})))});out.replaceChildren(el('p',{},'Connected to '+(d.name||'sensor')+'.'))}catch(e){out.replaceChildren(el('div',{class:'alert warn'},'Connection cancelled or failed.'))}}},'Connect heart-rate sensor');return card('Bluetooth heart-rate sensor',el('div',{},b,out),'Works with standard BLE heart-rate straps and watches.',0)},
history(){const l=log();const csv=()=>{const k=[...new Set(l.flatMap(Object.keys))];const t=[k.join(','),...l.map(r=>k.map(x=>r[x]??'').join(','))].join('\n');const a=el('a',{href:URL.createObjectURL(new Blob([t],{type:'text/csv'})),download:'brahmand-ganga-history.csv'});a.click()};
 return card('All readings ('+l.length+')',l.length?el('div',{},el('div',{class:'row'},el('button',{class:'btn sm',onclick:csv},'Export CSV'),el('button',{class:'btn sm',onclick:()=>{if(confirm('Delete all stored readings?')){store.set('bg_log',[]);location.reload()}}},'Clear history')),el('table',{},el('tr',{},['Time','HR','HRV','SpO₂','Temp','Sleep','Stress'].map(x=>el('th',{},x))),l.slice(-50).reverse().map(r=>el('tr',{},[fmt(r.t),r.hr,r.hrv,r.spo2,r.temp,r.sleep,r.stress].map(x=>el('td',{},x??'–')))))):el('p',{},'No readings yet. Add one on the Vitals Logger page.'),null,1)},
report(){const l=log(),p=store.get('bg_pheno',null),g=store.get('bg_gaze',[]);const av=k=>{const a=l.filter(x=>x[k]!=null).map(x=>x[k]);return a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'–'};
 return card('Health report · '+new Date().toLocaleDateString(),el('div',{},el('div',{class:'tiles'},tile('Readings',l.length),tile('Avg heart rate',av('hr')),tile('Avg SpO₂',av('spo2')),tile('Avg stress',av('stress')),tile('Avg sleep',av('sleep')),tile('Biological age',p?p.pa.toFixed(1):'–')),l.length?el('div',{},el('h3',{style:'margin:16px 0 8px'},'Latest assessment'),...alertEls(assess(l.at(-1)))):'',el('p',{},'Earth-gazing sessions: '+g.length),el('button',{class:'btn pri',onclick:()=>print()},'Print or save as PDF')),'Generated on this device. Not a medical diagnosis.',1)},
trend(){const l=log();const sel=el('select',{},['hr','hrv','spo2','temp','sleep','stress'].map(x=>el('option',{},x))),out=el('div');const draw=()=>{const k=sel.value,v=l.filter(x=>x[k]!=null).map(x=>x[k]);if(v.length<5)return out.replaceChildren(el('p',{class:'note'},'Log at least 5 readings of this metric to forecast.'));const n=v.length,sx=n*(n-1)/2,sy=v.reduce((a,b)=>a+b,0),sxx=(n-1)*n*(2*n-1)/6,sxy=v.reduce((a,y,i)=>a+i*y,0),sl=(n*sxy-sx*sy)/(n*sxx-sx*sx),ic=(sy-sl*sx)/n,nx=sl*n+ic;out.replaceChildren(el('div',{class:'tiles'},tile('Latest',v.at(-1)),tile('Forecast next',nx.toFixed(1)),tile('Trend',sl>0.05?'Rising':sl<-0.05?'Falling':'Steady')),spark(v))};sel.onchange=draw;draw();return card('Forecast (linear regression on your data)',el('div',{},el('label',{},'Metric',sel),out),null,1)},
status(){const box=el('div');const chk=[['Server',()=>get('/api/health')],['NASA data',()=>get('/api/nasa/donki')],['ISS feed',()=>get('https://api.wheretheiss.at/v1/satellites/25544',8000)]];(async()=>{const rows=[];for(const[n,f]of chk){let ok=1;try{await f()}catch{ok=0}rows.push(el('tr',{},el('td',{},n),el('td',{},el('span',{class:'pill '+(ok?'ok':'bad')},ok?'Connected':'Unavailable'))))}rows.push(el('tr',{},el('td',{},'Offline mode'),el('td',{},el('span',{class:'pill '+(navigator.serviceWorker&&navigator.serviceWorker.controller?'ok':'')},navigator.serviceWorker&&navigator.serviceWorker.controller?'Ready':'Reload once to enable'))),el('tr',{},el('td',{},'Local storage'),el('td',{},el('span',{class:'pill ok'},log().length+' readings saved'))));box.replaceChildren(el('table',{},rows))})();return card('Connections',box,null,1)},
info(o){return card(null,el('div',{},o.items.map(([a,b])=>el('div',{style:'margin-bottom:14px'},el('h3',{style:'font-size:17px'},a),el('p',{style:'margin:4px 0 0;color:#c3d3e4'},b)))),null,1)}
};
/* ---------- shell ---------- */
async function health(pill){try{await get('/api/health',20000);pill.textContent='Server online';pill.className='pill ok'}catch{pill.textContent='Server offline';pill.className='pill bad'}}
function topbar(){const p=el('span',{class:'pill'},'Checking server…');health(p);return el('header',{class:'top'},el('a',{class:'brand',href:'index.html'},el('i'),'BRAHMAND GANGA'),el('nav',{},el('a',{href:'index.html#health'},'Health'),el('a',{href:'index.html#earth'},'Earth'),el('a',{href:'index.html#offline'},'Offline'),el('a',{href:'index.html#modules'},'All 30 modules')),p)}
function modCard(i){const m=M[i-1];return el('a',{class:'mc',href:'page'+i+'.html',target:'_blank',rel:'noopener'},el('b',{},m[0]),el('span',{},m[2]),el('small',{},m[1]))}
function home(){const root=document.body;
 const earth=el('div',{class:'earth',role:'img','aria-label':'Earth from space'});get('/api/nasa/epic',12000).then(d=>{if(d.images&&d.images[0])earth.style.backgroundImage='url('+d.images[0].url+')'}).catch(()=>{earth.style.background='radial-gradient(circle at 35% 30%,#8fe3f2,#1b6f9a 55%,#0a2a48)'});
 const grp=g=>M.map((_,i)=>i+1).filter(i=>M[i-1][1]===g);
 root.append(topbar(),
 el('section',{class:'hero'},earth,el('div',{class:'in'},el('p',{class:'tag'},'NASA Space Apps Challenge · Astronaut Health and Earth Intelligence'),el('h1',{},'BRAHMAND GANGA'),el('p',{class:'sub'},'Monitor human health. Explore our planet. Protect life beyond Earth.'),el('div',{class:'row'},el('a',{class:'btn pri',href:'page1.html',target:'_blank',rel:'noopener'},'Open Health Command Center'),el('a',{class:'btn',href:'page11.html',target:'_blank',rel:'noopener'},'Explore Earth and Space')))),
 el('div',{class:'strip'},el('span',{},'Live NASA data: EPIC, DONKI, MODIS, APOD, NeoWs'),el('span',{},'Works offline'),el('span',{},'Health data stays on your device'),el('span',{id:'hs'},'Checking health status…')),
 el('main',{class:'wrap'},
  el('section',{class:'sec'},el('h2',{},'Why Earth belongs in astronaut care'),el('p',{},'Health tools and Earth observation usually live in separate systems. BRAHMAND GANGA connects them: when stress rises, it suggests a calming view of home from space, then measures whether it helped.'),
   el('div',{class:'split'},el('div',{class:'big h',id:'health'},el('h3',{},'Astronaut Health Command Center'),el('ul',{},['Face mesh with 466 landmarks, camera-based','Biological age (PhenoAge) from blood markers','Brain MRI analysis module','Mental wellness and Earth-gazing therapy','Medical report OCR and AI analysis','Emergency alerts and flight surgeon escalation'].map(x=>el('li',{},x))),el('p',{},el('a',{href:'page1.html',target:'_blank',rel:'noopener'},'Open the command center'))),
   el('div',{class:'big e',id:'earth'},el('h3',{},'Earth Observation and Exploration'),el('ul',{},['Interactive Earth, Moon and Mars','NASA EPIC, MODIS and LRO data','Space radiation monitoring from NASA DONKI','Live ISS tracking and South Atlantic Anomaly awareness','Environmental intelligence from orbit'].map(x=>el('li',{},x))),el('p',{},el('a',{href:'page11.html',target:'_blank',rel:'noopener'},'Start exploring'))))),
  el('section',{class:'sec',id:'offline'},el('h2',{},'Offline health technology'),el('p',{},'Risk scoring, vitals logging and reports run on the device with no connection. Sensors connect over Bluetooth.'),el('div',{class:'cards'},grp(O).map(modCard))),
  el('section',{class:'sec',id:'modules'},el('h2',{},'All 30 modules'),...[H,E,P].flatMap(g=>[el('h3',{style:'margin:26px 0 12px'},g),el('div',{class:'cards'},grp(g).map(modCard))]))),
 el('footer',{class:'ft'},'BRAHMAND GANGA supports monitoring and is not a medical device. Consult a qualified clinician for medical decisions.'));
 get('/api/health').then(()=>$hs('Server online')).catch(()=>$hs('Server offline'));function $hs(t){const n=document.getElementById('hs');if(n)n.textContent=t}
 get('/api/nasa/donki').then(d=>{if(d.level==='high')$hs('Space weather: high radiation risk');else $hs('Space weather: '+d.level)}).catch(()=>{})}
function module(){const m=M[num-1];if(!m){location.replace('index.html');return}document.title=m[0]+' · BRAHMAND GANGA';
 const g=el('div',{class:'grid'});m[3].forEach(w=>{const[n,o]=Array.isArray(w)?w:[w,{}];g.append(W[n](o))});
 const pv=num>1?el('a',{class:'btn',href:'page'+(num-1)+'.html',target:'_blank',rel:'noopener'},'Previous: '+M[num-2][0]):el('span'),nx=num<30?el('a',{class:'btn',href:'page'+(num+1)+'.html',target:'_blank',rel:'noopener'},'Next: '+M[num][0]):el('span');
 document.body.append(topbar(),el('main',{class:'wrap'},el('p',{class:'note',style:'color:var(--saffron);margin:0 0 8px'},m[1]+' · Module '+num+' of 30'),el('h1',{style:'font-size:clamp(32px,5vw,56px);margin-bottom:10px'},m[0]),el('p',{class:'lead'},m[2]),g,el('div',{class:'pn'},pv,nx)),el('footer',{class:'ft'},'BRAHMAND GANGA supports monitoring and is not a medical device.'))}
/* queued alerts retry */
addEventListener('online',async()=>{const q=store.get('bg_queue',[]);if(!q.length)return;const rest=[];for(const p of q){try{const r=await fetch(API+'/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw 0}catch{rest.push(p)}}store.set('bg_queue',rest)});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
page==='home'?home():module();
