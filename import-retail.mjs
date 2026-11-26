import {readFileSync,writeFileSync,renameSync} from 'node:fs';
import {normalize} from './retail.mjs';
import {pathToFileURL} from 'node:url';
export function mergeHistory(old,incoming,sources,today){
 for(const r of incoming){
  if(r.regularCents!==undefined||r.offerUntil!==undefined){
   if(!Number.isSafeInteger(r.regularCents)||r.regularCents<=r.cents||!/^\d{4}-\d{2}-\d{2}$/.test(r.offerUntil)||!Number.isFinite(Date.parse(r.offerUntil))||new Date(r.offerUntil).toISOString().slice(0,10)!==r.offerUntil||r.offerUntil<r.date)throw Error('Invalid offer');
  }
 }
 return normalize([...old,...incoming],sources,today);
}
export async function run(){
 const sources=JSON.parse(readFileSync('data/retail-sources.json','utf8'));
 const old=JSON.parse(readFileSync('data/retail.json','utf8'));
 const today=new Date().toISOString().slice(0,10);
 let incoming=[];
 for(const s of sources.filter(s=>s.approved===true)){
  if(!s.reuseEvidence||!s.feedUrl)throw Error('Missing authorization or feed');
  const u=new URL(s.feedUrl);if(u.protocol!=='https:'||u.hostname!==s.host||u.username||u.password)throw Error('Invalid feed origin');
  const res=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!res.ok)throw Error('Feed HTTP '+res.status);
  const reader=res.body.getReader();let size=0;const chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>10000000){await reader.cancel();throw Error('Feed too large')}chunks.push(value)}
  const rows=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!Array.isArray(rows)||!rows.length||rows.some(r=>r.sourceId!==s.id||r.retailer!==s.retailer))throw Error('Invalid feed records');
  incoming.push(...rows);
 }
 if(!incoming.length){console.log('No authorized feeds; existing data unchanged');return}
 const merged=mergeHistory(old,incoming,sources,today);
 const target='data/retail.json';const tmp=target+'.tmp';
 writeFileSync(tmp,JSON.stringify(merged,null,2)+'\n');renameSync(tmp,target);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
