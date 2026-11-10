// This module describes evidence readiness. It never infers usable heat from
// station proximity, building age, land use or a nominal heat-pump efficiency.
export const tenRequirements = Object.freeze([
  {id:'source',label:'Station heat source',scope:'station',description:'Temperature, recoverable heat and available hours.'},
  {id:'demand',label:'Building demand',scope:'property',description:'Heating, cooling and hot-water loads over time.'},
  {id:'route',label:'Pipe connection',scope:'property',description:'A viable route, length, ground conditions and pumping.'},
  {id:'equipment',label:'Compatible systems',scope:'property',description:'Heat exchangers, heat pumps, controls and building distribution.'},
  {id:'operation',label:'Operating constraints',scope:'station',description:'Transit operations, seasonal balance and backup arrangements.'},
  {id:'affordability',label:'Household benefit',scope:'property',description:'Costs, billing, affordability terms and allocation of savings.'},
]);

export function nearestStation(coordinates,stations){
  if(!Array.isArray(coordinates)||coordinates.length!==2||!coordinates.every(Number.isFinite))throw new TypeError('A valid longitude/latitude point is required.');
  let nearest=null;
  const radians=value=>value*Math.PI/180;
  for(const station of stations){
    const dLat=radians(station.lat-coordinates[1]),dLon=radians(station.lon-coordinates[0]);
    const a=Math.sin(dLat/2)**2+Math.cos(radians(coordinates[1]))*Math.cos(radians(station.lat))*Math.sin(dLon/2)**2;
    const distanceM=6371008.8*2*Math.atan2(Math.sqrt(Math.max(0,a)),Math.sqrt(Math.max(0,1-a)));
    if(!nearest||distanceM<nearest.distanceM)nearest={station,distanceM};
  }
  return nearest;
}

export function assessTENReadiness({stationId,propertyId=null,evidence=[]}){
  const requirements=tenRequirements.map(requirement=>{
    const matches=evidence.filter(record=>record.stationId===stationId&&record.category===requirement.id&&
      (requirement.scope==='station'||(propertyId&&record.propertyId===propertyId))&&
      ['measured','documented'].includes(record.status)&&Array.isArray(record.sourceIds)&&record.sourceIds.length>0&&typeof record.summary==='string'&&record.summary.length>0);
    return {...requirement,available:matches.length>0,records:matches};
  });
  const complete=requirements.every(requirement=>requirement.available);
  return {status:complete?'ready-for-analysis':'data-required',requirements,
    feasible:null,heatCapacityKW:null,annualSavings:null};
}
