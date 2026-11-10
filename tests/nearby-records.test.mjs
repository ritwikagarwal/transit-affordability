import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recordsNearStation} from '../analysis/nearby-records.js';

const network=JSON.parse(await readFile(new URL('../data/network.json',import.meta.url),'utf8'));
const parcels=JSON.parse(await readFile(new URL('../data/parcels.json',import.meta.url),'utf8')).records;

for(const [stationId,samplingStationId,nearCount,wideCount] of [
  ['B20','B19',9,193],
  ['L16','L15',34,192],
]){
  test(`${stationId} finds nearby source parcels at 300 and 800 metres without changing sampling provenance`,()=>{
    const station=network.stations.find(item=>item.id===stationId);
    const before=structuredClone(parcels);
    const near=recordsNearStation(station,parcels,300);
    const wide=recordsNearStation(station,parcels,800);
    // Regression against the bundled sample. Neither selected station was the
    // sampling origin, but both have nearby records that the map can display.
    assert.equal(near.length,nearCount);
    assert.equal(wide.length,wideCount);
    assert.ok(near.every(record=>wide.some(item=>item.id===record.id)));
    assert.ok(wide.every(record=>record.stationId===samplingStationId));
    assert.ok(wide.every(record=>record.stationId!==stationId));
    for(let index=0;index<wide.length;index++){
      assert.ok(wide[index].distanceM<=800);
      if(index)assert.ok(wide[index].distanceM>=wide[index-1].distanceM);
      const source=parcels.find(record=>record.id===wide[index].id);
      assert.deepEqual(wide[index].coordinates,source.coordinates);
      assert.equal(wide[index].distanceFromStationM,source.distanceFromStationM);
    }
    assert.deepEqual(parcels,before,'Filtering must not rewrite source distances or sampling station identifiers.');
  });
}

test('Study distance includes the boundary and filters supplied coordinates for any record type',()=>{
  const station={id:'selected',lon:0,lat:0};
  const records=[
    {id:'boundary',coordinates:[300/84300,0],stationId:'source-origin',homes:null},
    {id:'outside',coordinates:[301/84300,0],homes:0},
    {id:'anchor',coordinates:[0,0],homesLabel:'200–300'},
  ];
  const result=recordsNearStation(station,records,300);
  assert.deepEqual(result.map(record=>record.id),['anchor','boundary']);
  assert.equal(result[0].homesLabel,'200–300');
  assert.equal(result[1].homes,null);
  assert.equal(result[1].stationId,'source-origin');
  assert.deepEqual(recordsNearStation(station,records,0).map(record=>record.id),['anchor']);
  assert.deepEqual(recordsNearStation(station,[],800),[]);
});

test('Invalid spatial input cannot become an apparently empty nearby inventory',()=>{
  assert.throws(()=>recordsNearStation({lon:NaN,lat:0},[]),TypeError);
  assert.throws(()=>recordsNearStation({lon:0,lat:0},null),TypeError);
  for(const radiusM of [-1,Infinity,NaN])assert.throws(()=>recordsNearStation({lon:0,lat:0},[],radiusM),RangeError);
  assert.throws(()=>recordsNearStation({lon:0,lat:0},[{coordinates:[0,Infinity]}]),TypeError);
});
