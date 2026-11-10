/**
 * Route badges are presentation data, separate from scheduled service data.
 *
 * Colors were checked against the MTA's current published HEX palette and the
 * bundled GTFS routes.txt on 2026-10-16. Do not substitute the older legacy
 * palette. The yellow routes use black lettering, as the MTA specifies.
 */
export const routeColorSource = Object.freeze({
  title: 'MTA Brand Colors / Subway, SIR & ADA',
  url: 'https://www.mta.info/document/168976',
  datasetUrl: 'https://data.ny.gov/Transportation/MTA-Colors/3uhz-sej2',
  datasetApiUrl: 'https://data.ny.gov/resource/3uhz-sej2.json',
  verifiedOn: '2026-10-16',
  fields: 'GTFS route_color and route_text_color',
});

/**
 * An X in a GTFS route ID is not a general instruction to draw a diamond.
 * These are the explicit services verified in the official MTA timetables.
 * MTA's Brooklyn Express flyer also documents the diamond F symbol.
 */
export const routeSymbolSources = Object.freeze({
  '6X': 'https://www.mta.info/schedules/subway/6-train',
  '7X': 'https://www.mta.info/schedules/subway/7-train',
  FX: 'https://www.mta.info/document/10221',
});

export const stationServiceNotice = 'Routes shown include every scheduled service in the bundled MTA feed. Some run only at night or during rush hours. They do not show current arrivals or service changes.';

const COLORS = Object.freeze({
  blue: '#0062CF', orange: '#EB6800', lightGreen: '#799534',
  brown: '#8E5C33', grey: '#7C858C', yellow: '#F6BC26',
  red: '#D82233', green: '#009952', purple: '#9A38A1',
  sir: '#08179C',
});

const ROUTES = Object.freeze({
  A: ['A', 'blue', '8 Avenue Express'],
  C: ['C', 'blue', '8 Avenue Local'],
  E: ['E', 'blue', '8 Avenue Local'],
  B: ['B', 'orange', '6 Avenue Express'],
  D: ['D', 'orange', '6 Avenue Express'],
  F: ['F', 'orange', 'Queens Blvd Express/6 Av Local'],
  FX: ['F', 'orange', 'Brooklyn F Express', 'diamond'],
  M: ['M', 'orange', 'Queens Blvd Local/6 Av Local'],
  G: ['G', 'lightGreen', 'Brooklyn-Queens Crosstown'],
  J: ['J', 'brown', 'Nassau St Local'],
  Z: ['Z', 'brown', 'Nassau St Express'],
  L: ['L', 'grey', '14 St-Canarsie Local'],
  N: ['N', 'yellow', 'Broadway Local'],
  Q: ['Q', 'yellow', 'Broadway Express'],
  R: ['R', 'yellow', 'Broadway Local'],
  W: ['W', 'yellow', 'Broadway Local'],
  GS: ['S', 'grey', '42 St Shuttle'],
  FS: ['S', 'grey', 'Franklin Avenue Shuttle'],
  H: ['S', 'grey', 'Rockaway Park Shuttle'],
  '1': ['1', 'red', 'Broadway - 7 Avenue Local'],
  '2': ['2', 'red', '7 Avenue Express'],
  '3': ['3', 'red', '7 Avenue Express'],
  '4': ['4', 'green', 'Lexington Avenue Express'],
  '5': ['5', 'green', 'Lexington Avenue Express'],
  '6': ['6', 'green', 'Lexington Avenue Local'],
  '6X': ['6', 'green', 'Pelham Bay Park Express', 'diamond'],
  '7': ['7', 'purple', 'Flushing Local'],
  '7X': ['7', 'purple', 'Flushing Express', 'diamond'],
  SI: ['SIR', 'sir', 'Staten Island Railway'],
});

function normalizeColor(value) {
  const hex = String(value ?? '').replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

/**
 * Return a route badge model for the UI and WebGL scene.
 *
 * Input can use the compact network.json fields (id, name, longName, color)
 * or raw GTFS routes.txt fields. The ID remains separate from its printed
 * label: 6X prints 6 in a diamond, while the three S shuttles retain distinct
 * IDs and accessible names. SIR is accepted as an alias for GTFS ID SI.
 * Unknown routes retain valid feed colors and never acquire a diamond by
 * guessing from their ID or from the word "Express" in their name.
 *
 * This function describes a service. It does not assert when that service
 * stops at any station. See stationServiceNotice for the feed's scope.
 */
export function routePresentation(routeId, routesArray = []) {
  let id = String(routeId ?? '').trim().toUpperCase();
  if (id === 'SIR') id = 'SI';
  const route = routesArray.find(r => String(r.id ?? r.route_id).toUpperCase() === id) ?? {};
  const known = ROUTES[id];
  const label = known?.[0] ?? String(route.name ?? route.route_short_name ?? (id || '?'));
  const color = known ? COLORS[known[1]] : normalizeColor(route.color ?? route.route_color) ?? COLORS.grey;
  const textColor = known ? (known[1] === 'yellow' ? '#000000' : '#FFFFFF')
    : normalizeColor(route.textColor ?? route.route_text_color) ?? '#FFFFFF';
  const shape = known?.[3] ?? 'circle';
  const longName = route.longName ?? route.route_long_name ?? known?.[2] ?? '';
  const spokenLabel = shape === 'diamond' ? `${label} express` : label;
  const accessibleName = longName ? `${spokenLabel}, ${longName}` : id ? spokenLabel : 'Unknown route';
  return {id, label, color, textColor, shape, accessibleName};
}
