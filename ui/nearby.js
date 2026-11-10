import {$,escapeHTML as esc} from './dom.js';
import {recordsNearStation} from '../analysis/nearby-records.js';

// A short property list provides the same selection as the map, including by keyboard.
export function renderNearby(station,spatial,radiusM=800){
  if(!spatial){$('#nearby-properties').innerHTML='<p class="fine-print">Housing map data is loading.</p>';return;}
  const lift=recordsNearStation(station,spatial.liftSites,radiusM);
  const lots=recordsNearStation(station,spatial.parcels,radiusM);
  const land=lots.filter(record=>[10,11].includes(record.landUse));
  const homes=lots.filter(record=>[1,2,3,4].includes(record.landUse));
  const cards=(items,type)=>items.map(record=>`<button class="property-card" data-feature="${esc(record.id)}"><small>${type==='lift'?'LIFT · '+esc(record.stage):esc(record.label)+' · PLUTO'}</small><b>${esc(record.title||record.address||record.bbl)}</b><span>${type==='lift'?'Published unit estimate: '+esc(record.homesLabel||'Not recorded'):'Residential units recorded: '+esc(record.unitsResidential??'Not recorded')}</span><i aria-hidden="true">↗</i></button>`).join('');
  $('#nearby-properties').innerHTML=`<p class="fine-print">Records near ${esc(station.name)}. Lists follow the study distance.</p>
    <details class="nearby-group" open><summary>LIFT projects within about ${radiusM.toLocaleString()} m <span>${lift.length}</span></summary>${lift.length?cards(lift,'lift'):'<p class="fine-print">No LIFT point is recorded within this straight-line search distance.</p>'}</details>
    <details class="nearby-group"><summary>Vacant land and parking sample <span>${land.length}</span></summary>${land.length?cards(land,'parcel'):'<p class="fine-print">No loaded parcel points fall within this study distance.</p>'}</details>
    <details class="nearby-group"><summary>Residential parcel sample <span>${homes.length}</span></summary>${homes.length?cards(homes,'parcel'):'<p class="fine-print">No loaded parcel points fall within this study distance.</p>'}</details>
    <p class="fine-print">Parcel coverage is a bounded sample near 18 Av D and Jefferson St. Distance is approximate and straight-line. These lists do not determine housing eligibility or retrofit need.</p>`;
}
