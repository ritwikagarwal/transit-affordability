import {planningLegend} from '../data/repository.js';

const paths={
  circle:'<circle cx="10" cy="10" r="7"/>',
  square:'<rect x="3" y="3" width="14" height="14"/>',
  diamond:'<path d="M10 2L18 10L10 18L2 10Z"/>',
  triangle:'<path d="M10 2L18 17H2Z"/>',
  cross:'<path d="M7 2H13V7H18V13H13V18H7V13H2V7H7Z"/>',
  hexagon:'<path d="M6 2H14L19 10L14 18H6L1 10Z"/>',
};

export function planningSymbol(kind){
  const item=planningLegend.find(entry=>entry.kind===kind);
  if(!item)return '';
  return `<span class="planning-symbol ${kind}" aria-hidden="true"><svg viewBox="0 0 20 20">${paths[item.shape]}</svg></span>`;
}
