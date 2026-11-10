/**
 * The presentation reads planning evidence through this boundary.
 * A future API adapter must return the same versioned document as the local JSON.
 * Transit route colors are separate from these project-defined planning symbols.
 */
export const planningLegend = Object.freeze([
  {kind:'new-housing', label:'Proposed new housing', color:'#43c9a0', shape:'circle'},
  {kind:'reuse', label:'Reuse or redevelopment', color:'#b6a0ef', shape:'square'},
  {kind:'preservation', label:'Existing-housing context', color:'#edbb68', shape:'diamond'},
  {kind:'access', label:'Station access evidence', color:'#81b7ee', shape:'triangle'},
  {kind:'thermal-study', label:'Thermal study context', color:'#f08c72', shape:'cross'},
  {kind:'rezoning', label:'Rezoning requirement', color:'#dca1ca', shape:'hexagon'},
].map(item=>Object.freeze({...item, convention:'Project-defined planning symbols. Not official zoning colors.'})));

const kinds = new Set(planningLegend.map(item=>item.kind));
const statuses = new Set(['documented-proposal','documented-requirement','documented-easement','field-context']);
const statusKinds = {
  'documented-proposal':new Set(['new-housing','reuse']),
  'documented-requirement':new Set(['rezoning']),
  'documented-easement':new Set(['access']),
  'field-context':new Set(['preservation','thermal-study']),
};
const required = ['id','stationId','kind','evidenceStatus','sourceIds','title','summary','geometry','quantities'];
const allowed = new Set([...required,'opportunityId','relatedRecordIds','geometrySourceIds']);
const plain = value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const nonempty = value=>typeof value==='string'&&value.trim().length>0;
const identifier = value=>typeof value==='string'&&/^[a-z0-9][a-z0-9-]*$/i.test(value);
const uniqueStrings = value=>Array.isArray(value)&&value.every(identifier)&&new Set(value).size===value.length;
const point = value=>Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)&&Math.abs(value[0])<=180&&Math.abs(value[1])<=90;
const ring = value=>Array.isArray(value)&&value.length>=4&&value.every(point)&&value[0][0]===value.at(-1)[0]&&value[0][1]===value.at(-1)[1];
const polygon = value=>Array.isArray(value)&&value.length>0&&value.every(ring);

function validGeometry(geometry){
  if(!plain(geometry)||Object.keys(geometry).some(key=>!['type','coordinates'].includes(key)))return false;
  if(geometry.type==='Point')return point(geometry.coordinates);
  if(geometry.type==='Polygon')return polygon(geometry.coordinates);
  if(geometry.type==='MultiPolygon')return Array.isArray(geometry.coordinates)&&geometry.coordinates.length>0&&geometry.coordinates.every(polygon);
  return false;
}

/** Return {valid, errors}. Does not modify a record or convert missing values to zero. */
export function validatePlanningRecord(record){
  const errors=[];
  if(!plain(record))return {valid:false,errors:['Record must be an object.']};
  for(const key of required)if(!Object.hasOwn(record,key))errors.push(`Missing required field: ${key}.`);
  for(const key of Object.keys(record))if(!allowed.has(key))errors.push(`Unsupported field: ${key}.`);
  for(const key of ['id','stationId'])if(!identifier(record[key]))errors.push(`${key} must be a nonempty identifier.`);
  if(!kinds.has(record.kind))errors.push('kind is not supported.');
  if(!statuses.has(record.evidenceStatus))errors.push('evidenceStatus is not supported.');
  else if(!statusKinds[record.evidenceStatus].has(record.kind))errors.push('evidenceStatus is not valid for this kind.');
  if(!uniqueStrings(record.sourceIds)||record.sourceIds.length===0)errors.push('sourceIds must contain at least one distinct source identifier.');
  for(const key of ['title','summary'])if(!nonempty(record[key]))errors.push(`${key} must be nonempty text.`);
  if(Object.hasOwn(record,'opportunityId')&&!identifier(record.opportunityId))errors.push('opportunityId must be a nonempty shared project identifier.');
  if(Object.hasOwn(record,'relatedRecordIds')){
    if(!uniqueStrings(record.relatedRecordIds))errors.push('relatedRecordIds must contain distinct record identifiers.');
    else if(record.relatedRecordIds.includes(record.id))errors.push('A record cannot relate to itself.');
  }
  if(record.geometry!==null){
    if(!validGeometry(record.geometry))errors.push('geometry must be null or a valid longitude/latitude GeoJSON Point, Polygon or MultiPolygon.');
    if(!uniqueStrings(record.geometrySourceIds)||record.geometrySourceIds.length===0)errors.push('A mapped site geometry requires geometrySourceIds.');
  }
  if(Object.hasOwn(record,'geometrySourceIds')){
    if(!uniqueStrings(record.geometrySourceIds))errors.push('geometrySourceIds must contain distinct source identifiers.');
    else if(!Array.isArray(record.sourceIds)||record.geometrySourceIds.some(id=>!record.sourceIds.includes(id)))errors.push('geometrySourceIds must also appear in sourceIds.');
    if(record.geometry===null&&Array.isArray(record.geometrySourceIds)&&record.geometrySourceIds.length>0)errors.push('Null geometry cannot have geometrySourceIds.');
  }
  if(record.quantities!==null){
    if(!plain(record.quantities)||Object.keys(record.quantities).length===0)errors.push('quantities must be null or contain supported evidence quantities.');
    else {
      for(const key of Object.keys(record.quantities))if(key!=='proposedHomes')errors.push(`Unsupported quantity: ${key}. Add a sourced schema extension before using it.`);
      if(Object.hasOwn(record.quantities,'proposedHomes')){
        const quantity=record.quantities.proposedHomes;
        if(record.kind!=='new-housing'||record.evidenceStatus!=='documented-proposal')errors.push('proposedHomes belongs only on a documented new-housing proposal.');
        if(!identifier(record.opportunityId))errors.push('A proposed housing quantity requires opportunityId to avoid counting the same project twice.');
        if(!plain(quantity)||Object.keys(quantity).some(key=>!['value','comparison','unit'].includes(key))||!Number.isInteger(quantity.value)||quantity.value<0||!['=','>','>='].includes(quantity.comparison)||quantity.unit!=='homes')errors.push('proposedHomes needs a nonnegative integer value, comparison (=, > or >=), and unit homes.');
      }
    }
  }
  return {valid:errors.length===0,errors};
}

/**
 * Load local JSON or a same-schema API response. Fail visibly on malformed evidence.
 * The caller owns error display. A request failure must never become an empty inventory.
 */
export async function loadPlanningRecords({url='./data/planning-records.json',fetcher=fetch}={}){
  if(typeof fetcher!=='function')throw new TypeError('fetcher must be a function.');
  const response=await fetcher(url);
  if(!response?.ok)throw new Error(`Planning evidence could not load${response?.status?` (HTTP ${response.status})`:''}.`);
  const document=await response.json();
  if(!plain(document)||document.schemaVersion!==1||!/^\d{4}-\d{2}-\d{2}$/.test(document.updatedAt)||!Array.isArray(document.records))throw new TypeError('Planning evidence requires schemaVersion 1, updatedAt (YYYY-MM-DD), and a records array.');
  const byId=new Map();
  for(const record of document.records){
    const result=validatePlanningRecord(record);
    if(!result.valid)throw new TypeError(`Invalid planning record ${record?.id??'(no id)'}: ${result.errors.join(' ')}`);
    if(byId.has(record.id))throw new TypeError(`Duplicate planning record id: ${record.id}.`);
    byId.set(record.id,record);
  }
  for(const record of document.records){
    for(const id of record.relatedRecordIds??[]){
      const related=byId.get(id);
      if(!related)throw new TypeError(`Missing related planning record: ${id}.`);
      if(!record.opportunityId||record.opportunityId!==related.opportunityId)throw new TypeError(`Related records must share opportunityId: ${record.id}, ${id}.`);
    }
  }
  // One project's housing yield appears once, even when it has several planning records.
  const yields=new Set();
  for(const record of document.records){
    if(record.quantities?.proposedHomes&&record.opportunityId){
      if(yields.has(record.opportunityId))throw new TypeError(`Duplicate proposed housing quantity for opportunity: ${record.opportunityId}.`);
      yields.add(record.opportunityId);
    }
  }
  return document.records;
}

/** [] means no loaded evidence for this station, not zero homes or zero usable heat. */
export function recordsForStation(records,stationId){
  if(!Array.isArray(records))throw new TypeError('records must be an array.');
  if(!identifier(stationId))throw new TypeError('stationId must be a nonempty identifier.');
  return records.filter(record=>record.stationId===stationId);
}
