# Run the website locally

Keep the website and Station Lab in separate folders. You can move this folder anywhere, including your Design Studio case folder. The code uses relative paths.

```text
Design Studio/
  CASE/
    transit-affordability/
    station-lab/
```

1. Open `transit-affordability` in Visual Studio Code.
2. Open **Terminal > New Terminal**.
3. Run `python3 run.py`.
4. Open **http://127.0.0.1:4173**.

Use Python 3.10 or newer. On Windows, use `py run.py` if needed. There are no Python packages to install. The optional Node 18+ command is `npm start`. No `npm install` is needed.

**Do not open `index.html` directly.** Browser restrictions prevent its modules and data from loading through a file URL. The page now explains this if you open it that way.

To open your browser automatically, run `python3 run.py --open`. On a Mac, you can also double-click `Start Website.command`. If macOS blocks a downloaded launcher, use the VS Code terminal command above.

Keep the terminal running while using the site. Press Control+C to stop it. If port 4173 is occupied, run `python3 run.py --port 4174` and open that address instead.

## Navigate

- Use **Next**, **Previous**, or the left and right arrow keys.
- Select a chapter in the bottom navigation to jump to it.
- The opening news cards link to selected reporting. Their dates and context distinguish historical survey data from current coverage.
- **Explore the map** opens the station and housing browser.
- Search for a station or service. Open **Study locations** for the curated examples.
- Open **Housing layers** to switch LIFT projects, the vacant/parking sample and the residential sample on or off.
- Select a map point or open **Browse nearby property records** for the matching list view.
- Growing branches reveal connections between the selected place and nearby source records. These are research connections, not walking paths or pipe routes.
- **TEN screening** shows the evidence needed to study a shared thermal connection. The nearest-station distance is straight-line context. It does not show available heat or a service area.
- **Map key** explains route symbols and project-defined planning symbols.
- **Sources** opens citations and data limits.

There are no presenter notes or timer in the website.

## Move to Station Lab

The final chapter opens a link to your separate Station Lab. Its supplied default address is **http://127.0.0.1:5173**.

Start Station Lab from its own folder using its original instructions. You can stop this website first and move to Station Lab. If you want the final button to open it immediately, run Station Lab in a second terminal before selecting the button. The two applications use different ports.

The website does not launch, import or modify Station Lab. Change its link in `config.js` if your port changes.

## Data and editing

The website includes real MTA geometry, 120 LIFT project points and 400 PLUTO sample tax-lot records. The snapshot is local and works offline. External citations and NYC ZoLa links need an internet connection.

The parcel sample covers selected areas near 18 Av D and Jefferson St. It is not a citywide parcel inventory or a suitability assessment.

The thermal evidence register starts empty. No feasible TEN capacity, household savings or housing yield is assigned to a mapped location. Animation does not add evidence to a record.

Edit chapter text in `data/story.js` and headline cards in `data/news.js`. See `docs/EDITING.md` for component changes. See `docs/DATA_ARCHITECTURE.md`, `docs/LIFT_DATA.md` and `docs/PARCEL_DATA.md` for data provenance and refresh instructions.
