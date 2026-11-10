"""Build a compact local map from public MTA GTFS and NYC borough boundaries.

Run from the project folder after placing gtfs.zip and boroughs.geojson there.
This script uses Python's standard library only. It never runs downloaded code.
"""
import collections
import csv
import io
import json
import math
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
Z = zipfile.ZipFile(ROOT / 'gtfs.zip')

def rows(name):
    return list(csv.DictReader(io.StringIO(Z.read(name).decode('utf-8-sig'))))

def xy(lon, lat):
    return [round((float(lon) + 73.96) * 84.3, 4), round((float(lat) - 40.73) * 111.2, 4)]

routes = {r['route_id']: {'id': r['route_id'], 'name': r['route_short_name'], 'longName': r['route_long_name'],
          'color': '#' + (r['route_color'] or '999999')} for r in rows('routes.txt')}
trips = rows('trips.txt')
trip_route = {t['trip_id']: t['route_id'] for t in trips}
shape_route = {t['shape_id']: t['route_id'] for t in trips}
parents = {s['stop_id']: (s['parent_station'] or s['stop_id']) for s in rows('stops.txt')}
station_routes = collections.defaultdict(set)
for t in rows('stop_times.txt'):
    station_routes[parents[t['stop_id']]].add(trip_route[t['trip_id']])
stations = []
for s in rows('stops.txt'):
    if s['location_type'] == '1':
        stations.append({'id': s['stop_id'], 'name': s['stop_name'],
          'lon': float(s['stop_lon']), 'lat': float(s['stop_lat']),
          'xy': xy(s['stop_lon'], s['stop_lat']), 'routes': sorted(station_routes[s['stop_id']])})

shapes = collections.defaultdict(list)
for p in rows('shapes.txt'):
    shapes[p['shape_id']].append((int(p['shape_pt_sequence']), *xy(p['shape_pt_lon'], p['shape_pt_lat'])))
segments = []
seen = set()
for sid, pts in shapes.items():
    rid = shape_route.get(sid)
    if not rid:
        continue
    pts.sort()
    for a, b in zip(pts, pts[1:]):
        pa, pb = tuple(a[1:]), tuple(b[1:])
        if pa == pb:
            continue
        key = (rid, *sorted([pa, pb]))
        if key not in seen:
            seen.add(key)
            segments.append([rid, *pa, *pb])

def simplify(pts, epsilon=.022):
    if len(pts) < 3:
        return pts
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx-ax, by-ay
    d2 = dx*dx+dy*dy
    best, idx = 0, 0
    for i, (x, y) in enumerate(pts[1:-1], 1):
        t = max(0, min(1, ((x-ax)*dx+(y-ay)*dy)/d2)) if d2 else 0
        d = (x-ax-t*dx)**2+(y-ay-t*dy)**2
        if d > best:
            best, idx = d, i
    if best > epsilon**2:
        return simplify(pts[:idx+1], epsilon)[:-1]+simplify(pts[idx:], epsilon)
    return [pts[0], pts[-1]]

boroughs = []
land_points = []
geo = json.loads((ROOT / 'boroughs.geojson').read_text())
for f in geo['features']:
    geom = f['geometry']
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    rings = []
    for poly in polys:
        projected = [simplify([xy(*p[:2]) for p in ring]) for ring in poly]
        rings.extend(projected)
        outer = projected[0]
        if len(outer) < 4:
            continue
        # Scanlines include holes by the even/odd rule. Output land texture only.
        y = math.ceil(min(p[1] for p in outer)/.2)*.2
        ymax = max(p[1] for p in outer)
        while y < ymax:
            crosses = []
            for ring in projected:
                for a, b in zip(ring, ring[1:]):
                    if (a[1] > y) != (b[1] > y):
                        crosses.append(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))
            crosses.sort()
            for left, right in zip(crosses[::2], crosses[1::2]):
                x = math.ceil(left/.2)*.2
                while x < right:
                    land_points.append([round(x, 3), round(y, 3)])
                    x += .2
            y += .2
    props = f['properties']
    boroughs.append({'name': props.get('boro_name', props.get('boroname', 'NYC')), 'rings': rings})

info = rows('feed_info.txt')[0]
data = {'provenance': {'downloaded': '2026-10-16',
  'gtfs': 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip',
  'boroughs': 'https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne',
  'feed': info, 'projection': 'Local equirectangular, km; origin -73.96, 40.73. Rendering only.',
  'scope': 'GTFS parent stations, not unique station complexes. Includes Staten Island Railway.'},
  'stations': stations, 'routes': list(routes.values()), 'segments': segments,
  'boroughs': boroughs, 'landPoints': land_points}
out = ROOT / 'dist/data/network.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(data, separators=(',', ':')))
print(f'{len(stations)} GTFS parent stations, {len(segments)} route segments, {len(land_points)} land points; {out.stat().st_size:,} bytes')
