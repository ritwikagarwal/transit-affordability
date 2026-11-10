# Editing and extending the website

The website and Station Lab are independent applications. Keep each in its own folder under your Design Studio case folder. Open the website folder in VS Code and use the setup instructions in `START_HERE.md`. Run Station Lab from its own folder when you need the technical demonstration.

The website uses browser JavaScript modules. You can edit text, styles and data without installing a framework or running a build. Save your changes and refresh the local browser page.

## Where to make changes

| File or module | What belongs here |
| --- | --- |
| `data/story.js` | Chapter titles, body text, source references and map destinations |
| `data/news.js` | Opening headlines, publication dates, URLs, context and source qualifications |
| `data/evidence.js` | Source titles, URLs, dates, supported claims and limitations |
| `data/station-cases.js` | Curated station examples, status labels and evidence checks |
| `data/repository.js` | Validating and retrieving documentary planning records |
| `data/loaders.js` | Loading the network, spatial datasets and thermal evidence |
| `data/network.json` | MTA station locations, route geometry and data provenance |
| `data/thermal-evidence.json` | Measured or documented inputs for a future thermal study |
| `analysis/exploration-graph.js` | A deterministic distance tree over supplied coordinates |
| `analysis/ten-screening.js` | Nearest-station distance and evidence checks for a TEN study |
| `scene.js` | WebGL rendering, camera movements and map interaction |
| `ui/` | Reusable browser interface functions and components |
| `ui/news.js` | Rendering the opening headline cards |
| `ui/ten.js` | Rendering thermal evidence requirements and component explanations |
| `app.js` | Application startup and coordination of navigation, data and rendering |
| `model.js` | An isolated illustrative calculation, not connected to the public interface |
| `styles/` | Typography, page layout, interface colors and responsive behavior |
| `index.html` | Page structure, controls and dialogs |
| `assets/` | Local photographs, illustrations and icons |

Keep editorial copy in the data modules. Keep spatial calculations and evidence checks in `analysis/`. Keep WebGL drawing separate from the browser interface. These boundaries make it easier to replace the current data source or add new views later.

## Change the story

Each object in `story.js` is one chapter. The following example uses the existing New Utrecht station identifier:

```js
{
  short: 'New housing',
  label: '03 / NEW UTRECHT, BROOKLYN',
  title: 'Your chapter title',
  lead: 'A short introduction.',
  body: 'Your explanation of this example.',
  view: 'library',
  station: 'B19',
  note: 'Any limits the reader needs to understand.',
  refs: ['library', 'vision'],
  next: 'Look at existing homes',
}
```

`refs` contains source identifiers from `evidence.js`. It does not contain URLs. An optional `facts` array contains display values, descriptions and short qualifiers. Do not remove the year, population group or proposed status from a displayed statistic.

The existing camera views are `city`, `library`, `preserve`, `thermal` and `pilot`. A station must exist in `network.json`. New station examples can reuse a view. A new camera behavior needs a matching change in `scene.js`.

## Change the opening headlines

Each entry in `data/news.js` holds a short verified headline, outlet, publication date, URL and contextual explanation. `ui/news.js` renders the cards. The cards use text, not screenshots of articles.

You can edit the contextual explanation in your own words. Preserve quoted headline wording and the actual publication date. Check the linked page before replacing a headline. Retain qualifications about historical data, the market sample or the part of an energy bill being discussed. Keep supporting official sources in `evidence.js`.

## Change the growing connections

`analysis/exploration-graph.js` builds a minimum spanning tree between an anchor and selected nearby records using their supplied coordinates. The function accepts a distance limit and a maximum node count. `growthDelay` controls the order of the animation. It is measured in display seconds, not travel time or thermal response time.

Adjust the selection and display settings to change how many records appear. Retain the original record identifiers and coordinates. The diagram is a spatial sketch. Its branches do not determine walking access, pipe routing, development eligibility, thermal coverage or the best investment. It uses biological network research as visual inspiration rather than reproducing its adaptive model. See [Tero et al. (2010)](https://doi.org/10.1126/science.1177894).

## Add a station case

Add an entry in `station-cases.js` using its MTA parent-station identifier. Include a clear status, a concise description, source identifiers and checks that show what has been established. Mark missing measurements as missing. A station name or a photograph alone cannot establish a building condition or a viable energy project.

Use `repository.js` for documentary planning records and `loaders.js` for dataset requests. Keep any future data service behind these boundaries so the interface does not depend on one provider. Do not place private API keys in browser files.

## Add thermal evidence

The TEN screen is split between `analysis/ten-screening.js`, `data/thermal-evidence.json` and `ui/ten.js`. The evidence register starts empty. Its categories cover the station heat source, building demand, pipe connection, compatible systems, operating constraints and household benefit.

Each evidence record needs a station identifier, a category, a qualified status, source identifiers and a summary. Property-specific categories also need the relevant property identifier. Keep the measurement date, units, method and uncertainty with the source evidence. Review the loader and screening code before adding or extending a category.

The current result is either missing inputs or inputs ready for analysis. Neither state declares a feasible project. A nearest-station distance is geographic context. No heat capacity, service area, annual saving or housing yield is calculated by this screen.

## Replace illustrative information with research data

MTA, LIFT and PLUTO are real source snapshots. They remain separate from the isolated developer model. The TEN screen tracks evidence availability. No thermal scenario is attached to a map property. No measured station capacity, parcel eligibility, annual performance or household saving is inferred.

When adding a measured record, retain its source, date, location, units, method and uncertainty. Store measured values separately from scenario inputs. Keep a distinction between a proposed project, an approved project and a completed project.

Housing suitability will need parcel records and parcel-specific zoning review. A future energy model will need timed source measurements, building demand and a route for the pipes. Keep these datasets separate and connect them with stable identifiers. An empty field should remain unknown until evidence supports a value.

For current model assumptions and equations, see `docs/RESEARCH_AND_LIMITS.md`. Definitions and policy claims should continue to link to the underlying sources in the website.

## Subway colors and map updates

Subway line colors identify routes. Housing and energy overlays must use their own legend. Do not recolor a subway route to represent a housing opportunity or thermal result.

Update network records through `scripts/prepare-map.py` using the official source files. Review the resulting route colors, station membership and provenance. An official schedule snapshot does not establish live service, an accessible entrance or walking distance.

## Review a change

Run the existing project checks after changing data or calculations. Then review the local site at a wide and a narrow window size. Follow every story step. Select a few stations, check the source links and try the keyboard controls. Any new calculation should have a test for its physical or financial relationships.

Keep presenter guidance outside the website. You can use your own notes while leaving the public page focused on the story and map.

## Real map datasets

LIFT project points live in `data/lift-sites.json`. PLUTO samples live in `data/parcels.json`. Refresh them with `scripts/fetch-lift.py` and `scripts/fetch-parcels.py`. See their data notes before changing coverage. `data/loaders.js` owns these dataset requests. `ui/nearby.js` and `ui/property.js` control the paired property list and detail view. The parcel drawer links to the selected BBL in NYC ZoLa for further review.

`analysis/nearby-records.js` keeps both lists tied to distance from the selected station. A record's sampling station remains provenance. It does not control where that record can appear in a nearby search.
