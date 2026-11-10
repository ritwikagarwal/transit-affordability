# Delivered verification

Checked 16 October 2026 for the revised local website.

## Passed

- The Python server runs on 127.0.0.1:4173 and serves the local website and bundled map data.
- All 36 Node tests pass. They cover official MTA colors and service symbols, data provenance and validation, exact LIFT unit labels, PLUTO sample integrity, nearby searches at neighboring stations, real-coordinate exploration trees, and TEN evidence readiness. Tests also cover the isolated developer heat model, which the public interface does not import.
- JSON files, Python syntax and all 28 JavaScript modules pass syntax checks.
- All six story chapters were reached through Next. Titles and chapter counts updated correctly. The final panel retained the separate Station Lab address, 127.0.0.1:5173.
- The opening displays three linked news headlines with dates, scope and historical-data qualifications.
- Station search, service filtering, planning filters, nearby project lists and property selection work. Reloading a saved property URL restores the selected record.
- Selecting 20 Av D finds nearby PLUTO points originally sampled around 18 Av. Sampling origin is preserved as provenance.
- The housing layers show 120 LIFT points, 72 vacant/parking sample records and 328 residential/mixed-use sample records.
- The study-distance slider updates the growing network and nearby lists. Growth can be replayed or disabled. Clicking checkbox label text changes the intended layer without selecting a map feature underneath.
- The map retains all bundled scheduled paths. Selected-station services draw above overlapping limited-service paths. A passing path does not imply a station stop.
- The map key contains 29 service buttons. Sources opens 25 cited entries.
- TEN panels retain unknown capacity and savings. They show the required source, demand, routing, equipment, operation and household-benefit evidence.
- Browser review at 1280 by 720 and 390 by 844 verified the desktop and stacked mobile layouts. The mobile document width matches the viewport. News cards scroll within their own row.
- No browser warnings or errors were reported in the final functional review.

## Limits

Interactive checks used the Codex in-app browser. Separate Chrome, Firefox, Safari and Edge installations were not tested. WebGL context loss and the Canvas fallback were not forced. Station Lab was not launched or modified. Sources are a dated research snapshot. Parcel points are a bounded sample, not a complete city inventory or parcel polygons. No housing eligibility, zoning approval, retrofit need, engineering feasibility, thermal service area or financial return was established.

The website runs without npm packages. Node is needed only for the optional server and development tests. Python is sufficient for presenting the website.
