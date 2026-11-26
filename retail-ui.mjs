import {latest,basePrice,baskets} from './retail.mjs';
const $=id=>document.getElementById('retail-'+id),t=JSON.parse($('labels').textContent);
const money=n=>new Intl.NumberFormat(document.documentElement.lang,{style:'currency',currency:'DOP'}).format(n);
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santo_Domingo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let list={};try{const saved=JSON.parse(localStorage.getItem('retail-list-v1')||'{}');for(const [k,v] of Object.entries(saved))if(/^\d{14}$/.test(k)&&Number.isSafeInteger(v)&&v>0&&v<=999)list[k]=v}catch{}
const save=()=>{try{localStorage.setItem('retail-list-v1',JSON.stringify(list))}catch{}};
function line(el,s){const p=document.createElement('p');p.style.cssText='margin:0;padding:12px;background:#f2f5ef;border-radius:8px;line-height:1.6';p.textContent=s;el.append(p);return p}
function button(el,s,fn){const b=document.createElement('button');b.type='button';b.textContent=s;b.style.cssText='font:inherit;padding:10px 14px;min-height:44px;max-width:100%;border:1px solid #43885e;border-radius:8px;background:#fff;color:#174b34;cursor:pointer';b.onclick=fn;el.append(b)}
try{
 const res=await fetch('/retail.json');if(!res.ok)throw Error('HTTP');const rows=await res.json();
 const current=latest(rows,today);
 for(const id of ['results','list','totals','history'])$(id).style.cssText='display:grid;gap:8px;overflow-wrap:anywhere';
 $('city').style.width='100%';$('offers').style.cssText='width:20px;height:20px;vertical-align:middle';
 for(const city of [...new Set(current.map(r=>r.city))].sort()){const o=document.createElement('option');o.value=o.textContent=city;$('city').append(o)}
 function render(){
 const local=current.filter(r=>!$('city').value||r.city===$('city').value);
 const q=$('query').value.trim().toLocaleLowerCase();
 const matches=local.filter(r=>(r.name.toLocaleLowerCase().includes(q)||r.gtin.includes(q))&&(!$('offers').checked||(Number.isSafeInteger(r.regularCents)&&r.regularCents>r.cents&&r.offerUntil>=today))).sort((a,b)=>a.cents-b.cents);
 for(const id of ['results','list','totals','history'])$(id).replaceChildren();
 $('status').hidden=rows.length>0;if(!matches.length)line($('results'),t[7]);
 for(const r of matches.slice(0,100)){
 const p=line($('results'),r.name+' · '+r.retailer+' · '+r.city+' · '+r.store+' · '+r.channel+' · '+money(r.cents/100)+' · '+t[10]+': '+money(basePrice(r))+'/'+r.unit+' · '+r.date+' ');
 const a=document.createElement('a');a.href=r.url;a.textContent=new URL(r.url).hostname;p.append(a);
 button(p,t[8],()=>{list[r.gtin]=Math.min(999,(list[r.gtin]||0)+1);save();render()});
 }
 for(const [id,n] of Object.entries(list)){const p=line($('list'),(rows.find(r=>r.gtin===id)?.name||id)+' × '+n+' ');button(p,t[9],()=>{if(n>1)list[id]--;else delete list[id];save();render()})}
 if(Object.keys(list).length)for(const b of baskets(local,list)){line($('totals'),b.store.join(' · ')+' · '+(b.cents===null?t[12]+': '+b.missing.length:money(b.cents/100)))}
 if(q)for(const r of rows.filter(r=>(r.name.toLocaleLowerCase().includes(q)||r.gtin.includes(q))&&(!$('city').value||r.city===$('city').value)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100))line($('history'),r.date+' · '+r.name+' · '+r.retailer+' · '+r.store+' · '+money(r.cents/100));
 }
 for(const id of ['city','query','offers'])$(id).addEventListener('input',render);render();
}catch{ $('status').hidden=false;$('status').textContent=t[7]; }
