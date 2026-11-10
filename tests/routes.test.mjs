import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {routePresentation, routeColorSource, routeSymbolSources, stationServiceNotice} from '../transit/routes.js';

const data = JSON.parse(await readFile(new URL('../data/network.json', import.meta.url), 'utf8'));

test('Every bundled route agrees with the current MTA color groups', () => {
  // Independent source fixture: https://data.ny.gov/resource/3uhz-sej2.json
  const groups = [
    ['A C E', '#0062CF'], ['B D F FX M', '#EB6800'], ['G', '#799534'],
    ['J Z', '#8E5C33'], ['L GS FS H', '#7C858C'], ['N Q R W', '#F6BC26'],
    ['1 2 3', '#D82233'], ['4 5 6 6X', '#009952'], ['7 7X', '#9A38A1'],
    ['SI', '#08179C'],
  ];
  const expected = new Map(groups.flatMap(([ids, color]) => ids.split(' ').map(id => [id, color])));
  assert.equal(data.routes.length, expected.size);
  for (const route of data.routes) {
    assert.equal(route.color, expected.get(route.id), `feed color for ${route.id}`);
    const badge = routePresentation(route.id, data.routes);
    assert.equal(badge.color, expected.get(route.id), `badge color for ${route.id}`);
    assert.equal(badge.textColor, 'NQRW'.includes(route.id) ? '#000000' : '#FFFFFF');
  }
  assert.equal(routeColorSource.url, 'https://www.mta.info/document/168976');
  assert.equal(routeColorSource.datasetApiUrl, 'https://data.ny.gov/resource/3uhz-sej2.json');
});

test('Express variants have the verified symbol and preserve their service IDs', () => {
  for (const [id, label] of [['6X', '6'], ['7X', '7'], ['FX', 'F']]) {
    const badge = routePresentation(id, data.routes);
    assert.equal(badge.id, id);
    assert.equal(badge.label, label);
    assert.equal(badge.shape, 'diamond');
    assert.match(badge.accessibleName, /express/i);
    assert.ok(routeSymbolSources[id].startsWith('https://www.mta.info/'));
  }
  for (const id of ['6', '7', 'F', 'A', 'D', 'Z', 'AX', '5X']) {
    assert.equal(routePresentation(id, data.routes).shape, 'circle', id);
  }
});

test('Shuttles are labelled S and remain distinguishable from each other and SIR', () => {
  const shuttles = ['GS', 'FS', 'H'].map(id => routePresentation(id, data.routes));
  assert.deepEqual(shuttles.map(s => s.label), ['S', 'S', 'S']);
  assert.equal(new Set(shuttles.map(s => s.id)).size, 3);
  assert.equal(new Set(shuttles.map(s => s.accessibleName)).size, 3);
  assert.match(shuttles[0].accessibleName, /42 St/);
  assert.match(shuttles[1].accessibleName, /Franklin/);
  assert.match(shuttles[2].accessibleName, /Rockaway/);
  const sir = routePresentation('SI', data.routes);
  assert.equal(sir.label, 'SIR');
  assert.equal(sir.color, '#08179C');
  assert.deepEqual(routePresentation('SIR', data.routes), sir);
});

test('Raw GTFS fields support future routes without inventing express symbols', () => {
  const raw = [{route_id: 'ZX', route_short_name: 'Z2', route_long_name: 'Future Express', route_color: '123abc', route_text_color: '010203'}];
  assert.deepEqual(routePresentation('zx', raw), {
    id: 'ZX', label: 'Z2', color: '#123ABC', textColor: '#010203',
    shape: 'circle', accessibleName: 'Z2, Future Express',
  });
  assert.equal(routePresentation('X', [{id: 'X', color: 'url(unsafe)'}]).color, '#7C858C');
  assert.equal(routePresentation(null).accessibleName, 'Unknown route');
});

test('All-feed station membership carries the scheduling caveat', () => {
  // Union St is a regression example: full-feed membership is not all-day service.
  const union = data.stations.find(s => s.name === 'Union St');
  assert.ok(union);
  assert.deepEqual(union.routes, ['D', 'N', 'R', 'W']);
  assert.match(stationServiceNotice, /every scheduled service/);
  assert.match(stationServiceNotice, /night or during rush hours/);
  assert.match(stationServiceNotice, /do not show current arrivals/);
});
