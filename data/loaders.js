// All network requests for map datasets live here. These URLs can later point to
// an API that returns the same records. A failed request never becomes zero data.
async function documentFrom(url,fetcher){
  const response=await fetcher(url);
  if(!response.ok)throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  return response.json();
}

export async function loadNetwork({url='./data/network.json',fetcher=fetch}={}){
  const data=await documentFrom(url,fetcher);
  if(!data.provenance||!Array.isArray(data.stations)||!Array.isArray(data.routes)||!Array.isArray(data.segments))throw new TypeError('The transit dataset is incomplete.');
  return data;
}

export async function loadThermalEvidence({url='./data/thermal-evidence.json',fetcher=fetch}={}){
  const data=await documentFrom(url,fetcher);
  if(data.schemaVersion!==1||!Array.isArray(data.records)||!data.provenance)throw new TypeError('The thermal evidence register is incomplete.');
  for(const record of data.records){
    if(!record.stationId||!record.category||!['measured','documented'].includes(record.status)||!Array.isArray(record.sourceIds)||!record.sourceIds.length||!record.summary)throw new TypeError('A thermal evidence record lacks provenance or a qualified status.');
  }
  return data.records;
}

export async function loadSpatialData({parcelUrl='./data/parcels.json',liftUrl='./data/lift-sites.json',fetcher=fetch}={}){
  const [parcels,lift]=await Promise.all([documentFrom(parcelUrl,fetcher),documentFrom(liftUrl,fetcher)]);
  for(const [name,data] of [['PLUTO',parcels],['LIFT',lift]]){
    if(!data.provenance||!Array.isArray(data.records))throw new TypeError(`${name} data is incomplete.`);
    const ids=new Set();
    for(const record of data.records){
      if(!record.id||ids.has(record.id)||!Array.isArray(record.coordinates)||record.coordinates.length!==2||!record.coordinates.every(Number.isFinite))throw new TypeError(`${name} contains an invalid or duplicate map record.`);
      ids.add(record.id);
    }
  }
  return {parcels:parcels.records,liftSites:lift.records,parcelProvenance:parcels.provenance,liftProvenance:lift.provenance};
}
