import {planningLegend} from '../data/repository.js';
import {routeBadge} from './routes.js';
import {$,escapeHTML as esc} from './dom.js';
import {planningSymbol} from './planning-symbol.js';

export function renderMapKey(network) {
  const groups=[['1','2','3'],['4','5','6','6X'],['7','7X'],['A','C','E'],['B','D','F','FX','M'],['G'],['J','Z'],['L'],['N','Q','R','W'],['GS','FS','H','SI']];
  $('#route-key').innerHTML=groups.map(group=>`<div class="route-key-row">${group.map(id=>routeBadge(id,network.routes,true)).join('')}</div>`).join('');
  $('#planning-key').innerHTML=`<div class="planning-key-item"><span class="dataset-key lift-key">■</span> LIFT project point</div><div class="planning-key-item"><span class="dataset-key land-key">■</span> PLUTO vacant land / parking sample</div><div class="planning-key-item"><span class="dataset-key homes-key">●</span> PLUTO residential / mixed-use sample</div>`+planningLegend.map(item=>`<div class="planning-key-item">${planningSymbol(item.kind)}${esc(item.label)}</div>`).join('');
}
