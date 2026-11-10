import {config} from '../config.js';
import {$} from './dom.js';

export function showStationLab() {
  $('#lab-url').value = config.stationLabUrl;
  $('#handoff-dialog').showModal();
}

export function openStationLab() {
  try {
    const url = new URL($('#lab-url').value);
    if (!['http:','https:'].includes(url.protocol)) throw new Error();
    window.open(url.href,'_blank','noopener');
    $('#lab-status').textContent = 'Opened the 3D station model in a new tab.';
  } catch {
    $('#lab-status').textContent = 'Enter a valid http:// or https:// address.';
  }
}
