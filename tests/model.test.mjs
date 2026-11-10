import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {thermalBalance} from '../model.js';
import {chapters,cases,sources} from '../data/content.js';

test('Peak heat balance conserves energy and uses two pipe legs',()=>{
  const m=thermalBalance();
  assert.equal(m.pipeLossKW,1.8);
  assert.ok(Math.abs(m.heatKW-m.evaporatorKW-m.compressorKW)<1e-9);
  assert.ok(Math.abs(m.heatKW-664.2666666666667)<1e-8);
  assert.ok(m.systemCOP<4);
});
test('Study radius cannot change the physical heat balance',()=>{
  const a=thermalBalance({radiusM:100}),b=thermalBalance({radiusM:1000});
  assert.equal(a.heatKW,b.heatKW);assert.equal(a.floorAreaM2,b.floorAreaM2);
  assert.ok(Math.abs(b.studyAreaKM2/a.studyAreaKM2-100)<1e-9);
});
test('No source or exhausted source produces no heat and no fictitious COP',()=>{
  for(const m of [thermalBalance({sourceKW:0}),thermalBalance({sourceKW:10,oneWayM:2000,lossWPerM:20})]){
    assert.equal(m.heatKW,0);assert.equal(m.floorAreaM2,0);assert.equal(m.systemCOP,0);assert.equal(m.electricityKW,0);
  }
});
test('Nonphysical inputs are rejected',()=>{
  for(const input of [{cop:1},{cop:0},{sourceKW:-1},{demandWPerM2:0},{oneWayM:NaN},{pumpKW:-3}])assert.throws(()=>thermalBalance(input),RangeError);
});
test('Data integrity, case locations and citations',async()=>{
  const data=JSON.parse(await readFile(new URL('../data/network.json',import.meta.url),'utf8'));
  const stations=new Set(data.stations.map(s=>s.id)),routes=new Set(data.routes.map(s=>s.id)),refs=new Set(sources.map(s=>s.id));
  assert.equal(data.stations.length,stations.size);
  for(const s of data.stations){assert.ok(s.xy.every(Number.isFinite));for(const r of s.routes)assert.ok(routes.has(r));}
  for(const s of data.segments){assert.ok(routes.has(s[0]));assert.ok(s.slice(1).every(Number.isFinite));}
  for(const [id,c] of Object.entries(cases)){assert.ok(stations.has(id));for(const r of c.refs)assert.ok(refs.has(r));}
  for(const c of chapters){if(c.station)assert.ok(stations.has(c.station));for(const r of c.refs)assert.ok(refs.has(r));}
  assert.ok(chapters.every(c=>!Object.hasOwn(c,'duration')&&!Object.hasOwn(c,'notes')));
  assert.ok(data.stations.find(s=>s.id==='B19').routes.includes('D'));
  assert.ok(data.stations.find(s=>s.id==='640').name.includes('Brooklyn Bridge'));
});
