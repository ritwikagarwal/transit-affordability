# Planning evidence and future data connections

The site is a story and an evidence explorer. It does not make household, development, zoning, investment or engineering decisions.

## Where to edit

| File | Purpose |
| --- | --- |
| `data/content.js` | Story copy, case descriptions and the source catalogue. Source IDs are stable references. |
| `data/network.json` | Bundled transit stations, route membership and route geometry. Its metadata identifies the source snapshot. |
| `data/planning-records.json` | Versioned station-associated planning evidence. Edit this file to add a supported record. |
| `data/repository.js` | Data loading, record validation and planning-symbol definitions. Connect a future API here. |
| `app.js` | Page interaction and rendering of loaded information. |
| `scene.js` | WebGL camera, network rendering and map interaction. |
| `styles.css` | Typography, colors and page layout. |
| `tests/repository.test.mjs` | Evidence-schema, provenance and duplicate-count safeguards. |

Station Lab remains a separate application. No records are imported from it as measured station performance.

## Adapter contract

`loadPlanningRecords({url, fetcher})` loads the local JSON by default. It resolves to an array of validated records. It rejects failed requests, unsupported document versions, malformed records, duplicate IDs, broken record links and repeated project housing yields. Callers must show a loading error if it rejects. Do not replace a failed request with an empty inventory.

```js
import {
  loadPlanningRecords,
  recordsForStation,
  validatePlanningRecord,
  planningLegend,
} from './data/repository.js';

const records = await loadPlanningRecords();
const stationEvidence = recordsForStation(records, 'B19');

// A future endpoint must return the same envelope and validation contract.
const apiRecords = await loadPlanningRecords({url: '/api/planning-evidence'});

// A custom fetcher can add a supported local authentication or caching layer.
// Keep secrets on a server, outside browser source files.
```

`validatePlanningRecord(record)` returns `{valid, errors}`. It checks one record without changing it. `recordsForStation(records, stationId)` returns matching records without inventing missing data.

The JSON document contains `schemaVersion: 1`, an editorial `updatedAt` date in `YYYY-MM-DD` form, and `records`. The editorial update date does not mean each source was published on that date.

## Record fields

| Field | Meaning |
| --- | --- |
| `id` | Stable unique record identifier. |
| `stationId` | Parent-station ID from the bundled transit dataset. This associates evidence with a station. It is not a parcel boundary. |
| `kind` | `new-housing`, `reuse`, `rezoning`, `preservation`, `access` or `thermal-study`. |
| `evidenceStatus` | `documented-proposal`, `documented-requirement`, `documented-easement` or `field-context`. The status must be read alongside the kind. |
| `sourceIds` | Nonempty, distinct source IDs from the source catalogue. Each source must directly support the claim. |
| `title`, `summary` | Plain-language evidence and its limits. Rendering code must escape text. |
| `geometry` | `null` unless a sourced location or boundary has been verified. Supported future values are GeoJSON Point, Polygon or MultiPolygon using longitude, latitude. |
| `quantities` | `null` unless supported numeric evidence exists. The current schema permits only a proposed-home count. |
| `opportunityId` | Optional shared project ID for multiple records about the same physical opportunity. |
| `relatedRecordIds` | Optional IDs of related records. Linked records must exist and share `opportunityId`. |
| `geometrySourceIds` | Required for non-null geometry. IDs must also be in `sourceIds`. |

The New Utrecht project has three records: proposed housing, library and parking site redevelopment, and the RFP's rezoning assumption. They share `opportunityId: "new-utrecht-library"`. The proposed-home quantity appears once. Its comparison is `>` and its value is `200`. This means more than 200 proposed homes. It is neither an exact count of 200 nor completed housing. Count unique opportunities when reporting projects. Never sum map markers.

The `preservation` kind at Jefferson St is paired with `field-context`. It describes the subject of a discussion. It does not classify a building for preservation or retrofit. The thermal record at Brooklyn Bridge-City Hall is also field context. Its source list includes engineering guidance, which explains the study process and does not prove local heat capacity.

## Unknown values and map meaning

- `null` means no verified value is loaded. It must appear as “Not verified”, “Not measured” or similar language in the interface.
- A validated numerical `0` means a sourced zero. Do not use `value || 0`, which would merge unknown and zero.
- An empty station result `[]` means no planning evidence is loaded for that station. It does not mean no housing opportunity exists.
- A station marker identifies a station. It does not identify a parcel, zoning district or service area.
- Every current planning record has `geometry: null`. No parcel polygon is inferred from the station coordinates.
- Household savings, construction costs, carbon credits, recoverable heat and thermal service areas are absent. A generic thermal calculation must remain separate from local evidence records.

The planning legend exports different colors and marker shapes. These are project conventions. They are not official zoning colors or MTA route colors. A shape identifies a planning topic. It does not prove a site's suitability. MTA lines and route badges must keep the verified route coding from the transit data.

## Adding real data

1. Start with a source record containing a direct link, publication date, data date, licence and known limits. Keep those distinctions when building a future catalogue.
2. Add stable source and entity IDs. Retain the original agency parcel or building identifier alongside any future internal ID.
3. Add a documented schema field and validation before adding a new quantity. Units, measurement periods, uncertainty and provenance are required for future energy or finance modules.
4. Verify station associations and source references against the loaded catalogues. The included dataset-integrity tests cover the bundled records. A production endpoint should enforce these foreign keys on the server.
5. Load a verified parcel boundary only with a geometry source. The geometry validator checks structure and coordinate ranges. It does not establish legal boundaries, correct ownership, polygon topology or zoning eligibility.
6. Join parcels, zoning, station access and measured building demand through explicit IDs. Record the date of each join. Confirm current rules and source licences before a public deployment.
7. Keep alternatives and assumptions separate from evidence. Add reviewed engineering, financial and resident-protection modules before introducing rankings or recommendations.

The adapter is a starting boundary. A production tool will also need versioned migrations, source freshness rules, complete per-field provenance, server-side access control and independent validation of decisions.

## Current evidence

- New Utrecht proposal and redevelopment: [NYC HPD RFP announcement](https://www.nyc.gov/site/hpd/news/038-26/city-housing-agency-brooklyn-public-library-celebrate-milestone-new-utrecht-library-project) and [community visioning report](https://www.nyc.gov/assets/hpd/downloads/pdfs/services/new-utrecht-RFP-community-visioning-report.pdf).
- Zoning framework: [NYC Planning City of Yes](https://www.nyc.gov/content/planning/pages/our-work/plans/citywide/city-of-yes-housing-opportunity). Site-specific approval is not inferred.
- Union St easement: [MTA Zoning for Accessibility report](https://www.mta.info/document/125896), printed page 10. This is an easement for future access.
- Field contexts: the supplied Station Lab archive. The source catalogue identifies the copied photographs and their limits.
- Thermal study questions: [NYSERDA district energy guidance](https://www.nyserda.ny.gov/All-Programs/Higher-Education-Playbook/Decarbonization-Strategies/Electrification/District-Energy-Strategies).
