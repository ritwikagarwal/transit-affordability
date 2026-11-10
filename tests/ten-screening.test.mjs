import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestStation,assessTENReadiness,tenRequirements} from '../analysis/ten-screening.js';

test('Station proximity cannot create thermal capacity or feasibility',()=>{
  const nearest=nearestStation([-74,40.7],[{id:'A',lon:-74,lat:40.7},{id:'B',lon:-73.9,lat:40.8}]);
  assert.equal(nearest.station.id,'A');assert.equal(nearest.distanceM,0);
  const assessment=assessTENReadiness({stationId:'A'});
  assert.equal(assessment.status,'data-required');assert.equal(assessment.feasible,null);assert.equal(assessment.heatCapacityKW,null);
});
test('Readiness needs evidence for the selected property and is not a feasibility approval',()=>{
  const evidence=tenRequirements.map(requirement=>({stationId:'A',propertyId:'parcel-1',category:requirement.id,status:'documented',sourceIds:['study'],summary:'A qualified source record.'}));
  const complete=assessTENReadiness({stationId:'A',propertyId:'parcel-1',evidence});
  assert.equal(complete.status,'ready-for-analysis');assert.equal(complete.feasible,null);assert.equal(complete.annualSavings,null);
  assert.equal(assessTENReadiness({stationId:'A',propertyId:'parcel-2',evidence}).status,'data-required');
  assert.equal(assessTENReadiness({stationId:'A',propertyId:'parcel-1',evidence:evidence.map(record=>({...record,sourceIds:[]}))}).status,'data-required');
});
