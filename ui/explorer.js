import {cases} from '../data/station-cases.js';
import {recordsForStation} from '../data/repository.js';
import {stationServiceNotice} from '../transit/routes.js';
import {$,escapeHTML as esc} from './dom.js';
import {sourceButtons} from './evidence.js';
import {routeBadges} from './routes.js';
import {planningSymbol} from './planning-symbol.js';
import {tenScreening} from './ten.js';

const labels={'new-housing':'New housing',reuse:'Reuse',rezoning:'Rezoning',preservation:'Preservation',access:'Station access','thermal-study':'Thermal study'};

export function renderStation(station,network,records,kind='all',thermalEvidence=[]) {
  const context=cases[station.id];
  const linked=recordsForStation(records,station.id);
  const visible=kind==='all'?linked:linked.filter(record=>record.kind===kind);
  $('#station-inspector').innerHTML=`<article class="inspector">
    <span class="section-kicker">${esc(context?.kind||'Station record')}</span>
    <h2>${esc(station.name)}</h2>
    <span class="minor-label">Scheduled services in the bundled feed</span>
    ${routeBadges(station.routes,network.routes)}
    <details class="service-notice"><summary>About these service labels</summary><p>${esc(stationServiceNotice)}</p></details>
    <div class="planning-records">${visible.length?visible.map(record=>`
      <section class="planning-record"><div class="record-heading">${planningSymbol(record.kind)}<span>${esc(labels[record.kind])}</span><small>${esc(record.evidenceStatus.replaceAll('-',' '))}</small></div>
      <h3>${esc(record.title)}</h3><p>${esc(record.summary)}</p>
      <div class="inline-sources">${sourceButtons(record.sourceIds)}</div>
      </section>`).join(''):`<div class="empty-data"><h3>No ${kind==='all'?'planning':esc(labels[kind].toLowerCase())} record loaded.</h3><p>This is a gap in this dataset. It does not mean that no opportunity exists here.</p></div>`}</div>
    <dl class="data-status"><div><dt>Parcel boundaries</dt><dd>${linked.some(r=>r.geometry)?'See record':'Not loaded'}</dd></div><div><dt>Measured heat capacity</dt><dd>Not loaded</dd></div><div><dt>Project costs and savings</dt><dd>Not loaded</dd></div></dl>
    ${station.id==='640'?'<button class="text-button" id="station-lab-open">Open Station Lab ↗</button>':''}
    <p class="fine-print">Markers link evidence to a station. They are not parcel locations, zoning boundaries or a verified thermal service area.</p>
    ${tenScreening({station,network,evidence:thermalEvidence})}
  </article>`;
}

export function renderSearch(network,term,route='') {
  const query=term.trim().toLowerCase();
  if(!query){$('#search-results').innerHTML='';return;}
  const matches=network.stations.filter(station=>(!route||station.routes.includes(route))&&(
    station.name.toLowerCase().includes(query)||station.routes.some(id=>id.toLowerCase()===query)
  )).slice(0,40);
  $('#search-results').innerHTML=matches.length?matches.map(station=>`
    <button class="search-result" data-station="${esc(station.id)}"><span>${esc(station.name)}</span>${routeBadges(station.routes,network.routes)}</button>`).join(''):'<p>No matching station. Try another name or clear the route filter.</p>';
}

export function renderPlanningFilters(active='all') {
  $('#planning-filters').innerHTML=[['all','All records'],...Object.entries(labels)].map(([id,label])=>`
    <button data-planning="${id}" class="${active===id?'active':''}" aria-pressed="${active===id}">${label}</button>`).join('');
}

export function renderFeaturedStations(){
  $('#curated-list').innerHTML=[['B19','New Utrecht','HPD housing proposal'],['L15','Jefferson St','Existing housing context'],['R32','Union St','Future access easement'],['640','City Hall','Station field study']].map(([id,name,label])=>`
    <button data-station="${id}"><b>${name}</b><small>${label}</small><span>→</span></button>`).join('');
}
