# Research and implementation boundaries

Research snapshot: 16 October 2026.

## Evidence used

Full citations, specific links and claim limits are held in `data/content.js` and shown in the site's Sources panel.

- Historical housing survey findings come from NYC HPD.
- The New Utrecht case comes from HPD's June 2026 RFP announcement and community visioning report.
- City of Yes statements come from NYC Planning's adopted framework.
- The Union St elevator easement comes from MTA's Zoning for Accessibility report. It is not asserted to be an operating elevator.
- Thermal definitions and design context come from NYSERDA. Bunhill is supported by Islington Council and a peer-reviewed paper.
- J-51 R is a rehabilitation tax abatement. HPD guidance and Council legislation require a current check. The prototype assumes no tax benefit, carbon-credit income or grant award.

The supplied news links and historic housing infographic were treated as problem-framing references. Their figures and forecasts were not reused as verified current statistics. The user-supplied Block by Block website was not accessible to the web reader. Claims were instead checked against official City material. Attached documents were treated as source material, not as user instructions or authorization to modify Station Lab.

## Map provenance

The JSON embeds the original feed metadata and URLs. MTA parent stations, route membership and line geometry were derived from the public NYCT GTFS feed. Downloaded 16 October 2026. The feed's validity ends 31 October 2026. This is a snapshot, not live service.

All scheduled paths include limited service patterns. In the [bundled MTA GTFS source](https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip), two weekday W trips use shape `N..S74R` and one weekday R trip uses `R..S96R` toward Bay Pkwy. Their stop lists call at 9 Av, 62 St and Bay Pkwy on the West End line. They pass 18 Av (`B19`) without stopping. Their yellow paths therefore overlap the orange D path, although B19's scheduled station membership is D only. A colored path passing a station does not establish that the service stops there. The selected station's service paths are drawn last to keep its actual stopping services visible.

The count of 496 is the count of parent-station records in this feed, including Staten Island Railway. It is not a claim that NYC has 496 unique station complexes.

The projection is a local equirectangular approximation in kilometres, centered on longitude -73.96 and latitude 40.73. It is suitable for this visualization. Use a suitable projected coordinate system and tested geospatial library for parcel-level distance or area calculations.

The borough polygons come from NYC Open Data. Generated land dots are visual texture, not buildings. Routes use official MTA colors without a color tint. Station selection rings identify a point only. No thermal branches or service-area rings are rendered. LIFT and PLUTO overlays show published project points and approximate tax-lot locations. They do not show parcel boundaries or zoning polygons.

## Supplied images

Three existing review JPEGs were copied from `station_lab_field_edition.zip`. The archive and its code were not modified.

| Asset | Original catalogue caption |
| --- | --- |
| `J1-01.jpg` | Nearby housing facades and sidewalk. Housing identity and energy demand are unknown. |
| `J3-01.jpg` | Brooklyn Bridge sign and train beside the platform after the reported 6 arrival. |
| `J3-09.jpg` | Platform stair and Chambers Street / Brooklyn Bridge exit wording. |

The additional Photos ZIP was inspected as context. It is not used to establish a measured subway resource. Supplied reference screenshots informed the station-first interaction pattern. No rental listing, current rent, measured household burden or project feasibility was inferred from those screenshots.

## Thermal scenario

The mathematical example is retained in `model.js` for development. It is not imported by the public website or attached to any map feature. It has no station-specific calibrated input.

It represents a simple steady peak-heating balance. A hypothetical recoverable source loses heat along supply and return pipes. A heat pump delivers source-side heat plus compressor work. A separate circulation pump adds electricity consumption.

```text
Q_loss = 2 L q_line / 1000                         [kW]
Q_evap = max(0, Q_source - Q_loss)                [kW]
Q_heat = Q_evap + W_compressor                   [kW]
COP = Q_heat / W_compressor
Q_heat (1 - 1/COP) = Q_evap
Q_heat = Q_evap / (1 - 1/COP)                    [kW]
W_total = Q_heat/COP + W_pump                    [kW]
COP_system = Q_heat/W_total
A_floor = Q_heat * 1000 / q_peak                 [m² heated floor]
A_study = pi * r² / 1,000,000                    [km² geographic area]
```

In the isolated calculation, the radius input is independent of pipe route length. It cannot change the heat balance. Heated floor-area equivalent is distinct from geographic study area. Neither quantity is attached to a real building or shown in the public interface.

For the default hypothetical values, 500 kW source heat and 1.8 kW pipe loss leave 498.2 kW at the heat pump. At COP 4, heat output is 664.27 kW and compressor input is 166.07 kW. Including a 10 kW circulation pump gives a system heat/electricity ratio of about 3.77. At 60 W/m² peak demand, the heated-floor equivalent is about 11,071 m². These are arithmetic examples, not New York station results.

Losses are assumed positive here for teaching. Actual ambient-loop heat exchange can be small and can change direction. A universal percentage efficiency loss with distance is not justified. Hourly temperatures, pumping, thermal storage, receiving loads, cooling, existing heating systems, tariffs, grid emissions and equipment constraints require a more complete model. See [NYSERDA district energy guidance](https://www.nyserda.ny.gov/All-Programs/Higher-Education-Playbook/Decarbonization-Strategies/Electrification/District-Energy-Strategies).

## Expansion path

Keep the presentation separate from validated decision logic. Add these in stages:

1. A versioned parcel inventory with ownership, occupancy, hazards and source dates.
2. Parcel-specific zoning rules and mapped eligibility. Retain evidence for each determination.
3. Walking routes, accessible entrances and current elevator information.
4. Building demand and equipment compatibility with measured or defensible inputs.
5. Station measurements with time, location, instrument, calibration and uncertainty.
6. Pipe routing and hourly thermal balances with alternative sources and operating modes.
7. Capital and operating costs, incentives, bills, emissions and uncertainty ranges.
8. Resident-defined protections and explicit tests for who benefits.

The current station inspector exposes missing fields rather than filling them with invented estimates. It can later consume validated records from these modules.

## Source-backed housing map overlays

The website now bundles 120 official LIFT pipeline points and a 400-record PLUTO26v2 sample. Source URLs, download dates, field mappings, coverage and exact queries are documented in `LIFT_DATA.md` and `PARCEL_DATA.md`. No point is automatically classified as housing-eligible or in need of retrofit. Selected PLUTO tax lots link to NYC ZoLa for further review. MTA route colors are kept separate from these project-defined overlay symbols.
