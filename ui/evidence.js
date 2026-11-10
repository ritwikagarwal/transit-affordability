import {sources} from '../data/evidence.js';
import {$,escapeHTML as esc} from './dom.js';

const labels = {field:'Field photographs',hvs:'HPD survey',library:'HPD proposal',
  vision:'Community report',yes:'City of Yes',access:'MTA report',j51:'J-51 R',
  bill:'Council legislation',district:'NYSERDA',paper:'Research paper',
  bunhill:'Bunhill, London',ten:'Thermal networks',fares:'Fair Fares',
  lift:'Block by Block',energy:'Energy affordability',gtfs:'MTA map data',
  boroughs:'NYC boundaries',colors:'MTA colors',pluto:'PLUTO source',
  'lift-map':'LIFT source',zola:'NYC ZoLa'};
const catalogue = new Map(sources.map(source => [source.id,source]));

export function sourceButtons(ids = []) {
  return ids.filter(id=>catalogue.has(id)).map(id =>
    `<button class="source-chip" data-source="${id}" title="${esc(catalogue.get(id).name)}">${esc(labels[id] || catalogue.get(id).name)} ↗</button>`
  ).join('');
}

export function showSources(ids = []) {
  const ordered = [...sources.filter(s=>ids.includes(s.id)), ...sources.filter(s=>!ids.includes(s.id))];
  $('#source-list').innerHTML = ordered.map(source => `
    <article class="source-item">
      <small>${esc(source.kind)}</small>
      <a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.name)} ↗</a>
      <p>${esc(source.note)}</p>
    </article>`).join('');
  $('#sources-dialog').showModal();
  $('#sources-dialog').scrollTop = 0;
}
