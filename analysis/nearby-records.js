// Approximate straight-line distance in the same local projection as the map.
// A source record's sampling station is provenance, not its proximity anchor.
// This function does not assess access, housing eligibility or thermal service.
export function recordsNearStation(station,records,radiusM=800){
  if(!station||![station.lon,station.lat].every(Number.isFinite))throw new TypeError('A station with finite longitude and latitude is required.');
  if(!Array.isArray(records))throw new TypeError('Records must be an array.');
  if(!Number.isFinite(radiusM)||radiusM<0)throw new RangeError('Study distance must be finite and nonnegative.');
  return records.map(record=>{
    if(!record||!Array.isArray(record.coordinates)||record.coordinates.length!==2||!record.coordinates.every(Number.isFinite))throw new TypeError('Each record needs finite longitude and latitude coordinates.');
    const distanceM=Math.hypot((record.coordinates[0]-station.lon)*84300,(record.coordinates[1]-station.lat)*111200);
    return {...record,distanceM};
  }).filter(record=>record.distanceM<=radiusM).sort((a,b)=>a.distanceM-b.distanceM||String(a.id).localeCompare(String(b.id)));
}
