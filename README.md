# Transit / Housing

An editable local WebGL website about housing and energy affordability around New York subway stations.

Read [START_HERE.md](START_HERE.md) to run it. Use `python3 run.py`, then open http://127.0.0.1:4173. Node 18+ is an optional alternative with `npm start`.

The site runs on your computer through a server bound to `127.0.0.1`. It uses plain browser JavaScript modules. It has no framework, build step, external CDN, map key or package dependencies. the repository root contains the editable source. Save a change and refresh the browser.

## Included

- A manually navigated story with map camera movements and growing spatial connections.
- Selected news headlines with publication dates, context and links to the original coverage.
- Current MTA route colors and verified express symbols.
- Station search and service filtering with schedule-snapshot qualifications.
- 120 real NYC LIFT project points, including published stages and unaltered unit estimates.
- 400 PLUTO 26v2 tax-lot records near 18 Av D and Jefferson St. This is a sample.
- A paired map and nearby-property list. Select a record in either view.
- Parcel facts and a link to the selected tax lot in NYC ZoLa.
- TEN evidence screening for selected stations and properties. Missing inputs remain visible.
- Cited planning evidence and field photographs.
- A final handoff to the separate Station Lab.

The public interface has no presenter notes or timer. The growing links use actual coordinates from the loaded project and tax-lot records. They form a distance-based research sketch. They do not represent pipe routes, a thermal service area or an eligibility assessment. The separate mathematical model remains an isolated developer module with tests. It is not connected to map records.

## Edit the components

| Path | Responsibility |
| --- | --- |
| `config.js` | Site title, author, Station Lab address and data URLs |
| `data/story.js` | Public chapter copy and map destinations |
| `data/news.js` | Verified headline text, publication dates, source links and context |
| `data/evidence.js` | Source catalogue and claim limits |
| `data/station-cases.js` | Context for the curated station examples |
| `data/planning-records.json` | Versioned, qualified documentary evidence |
| `data/repository.js` | Planning-record validation and access |
| `data/loaders.js` | Transit, LIFT and PLUTO data loading boundary |
| `data/network.json` | Bundled MTA geometry and feed provenance |
| `data/lift-sites.json` | Official LIFT project snapshot and provenance |
| `data/parcels.json` | PLUTO sample and inspectable source queries |
| `data/thermal-evidence.json` | Local thermal and building-system evidence register, initially empty |
| `transit/routes.js` | MTA palette, labels, circles, diamonds and accessible names |
| `analysis/nearby-records.js` | Coordinate-based proximity queries for both project and parcel lists |
| `analysis/exploration-graph.js` | Distance-based tree between supplied coordinates and growth order |
| `analysis/ten-screening.js` | Nearest-station distance and checks for documented study inputs |
| `scene.js` | WebGL geometry, perspective, camera, overlays and picking |
| `ui/story.js` | Chapter display |
| `ui/explorer.js` | Station evidence and service search |
| `ui/nearby.js` | Nearby project and property lists |
| `ui/property.js` | Selected project or parcel facts |
| `ui/news.js` | Opening headline cards |
| `ui/ten.js` | TEN evidence requirements and possible system components |
| `ui/evidence.js` | Source links and source dialog |
| `ui/map-key.js` | Transit and planning legend |
| `ui/handoff.js` | Independent Station Lab link |
| `ui/dom.js` | Shared markup utilities and dialog behavior |
| `app.js` | Application state and event coordination |
| `styles/` | Readable CSS files for tokens, layout, story, map, explorer and dialogs |
| `index.html` | Accessible page structure and local-file help |
| `scripts/` | Repeatable public-data downloads and map preparation |
| `tests/` | Route coding, evidence integrity and mathematical checks |

`data/content.js` keeps backward-compatible exports. Edit the focused modules it references.

## Data coverage

The MTA snapshot contains 496 GTFS parent-station records, including Staten Island Railway. These are not unique station complexes. Feed validity ends 31 October 2026. Membership includes services that may run only at certain times. It is not current service information.

LIFT was downloaded on 16 October 2026. The source layer was last edited on 5 October 2026. Projects are pipeline records, not completed homes. Published unit estimates do not establish an affordable-unit share.

PLUTO is version 26v2. Each of the two selected station areas contributes 200 records. All 72 parking and vacant-land records in those selected boxes are included, followed by nearby residential and mixed-use parcels. The rest of the local area and city are not covered by this sample. Coordinates are approximate points, not parcel boundaries.

Zoning, land use, year built and FAR values are source attributes. They do not determine housing eligibility, current building condition, retrofit need or a housing yield. No heat capacity, tenant bill saving or financial return is attached to a property.

The expanding pattern is inspired by biological network research. Its implementation is a deterministic minimum spanning tree over a selected set of nearby coordinates. It does not reproduce the adaptive biological model described by [Tero et al. (2010)](https://doi.org/10.1126/science.1177894). Link growth is an animation, not a physical timescale or evidence of an optimal real-world connection.

TEN screening asks whether source measurements, building demand, pipe routing, compatible equipment, operating constraints and household benefits have evidence. Even when every category has a record, the result means inputs are ready for analysis. It does not certify feasibility or calculate capacity, coverage, savings or housing yield.

For full source queries and refresh instructions, read [LIFT_DATA.md](docs/LIFT_DATA.md) and [PARCEL_DATA.md](docs/PARCEL_DATA.md).

## Review changes

Run `npm test` with Node 18 or newer. Review the browser at desktop and phone widths. Test the story, news links, growing connections, station selection, route filter, map key, property cards, TEN screening, sources and Station Lab handoff.

See [EDITING.md](docs/EDITING.md) and [DATA_ARCHITECTURE.md](docs/DATA_ARCHITECTURE.md) for extending the site with real inputs. A future backend can return the same validated record contract without changing story copy or the renderer.

This codebase is independent of the original Station Lab. The supplied archive and code were not edited.
