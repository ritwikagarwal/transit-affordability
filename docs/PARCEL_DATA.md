# Real tax-lot context

The property markers come from the [NYC Department of City Planning PLUTO dataset](https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks/about_data). They describe tax lots. They do not identify approved housing projects, available land, buildings that need retrofit or verified thermal-network customers.

`data/parcels.json` is a bounded offline snapshot. It has two top-level sections: `provenance` and `records`. Open it to inspect the source version, download time, original field descriptions, all request URLs, request parameters and response fingerprints.

## Area and selection

The study areas are centered on the bundled MTA parent-station points for 18 Av on the D (`B19`) and Jefferson St on the L (`L15`). Each uses a rectangle extending approximately 500 metres east, west, north and south. Its corners are about 707 metres from the station. It is neither a walking catchment nor a thermal service area.

The query includes PLUTO land-use codes 1, 2, 3, 4, 10 and 11. It excludes other land uses. Within each study area it selects parking and vacant-land records first, then the nearest residential and mixed residential/commercial records up to a total cap of 200. The selection is designed to show useful context in a small local application. It is not a random sample or a complete neighborhood inventory.

The data's `provenance.studies` section separately reports:

- `sourceMatchingCount`: all source rows matching the area and land-use filter before sampling.
- `sourceCountsByLandUse`: those matching counts by official land-use code.
- `downloadedCount`: actual selected records, capped per station.
- `downloadedCountsByLandUse`: selected counts by code.
- `completeInventory`: whether the selected records exhaust the filtered source population.

The map must describe the selected count as a sample. A cap is not the number of properties in the neighborhood. The bundled records remain available offline. Source refresh is a separate explicit action.

## What the colors can describe

The [DCP PLUTO data dictionary](https://s-media.nyc.gov/agencies/dcp/assets/files/pdf/data-tools/bytes/pluto_datadictionary.pdf) defines these codes:

| `landUse` | Source label |
| --- | --- |
| 1 | One & Two Family Buildings |
| 2 | Multi-Family Walk-Up Buildings |
| 3 | Multi-Family Elevator Buildings |
| 4 | Mixed Residential & Commercial Buildings |
| 10 | Parking Facilities |
| 11 | Vacant Land |

These are descriptive source classifications. “Parking Facilities” does not mean an abandoned parking lot. “Vacant Land” does not establish availability, environmental safety or permission to build housing. Existing residential use does not establish affordability, condition or retrofit need. The supplied symbols may group land uses for display. They must remain separate from MTA route colors and any future verified planning-opportunity layer.

## Geometry

The original `longitude` and `latitude` fields describe the approximate location of a tax lot in WGS 84. Each record preserves that coordinate pair and says `geometryType: "approximate-point"`. These points are not surveyed parcel corners or building footprints. Do not turn their point markers into drawn parcel polygons or infer building height from them.

`distanceFromStationM` is an approximate local straight-line distance. It helps explain selection. It does not represent a walking route, accessible journey, pipe length or engineering design distance. A true parcel-boundary layer should use a separately sourced and reviewed polygon dataset.

## Field normalization and limits

The official dataset metadata provides the descriptions retained in `provenance.fieldDescriptions`.

| Local field | PLUTO source | Treatment |
| --- | --- | --- |
| `bbl` | `bbl` | Borough-block-lot identifier, preserved as a 10-digit string. For condominiums this can be a billing lot. |
| `address` | `address` | Source address, or `null` when absent. It does not verify a postal entrance. |
| `landUse`, `label` | `landuse` | Official code plus its dictionary label. |
| `buildingClass` | `bldgclass` | Source classification of the tax lot's major use. |
| `unitsResidential` | `unitsres` | Residential units across the tax lot. Source zero is preserved. It is not an affordable-unit count or current availability. |
| `yearBuilt` | `yearbuilt` | Zero or missing becomes `null`. DCP says the year is generally more reliable by decade than by exact year. |
| `zoning` | `zonedist1` | Primary zoning district only. Other districts, overlays and special controls are not assessed. |
| `builtFAR` | `builtfar` | The source ratio of building area to lot area. Zero or missing becomes `null` conservatively. It is an estimate. |
| `maxResidentialFAR` | `residfar` | The published standard-residence ratio. Source zero is preserved. It is not a complete zoning determination. |
| `lotAreaSqFt` | `lotarea` | Source lot area in square feet. Zero or missing becomes `null`. |
| `buildingAreaSqFt` | `bldgarea` | Source estimated building floor area. Zero or missing becomes `null`. Zero can mean unavailable or not applicable. |
| `sourceVersion` | `version` | PLUTO release version for that record. |

Floor area ratio (FAR) is building floor area divided by lot area. DCP states that PLUTO's built FAR uses rough source measurements. DCP also limits what `residfar` represents. Do not subtract built FAR from residential FAR and label the result developable housing. The source's primary district and standard-residence ratio omit controls that can change a real zoning determination. See the [official dataset field descriptions](https://data.cityofnewyork.us/api/views/64uk-42ks.json).

No owner-name field is downloaded. No rent, income, energy demand, thermal capacity, financial saving or construction yield is inferred. No additional affordable-home count is attached to these tax-lot points. The separately documented New Utrecht proposal remains one planning opportunity even when other tax lots appear nearby.

## Reproduce or refresh

From the project folder, use:

```bash
python3 scripts/fetch-parcels.py
```

The script uses Python's standard library. An internet connection is required only for refresh. It verifies the source schema, queries full matching counts, fetches bounded records, normalizes missing values and checks for duplicate identifiers. It compares source-update metadata before and after the download. A source change or failed request stops the refresh before replacing the existing snapshot.

To save a separate snapshot for review:

```bash
python3 scripts/fetch-parcels.py --output /absolute/path/parcels-review.json
```

The upstream service is mutable. A later refresh can change both counts and source versions. Preserve the existing file when comparing periods. The stored response fingerprints identify the exact downloaded responses. The bundled file is a descriptive demonstration dataset. It needs source freshness checks, broader coverage and reviewed joins before use in decisions.
