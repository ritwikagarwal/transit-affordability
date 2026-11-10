import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sources} from '../data/content.js';
import {loadPlanningRecords,recordsForStation,validatePlanningRecord,planningLegend} from '../data/repository.js';

const file=JSON.parse(await readFile(new URL('../data/planning-records.json',import.meta.url),'utf8'));
const network=JSON.parse(await readFile(new URL('../data/network.json',import.meta.url),'utf8'));
const clone=value=>structuredClone(value);
const fetchDocument=document=>async()=>({ok:true,json:async()=>clone(document)});
const load=document=>loadPlanningRecords({fetcher:fetchDocument(document)});

test('Bundled planning evidence references actual stations and known sources',async()=>{
  const records=await load(file);
  const sourceIds=new Set(sources.map(source=>source.id));
  const stationIds=new Set(network.stations.map(station=>station.id));
  for(const record of records){
    assert.ok(stationIds.has(record.stationId),record.stationId);
    for(const id of record.sourceIds)assert.ok(sourceIds.has(id),id);
    assert.equal(record.geometry,null,'No verified parcel geometry has been loaded.');
  }
  const housing=records.filter(record=>record.quantities!==null);
  assert.equal(housing.length,1);
  assert.deepEqual(housing[0].quantities,{proposedHomes:{value:200,comparison:'>',unit:'homes'}});
});

test('A linked project has one housing yield and distinct evidence types',async()=>{
  const records=await load(file);
  const project=recordsForStation(records,'B19');
  assert.deepEqual(new Set(project.map(record=>record.kind)),new Set(['new-housing','reuse','rezoning']));
  assert.equal(new Set(project.map(record=>record.opportunityId)).size,1);
  assert.equal(project.filter(record=>record.quantities?.proposedHomes).length,1);
  for(const record of project)assert.equal(record.relatedRecordIds.length,2);
});

test('Unknown evidence stays null and no loaded evidence is distinct from zero',async()=>{
  const records=await load(file);
  assert.deepEqual(recordsForStation(records,'F27'),[]);
  assert.equal(recordsForStation(records,'L15')[0].evidenceStatus,'field-context');
  assert.equal(recordsForStation(records,'640')[0].quantities,null);
  assert.equal(recordsForStation(records,'R32')[0].evidenceStatus,'documented-easement');
  const zero=clone(recordsForStation(records,'B19')[0]);
  zero.quantities.proposedHomes={value:0,comparison:'=',unit:'homes'};
  assert.equal(validatePlanningRecord(zero).valid,true);
  assert.notDeepEqual(zero.quantities,null);
});

test('Failed requests and invalid evidence cannot silently become an empty inventory',async()=>{
  await assert.rejects(loadPlanningRecords({fetcher:async()=>({ok:false,status:503})}),/503/);
  await assert.rejects(loadPlanningRecords({fetcher:async()=>{throw new Error('Offline');}}),/Offline/);
  await assert.rejects(load({...file,schemaVersion:2}),/schemaVersion 1/);
  const unsupported=clone(file);
  unsupported.records[0].quantities.heatCapacityKW=500;
  await assert.rejects(load(unsupported),/Unsupported quantity: heatCapacityKW/);
  const sourceLess=clone(file);
  sourceLess.records[0].sourceIds=[];
  await assert.rejects(load(sourceLess),/sourceIds/);
});

test('Duplicate records, broken links and repeated project housing yields are rejected',async()=>{
  const duplicate=clone(file);
  duplicate.records.push(clone(duplicate.records[0]));
  await assert.rejects(load(duplicate),/Duplicate planning record id/);
  const broken=clone(file);
  broken.records[0].relatedRecordIds.push('missing');
  await assert.rejects(load(broken),/Missing related planning record/);
  const unrelated=clone(file);
  unrelated.records[1].opportunityId='different-site';
  await assert.rejects(load(unrelated),/share opportunityId/);
  const doubleYield=clone(file);
  doubleYield.records.push({...clone(doubleYield.records[0]),id:'second-copy'});
  await assert.rejects(load(doubleYield),/Duplicate proposed housing quantity/);
});

test('Geometry requires valid coordinates and a cited location source',()=>{
  const record=clone(file.records[0]);
  record.geometry={type:'Point',coordinates:[-73.9,40.7]};
  assert.equal(validatePlanningRecord(record).valid,false);
  record.geometrySourceIds=['library'];
  assert.equal(validatePlanningRecord(record).valid,true);
  record.geometry.coordinates=[40.7,-190];
  assert.equal(validatePlanningRecord(record).valid,false);
  record.geometry={type:'Polygon',coordinates:[[[-73.9,40.7],[-73.8,40.7],[-73.8,40.8],[-73.9,40.8]]]};
  assert.equal(validatePlanningRecord(record).valid,false,'Polygon rings must close.');
});

test('Planning classes and status cannot be confused with measured feasibility',()=>{
  for(const patch of [{kind:'approved-housing'},{evidenceStatus:'TEN-feasible'},{sourceIds:[]},{quantities:{}},{heatCapacityKW:500},{geometry:undefined},{geometrySourceIds:null},{opportunityId:undefined}]){
    assert.equal(validatePlanningRecord({...clone(file.records[0]),...patch}).valid,false,JSON.stringify(patch));
  }
  const context=clone(file.records.find(record=>record.stationId==='640'));
  context.quantities={proposedHomes:{value:12,comparison:'=',unit:'homes'}};
  assert.equal(validatePlanningRecord(context).valid,false);
  assert.equal(new Set(planningLegend.map(item=>item.shape)).size,6);
  assert.equal(new Set(planningLegend.map(item=>item.color)).size,6);
  assert.ok(planningLegend.every(item=>item.convention.includes('Not official zoning colors')));
});

test('Custom URL and fetcher use the same validated API contract',async()=>{
  let requested;
  const records=await loadPlanningRecords({url:'/api/planning-evidence',fetcher:async url=>{requested=url;return {ok:true,json:async()=>clone(file)};}});
  assert.equal(requested,'/api/planning-evidence');
  assert.equal(records.length,file.records.length);
  const empty=await load({...file,records:[]});
  assert.deepEqual(empty,[],'An explicitly empty valid source is allowed.');
});
