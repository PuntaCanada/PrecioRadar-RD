// Retail observations are separate from official market averages.
export function validGTIN(s){
 if(typeof s!=='string'||!/^\d{8}$|^\d{12,14}$/.test(s))return false;
 return [...s].reverse().reduce((n,d,i)=>n+Number(d)*(i%2?3:1),0)%10===0 && !/^0+$/.test(s);
}
export function normalize(rows,approved, today=new Date().toISOString().slice(0,10)){
 const out=new Map();
 for(const r of rows){
 const source=approved.find(s=>s.id===r.sourceId&&s.approved===true&&s.reuseEvidence&&s.retailer===r.retailer);
 if(!source)throw Error('Unapproved source');
 const u=new URL(r.url);if(u.protocol!=='https:'||u.hostname!==source.host)throw Error('Source mismatch');
 if(!validGTIN(r.gtin)||!r.name||!r.city||!r.store||!['online','store','member'].includes(r.channel)||!['kg','l','item'].includes(r.unit)||!Number.isFinite(r.quantity)||r.quantity<=0||!Number.isSafeInteger(r.cents)||r.cents<=0||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date||r.date>today)throw Error('Invalid observation');
 const key=JSON.stringify([r.gtin.padStart(14,'0'),r.retailer,r.city,r.store,r.channel,r.date]);
 const clean={...r,gtin:r.gtin.padStart(14,'0')};
 if(out.has(key)&&JSON.stringify(out.get(key))!==JSON.stringify(clean))throw Error('Conflicting observation');
 out.set(key,clean);
 }
 const items=[...out.values()];const packs=new Map();
 for(const r of items){const k=JSON.stringify([r.unit,r.quantity]);if(packs.has(r.gtin)&&packs.get(r.gtin)!==k)throw Error('Conflicting pack size');packs.set(r.gtin,k)}
 return items;
}
export const basePrice=r=>r.cents/100/r.quantity;
export function latest(rows,today,maxAge=2){
 const m=new Map();
 for(const r of rows){const age=(Date.parse(today)-Date.parse(r.date))/86400000;if(age<0||age>maxAge)continue;
 const k=JSON.stringify([r.gtin,r.retailer,r.city,r.store,r.channel]);if(!m.has(k)||m.get(k).date<r.date)m.set(k,r)}
 return [...m.values()];
}
export function baskets(rows,list){
 const stores=new Map();
 for(const r of rows){const k=JSON.stringify([r.retailer,r.city,r.store,r.channel]);if(!stores.has(k))stores.set(k,new Map());stores.get(k).set(r.gtin,r)}
 return [...stores].map(([store,items])=>{let cents=0,missing=[];for(const [gtin,n] of Object.entries(list)){if(!Number.isSafeInteger(n)||n<1||n>999)throw Error('Invalid quantity');if(!items.has(gtin))missing.push(gtin);else cents+=items.get(gtin).cents*n}return {store:JSON.parse(store),cents:missing.length?null:cents,missing}}).sort((a,b)=>(a.cents??Infinity)-(b.cents??Infinity));
}
