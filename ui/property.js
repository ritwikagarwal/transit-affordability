import {$,escapeHTML as esc} from './dom.js';
import {sourceButtons} from './evidence.js';
import {tenScreening} from './ten.js';

const value = (number,suffix='') => number===null||number===undefined?'Not recorded':Number(number).toLocaleString('en-US')+suffix;

export function renderProperty(record,{network,thermalEvidence=[]}) {
  const isLift=record.featureType==='lift';
  const rows=isLift?[
    ['Published project stage',record.stage],
    ['Published total-unit estimate',record.homesLabel||'Not recorded'],
    ['Lead agency',record.leadAgency||'Not recorded'],
    ['Point location','Project location, not a parcel boundary'],
  ]:[
    ['Recorded land use',record.label],
    ['BBL',record.bbl],
    ['Zoning district',record.zoning||'Not recorded'],
    ['Recorded residential units',value(record.unitsResidential)],
    ['Year built',value(record.yearBuilt)],
    ['Lot area',value(record.lotAreaSqFt,' sq ft')],
    ['Building floor area',value(record.buildingAreaSqFt,' sq ft')],
    ['Built floor-area ratio',value(record.builtFAR)],
    ['Residential FAR reference',value(record.maxResidentialFAR)],
  ];
  $('#station-inspector').innerHTML=`<article class="inspector">
    <span class="section-kicker">${isLift?'NYC LIFT PROJECT':'NYC PLUTO TAX-LOT RECORD'}</span>
    <h2>${esc(isLift?record.title:record.address||record.bbl)}</h2>
    ${isLift?`<p class="fine-print">${esc(record.address||'')}</p>`:''}
    <dl class="data-status">${rows.map(([label,text])=>`<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>
    <div class="empty-data"><h3>${isLift?'A pipeline project, not completed housing.':'Land use is not a suitability assessment.'}</h3><p>${isLift?'The published units field is a total project estimate. It does not establish the affordable share. Stages and estimates can change.':'A vacant or parking classification does not establish development rights. A residential classification does not establish retrofit need. The FAR fields do not calculate a permitted housing yield.'}</p></div>
    <p class="fine-print">${isLift?'LIFT snapshot: 16 October 2026. Layer last edited 5 October 2026.':'PLUTO 26v2. Snapshot: 16 October 2026. Approximate tax-lot point. The parcel layer is a 400-record sample near 18 Av and Jefferson St.'}</p>
    <div class="property-links">${isLift?`<a href="${esc(record.featureUrl)}" target="_blank" rel="noopener">Original LIFT record ↗</a>`:`<a href="https://data.cityofnewyork.us/resource/64uk-42ks.json?bbl=${encodeURIComponent(record.bbl)}" target="_blank" rel="noopener">Original PLUTO record ↗</a>`}</div>
    ${!isLift?`<div class="property-links"><a href="https://zola.planning.nyc.gov/bbl/${encodeURIComponent(record.bbl)}" target="_blank" rel="noopener">Check this tax lot in NYC ZoLa ↗</a></div>`:''}
    <div class="inline-sources">${sourceButtons(isLift?['lift-map']:['pluto','zola'])}</div>
    <p class="fine-print">Ownership, current occupancy, environmental constraints, complete zoning rules, building systems and tenant protections still need investigation. No thermal capacity or project saving is assigned.</p>
    ${tenScreening({feature:record,network,evidence:thermalEvidence})}
  </article>`;
}
