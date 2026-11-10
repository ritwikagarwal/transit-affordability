import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8').then(JSON.parse);

test('LIFT snapshot preserves exact published estimates and complete point inventory',async()=>{
  const {provenance,records}=await read('lift-sites');
  assert.equal(records.length,provenance.totalCount);
  assert.equal(records.length,new Set(records.map(record=>record.id)).size);
  assert.ok(records.every(record=>record.coordinates.length===2&&record.coordinates.every(Number.isFinite)));
  const approximate=records.filter(record=>record.homes===null);
  assert.equal(approximate.length,provenance.homesAsTextCount);
  assert.ok(approximate.every(record=>typeof record.homesLabel==='string'&&record.homesLabel.length>0));
  assert.ok(records.every(record=>record.stage&&record.featureUrl.startsWith(provenance.featureServiceUrl)));
});
test('PLUTO sample keeps source land use and distinguishes zero from missing data',async()=>{
  const {provenance,records}=await read('parcels');
  assert.equal(records.length,400);assert.equal(new Set(records.map(record=>record.bbl)).size,400);
  assert.equal(records.filter(record=>[10,11].includes(record.landUse)).length,72);
  assert.equal(records.filter(record=>[1,2,3,4].includes(record.landUse)).length,328);
  assert.ok(records.every(record=>record.sourceVersion===provenance.sourceVersion));
  assert.ok(records.every(record=>record.geometryType==='approximate-point'));
  assert.ok(records.every(record=>record.coordinates.every(Number.isFinite)));
  assert.ok(records.every(record=>record.yearBuilt===null||record.yearBuilt>0));
  assert.ok(records.some(record=>record.unitsResidential===0));
  assert.ok(records.some(record=>record.yearBuilt===null));
  assert.ok(records.every(record=>!Object.hasOwn(record,'housingEligible')&&!Object.hasOwn(record,'retrofitNeeded')));
});
