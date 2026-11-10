# TEN screening and the future decision tool

The website connects housing evidence with the inputs needed for a thermal-energy-network study. It does not make an engineering feasibility decision.

`analysis/ten-screening.js` separates two tasks:

1. Finding the nearest mapped station to a project or parcel point. This is geographic context only.
2. Checking whether sourced evidence has been loaded for a station and property. A complete register is marked ready for analysis. It is never marked feasible automatically.

The evidence register is `data/thermal-evidence.json`. It currently contains an empty records array. That is deliberate missing data. No station measurements or building-system surveys were supplied. The UI shows Data required and Not loaded.

Each future record needs stationId, category, status (measured or documented), sourceIds and a source-backed summary. Property-scoped categories also need propertyId. Source evidence should be registered in `data/evidence.js`. Categories are source, demand, route, equipment, operation and affordability. The interface does not derive capacity from record presence.

Station Lab remains independent. Its component and byproduct investigation can inform the future source register. A field photograph alone does not qualify a heat resource. A future importer should retain observations, calibration, time, location, units and uncertainty. It should distinguish measured input from design assumptions.

## A later performance comparison

A substantive decision tool will need timed source temperature and usable heat, receiving heating/cooling loads, compatible equipment performance, hydraulic design, pumping, pipe routing, controls, seasonal operation, backup and baseline systems. The financial stage can then compare costs, bills, emissions and distribution of benefits. Distance alone cannot determine efficiency or a service radius.

For the technical context, see [NYSERDA district energy strategies](https://www.nyserda.ny.gov/All-Programs/Higher-Education-Playbook/Decarbonization-Strategies/Electrification/District-Energy-Strategies). The component panel describes one ambient-loop arrangement. It is not a design for the selected site.

## Map distance

Nearest-station distance uses the haversine formula with mean Earth radius 6,371,008.8 m. The displayed distance is rounded to 10 m and is based on source point locations.

```text
a = sin²(Δlatitude/2)
  + cos(latitude1) cos(latitude2) sin²(Δlongitude/2)
d = 2 R atan2(sqrt(a), sqrt(1-a))
```

Angles are in radians. This is a straight-line great-circle distance between map points. It is not a walking route or proposed pipe length. It does not measure available heat or prove that a connection can be built.
