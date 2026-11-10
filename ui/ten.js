import {nearestStation,assessTENReadiness} from '../analysis/ten-screening.js';
import {escapeHTML as esc} from './dom.js';
import {sourceButtons} from './evidence.js';

export function tenScreening({station,feature,network,evidence=[]}){
  const nearest=feature?nearestStation(feature.coordinates,network.stations):null;
  const anchor=nearest?.station||station;
  const assessment=assessTENReadiness({stationId:anchor.id,propertyId:feature?.id,evidence});
  const distance=nearest?`<div class="ten-distance"><span>Nearest mapped station</span><button data-station="${esc(anchor.id)}">${esc(anchor.name)} ↗</button><small>About ${Math.round(nearest.distanceM/10)*10} m straight-line. This is not a pipe route or a heat-availability result.</small></div>`:'';
  return `<section class="ten-screening">
    <div class="ten-heading"><h3>TEN screening</h3><span>${assessment.status==='ready-for-analysis'?'Inputs documented':'Data required'}</span></div>
    <p>Could this location connect to a shared thermal network? Check the evidence below before comparing performance.</p>
    ${distance}
    <details class="ten-inputs" open><summary>Inputs for a feasibility study</summary>
      ${assessment.requirements.map(requirement=>`<div><b>${esc(requirement.label)}</b><span>${requirement.available?'Evidence loaded':'Not loaded'}</span><small>${esc(requirement.description)}</small></div>`).join('')}
    </details>
    <details class="ten-components"><summary>How an ambient loop could connect</summary><ol><li>Source heat exchange</li><li>Loop pipes and circulation pumps</li><li>Compatible building heat pumps</li><li>Building heating and cooling systems</li></ol><p>A possible arrangement, not a site design. Subway air does not enter homes. A wall-mounted air-source unit cannot simply connect to a water loop.</p></details>
    <p class="fine-print">Distance alone does not determine efficiency. No thermal service area, feasible capacity or bill saving is assigned here.</p>
    <div class="inline-sources">${sourceButtons(['ten','district'])}</div>
    ${anchor.id==='640'?'<button id="station-lab-open" class="text-button">Inspect station components in Station Lab ↗</button>':''}
  </section>`;
}
