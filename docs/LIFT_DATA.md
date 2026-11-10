# Official LIFT project points

The local map includes a dated copy of **120 published NYC LIFT housing pipeline projects**. These are source project points. They are not invented example sites, parcel boundaries, available-property listings, or estimates of buildable land.

The [official NYC LIFT page](https://www.nyc.gov/main/land-inventory-fast-track) links to the [LIFT StoryMap](https://storymaps.arcgis.com/stories/afce9e93d79847608fc846878e17db8e). The data was traced through that StoryMap to its published map and feature layer.

## Source chain

1. StoryMap item `afce9e93d79847608fc846878e17db8e`: [published item data](https://www.arcgis.com/sharing/rest/content/items/afce9e93d79847608fc846878e17db8e/data?f=json).
2. Its `LIFT Tracker Map` node references Web Map `70bd4dc0d246454d82e0784a8ab9c265`: [published map data](https://www.arcgis.com/sharing/rest/content/items/70bd4dc0d246454d82e0784a8ab9c265/data?f=json).
3. That map's `Housing Projects on City Land` layer references item `f4ab8860ae8849349bd7830557661450` and the [LIFT_Tracker feature service, layer 0](https://services6.arcgis.com/mMjXyrLYuBDkMYq4/arcgis/rest/services/LIFT_Tracker/FeatureServer/0).

The refresh script verifies these exact published references before downloading records. It never searches for a similarly named replacement layer.

## Snapshot

- Downloaded: **October 16, 2026, 06:42:22 UTC**.
- Source layer last edited: **October 5, 2026, 21:13:37.677 UTC**.
- Source records: **120**. Normalized local records: **120**.
- Records with supplied point coordinates: **120**.
- Geometry: longitude and latitude in EPSG:4326, requested from ArcGIS with `outSR=4326`.
- Local file: `data/lift-sites.json`.

The status counts below come directly from the snapshot's `StatusNew` field. They are not construction-completion counts.

| Published stage | Projects |
| --- | ---: |
| Developer Selected/Pre-Public Approval | 28 |
| Post Public Approval | 65 |
| Pre-Public Approval | 2 |
| Pre-RFP | 21 |
| RFP Active | 4 |
| Total | 120 |

## Fields and interpretation

| Local field | Published source or rule |
| --- | --- |
| `id` | Local key `lift-` followed by the source ObjectId |
| `sourceId` and `sourceIds` | Original ObjectId and the exact StoryMap, map and layer item IDs |
| `title` | `New_Name` |
| `coordinates` | Supplied ArcGIS point returned in longitude, latitude order; null if absent |
| `stage` | `StatusNew`, preserved as written |
| `homesLabel` | `UnitsTot`, preserved as written |
| `homes` | Integer parsed from `UnitsTot` only when the entire value is a plain integer with optional thousands separators; otherwise null |
| `address` | `Address`, or null |
| `leadAgency` | `Agency`, or null |
| `owner` | `OwnerName`, or null |
| `url` | Official StoryMap |
| `featureUrl` | Public query for this exact ObjectId and its original fields |
| `source` | NYC LIFT Tracker |
| `notes` | Interpretation limits and the original text when units are approximate |

`UnitsMapped` is a source map-symbol sizing field. It is not substituted for `UnitsTot`. Five records have ranges or approximations: `700+`, `250-400`, `1,000+`, `200-300`, and `~3,500`. Their numeric `homes` field remains null. The website can display their original `homesLabel` without inventing midpoints or exact totals.

Numeric source values are still published pipeline unit estimates. They are not delivered homes. The layer gives total project units. It does not give a separate affordable-unit count, affordability term, household income limit, or monthly rent. Do not label every unit as affordable based on this layer alone.

The [City's July 30 launch release](https://www.nyc.gov/mayors-office/news/2026/07/mayor-mamdani-launches-lift-tracker-to-build-affordable-housing-) describes a pipeline of over 100 sites and over 50,000 homes. That policy statement is separate from the current layer snapshot. The local code does not turn it into a count of completed homes.

## What this layer supports

It supports showing published housing projects beside the subway map. A visitor can inspect each project's name, address, published stage, lead agency and units estimate. Each record retains a link to its original source row.

It does not establish zoning rights, required rezoning actions, building condition, vacancy, title, development availability, parcel suitability, or thermal-network eligibility. A nearby subway point does not prove a walkable route or an accessible entrance. Those require separate source layers and checks.

The map's points are project locations. A project can span several properties. These points must not be drawn as precise parcel footprints or used to calculate buildable floor area.

The LIFT layer changes over time. Different official pages can refer to different project versions. For example, this snapshot gives Grand Concourse NYPL `114` units and 388 Hudson Street `279` units. Older narrative pages can give other figures. The local map displays this layer's published value with its snapshot date, rather than silently combining versions.

## Refresh locally

From the project folder, run:

```bash
python3 scripts/fetch-lift.py
```

Internet access is needed for refresh. The website can use the saved file offline. Python's standard library is sufficient.

The script checks the official source chain, required fields, point geometry, complete ObjectId list, duplicate IDs and returned coordinate system. It downloads all pages and verifies that every requested record was returned. It replaces the snapshot only after those checks pass. It stops for review if the source IDs or schema change.

After refreshing, read the dates and counts in `provenance` and inspect changed records. Source IDs are traceability keys for a snapshot. They are not guaranteed to remain stable if NYC republishes the service.

## Verification completed

The saved snapshot was checked for record-count agreement, unique IDs, valid geographic coordinates, matching stage counts, links to the original source rows, and correct parsing of integer and non-integer units text. No locations were geocoded. No parcel, zoning, affordability or heat-connection attributes were invented.
