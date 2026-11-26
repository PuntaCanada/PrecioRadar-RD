import test from 'node:test';
import assert from 'node:assert/strict';
import {validGTIN,normalize,basePrice,latest,baskets} from '../retail.mjs';
const fixture={gtin:'4006381333931',name:'TEST ONLY',retailer:'Test',city:'Test',store:'Test',channel:'store',unit:'kg',quantity:0.5,cents:10000,date:'2026-11-25',url:'https://example.com/test',sourceId:'test'};
const approved=[{id:'test',retailer:'Test',host:'example.com',approved:true,reuseEvidence:'Synthetic test only'}];
test('GTIN checksum',()=>{assert.ok(validGTIN(fixture.gtin));assert.ok(!validGTIN('4006381333932'))});
test('approval and origin required',()=>{assert.throws(()=>normalize([fixture],[]));assert.throws(()=>normalize([{...fixture,url:'https://other.example/test'}],approved))});
test('normalized identity and unit price',()=>{const [r]=normalize([fixture],approved);assert.equal(r.gtin,'04006381333931');assert.equal(basePrice(r),200)});
test('invalid data and conflicting package',()=>{assert.throws(()=>normalize([{...fixture,cents:0}],approved));assert.throws(()=>normalize([fixture,{...fixture,date:'2026-11-24',quantity:2}],approved))});
test('stale records excluded',()=>{const rows=normalize([fixture],approved);assert.equal(latest(rows,'2026-11-26').length,1);assert.equal(latest(rows,'2026-11-29').length,0)});
test('incomplete baskets never win',()=>{const rows=normalize([fixture],approved);assert.equal(baskets(rows,{'04006381333931':2})[0].cents,20000);assert.equal(baskets(rows,{'00000000000001':1})[0].cents,null)});

import {mergeHistory} from '../import-retail.mjs';
test('historical dates retained and duplicate feed idempotent',()=>{const old=normalize([fixture],approved);const next={...fixture,date:'2026-11-26',cents:9000};const merged=mergeHistory(old,[next],approved,'2026-11-26');assert.equal(merged.length,2);assert.deepEqual(mergeHistory(merged,[next],approved,'2026-11-26'),merged)});
test('offer requires genuine reduction and valid end date',()=>{assert.throws(()=>mergeHistory([],[{...fixture,regularCents:9000,offerUntil:'2026-11-26'}],approved,'2026-11-26'));assert.throws(()=>mergeHistory([],[{...fixture,regularCents:12000,offerUntil:'2026-11-24'}],approved,'2026-11-26'));assert.equal(mergeHistory([],[{...fixture,regularCents:12000,offerUntil:'2026-11-26'}],approved,'2026-11-26').length,1)});
