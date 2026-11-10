// Evidence catalogue. Each entry has a direct source URL.
export const sources = [
  {
    "id": "hvs",
    "name": "NYC HPD · 2023 Housing and Vacancy Survey",
    "kind": "Official survey · 2023 data",
    "url": "https://www.nyc.gov/assets/hpd/downloads/pdfs/about/2023-nychvs-selected-initial-findings.pdf",
    "note": "1.41% net rental vacancy. For renter households earning below $70,000, the median rent-to-income ratio was 54%. These are historical survey estimates. See rent burden and vacancy sections."
  },
  {
    "id": "lift",
    "name": "NYC · LIFT and Block by Block",
    "kind": "Official policy · July 2026",
    "url": "https://www.nyc.gov/mayors-office/news/2026/07/mayor-mamdani-launches-lift-tracker-to-build-affordable-housing-",
    "note": "A City-owned site pipeline and housing policy goals. Pipeline sites are not completed homes or automatically available development parcels."
  },
  {
    "id": "library",
    "name": "NYC HPD · New Utrecht Library RFP",
    "kind": "Documented opportunity · June 2026",
    "url": "https://www.nyc.gov/site/hpd/news/038-26/city-housing-agency-brooklyn-public-library-celebrate-milestone-new-utrecht-library-project",
    "note": "New library and more than 200 proposed homes, all affordable. Library plus adjacent municipal parking lot. One block from 18 Av on the D. RFP respondents must assume rezoning. Not a completed project."
  },
  {
    "id": "vision",
    "name": "HPD · New Utrecht community vision",
    "kind": "Community evidence · June 2026",
    "url": "https://www.nyc.gov/assets/hpd/downloads/pdfs/services/new-utrecht-RFP-community-visioning-report.pdf",
    "note": "Project background and community priorities for the library and housing site at 1743 86th Street."
  },
  {
    "id": "yes",
    "name": "NYC Planning · City of Yes",
    "kind": "Adopted zoning framework · December 2024",
    "url": "https://www.nyc.gov/content/planning/pages/our-work/plans/citywide/city-of-yes-housing-opportunity",
    "note": "Transit-oriented provisions apply to qualifying sites and mapped areas. Near a station does not mean eligible. Check zoning district, lot size, street frontage and applicable overlays. Separate rules support additional affordable housing in higher-density areas."
  },
  {
    "id": "access",
    "name": "MTA · Zoning for Accessibility report",
    "kind": "Official accessibility evidence",
    "url": "https://www.mta.info/document/125896",
    "note": "Printed p. 10 documents an easement at 204 4th Avenue for a future elevator and stairway to Union St southbound platform. An easement is not evidence of a working elevator."
  },
  {
    "id": "fares",
    "name": "NYC · Fair Fares",
    "kind": "Official commute affordability program",
    "url": "https://www.nyc.gov/site/fairfares/",
    "note": "Eligible low-income New Yorkers can receive a 50% discount on subway and eligible bus fares or Access-A-Ride trips. Check current eligibility."
  },
  {
    "id": "ten",
    "name": "NYSERDA · Thermal energy networks",
    "kind": "Official technical definition",
    "url": "https://www.nyserda.ny.gov/All-Programs/Clean-Energy-Communities/High-Impact-Actions/Toolkits/Thermal-Energy-Networks",
    "note": "Pipes connect multiple buildings and thermal sources and sinks to support heating, cooling and hot water."
  },
  {
    "id": "district",
    "name": "NYSERDA · District energy strategies",
    "kind": "Official engineering guidance",
    "url": "https://www.nyserda.ny.gov/All-Programs/Higher-Education-Playbook/Decarbonization-Strategies/Electrification/District-Energy-Strategies",
    "note": "Ambient loops connect building heat pumps with thermal sources. Thermal loss is not a universal function of distance. Temperature, pumping and system design matter. An air-source wall unit does not connect directly to a water loop."
  },
  {
    "id": "bunhill",
    "name": "Islington Council · Bunhill heat network",
    "kind": "Operating precedent · London",
    "url": "https://www.islington.gov.uk/environment-and-energy/energy/bunhill-heat-network",
    "note": "Bunhill uses a heat pump to recover Underground ventilation heat as one source in a wider heat network. This does not establish NYC feasibility."
  },
  {
    "id": "paper",
    "name": "Lagoeiro et al. · Underground heat recovery",
    "kind": "Peer reviewed · 2022",
    "url": "https://journals.sagepub.com/doi/10.1177/01436244221084913",
    "note": "Building Services Engineering Research and Technology. DOI 10.1177/01436244221084913. Describes the Bunhill system, including other generators and storage. NYC station capacities cannot be inferred from this precedent."
  },
  {
    "id": "j51",
    "name": "NYC HPD · J-51 R application guidance",
    "kind": "Policy check required · October 2026",
    "url": "https://www.nyc.gov/site/hpd/services-and-information/tax-incentives-J-51-reform.page",
    "note": "J-51 R is a rehabilitation property-tax abatement. Confirm the current application window and eligibility with HPD. It is not a carbon-credit program."
  },
  {
    "id": "bill",
    "name": "NYC Council · J-51 extension legislation",
    "kind": "Date-sensitive legislation",
    "url": "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=E4548646-30AC-40A4-9FB3-041B84F3C0A5&ID=8170174",
    "note": "Council passed Intro 1015-A on 24 September 2026. At research time, bill status and HPD application guidance were not aligned. No benefits are assumed in this prototype."
  },
  {
    "id": "energy",
    "name": "NYSERDA · Clean energy and affordability",
    "kind": "Official energy-burden definition",
    "url": "https://www.nyserda.ny.gov/Featured-Stories/Increasing-Access-to-Clean-Energy-and-Efficiency",
    "note": "Energy burden relates household energy spending to income. Efficiency and assistance programs address different parts of the problem."
  },
  {
    "id": "rent-coverage",
    "name": "Manhattan Borough President · PIX11 housing coverage",
    "kind": "Official reproduction of news coverage · August 2026",
    "url": "https://www.manhattanbp.nyc.gov/pix11-aug262026/",
    "note": "Reproduces the PIX11 headline, byline and August 26, 2026 publication date. Its Manhattan and Brooklyn rent figures come from Corcoran market reports. This is news coverage of a brokerage sample, not an official survey of all NYC rents or every existing lease."
  },
  {
    "id": "coned-rates",
    "name": "NYS Public Service Commission · Con Edison rate-plan approval",
    "kind": "Official regulatory decision summary · January 2026",
    "url": "https://dps.ny.gov/news/psc-dramatically-reduces-con-edisons-rate-request-nearly-90-percent",
    "note": "On January 22, 2026, the PSC adopted three-year electric and gas rate plans for 2026 to 2028. The approved plan reduced Con Edison's original request. Delivery-revenue increases and total-revenue increases are different measures. Household bill impacts depend on customer class and energy use."
  },
  {
    "id": "coned-bill",
    "name": "Con Edison · How to read your bill",
    "kind": "Official utility billing explanation",
    "url": "https://www.coned.com/en/accounts-billing/your-bill/how-to-read-your-bill",
    "note": "Bills contain supply, delivery and taxes. The PSC sets delivery rates. Actual bills vary with energy use, service classification, supply prices, weather and other factors. A delivery-rate change is not the same as the percentage change in a household's entire bill."
  },
  {
    "id": "organism-inspiration",
    "name": "Tero et al. · Rules for biologically inspired adaptive network design",
    "kind": "Peer reviewed · Science · January 22, 2010",
    "url": "https://doi.org/10.1126/science.1177894",
    "verificationUrl": "https://pubmed.ncbi.nlm.nih.gov/20093467/",
    "note": "Science 327(5964), pages 439 to 442. DOI 10.1126/science.1177894. Physarum networks were compared with the Tokyo rail network using transport efficiency, cost and fault tolerance. This supports the visual network inspiration. It does not validate NYC housing locations, thermal routes, or financial outcomes."
  },
  {
    "id": "gtfs",
    "name": "MTA NYCT · Static GTFS data",
    "kind": "Bundled network geometry · downloaded 16 Oct 2026",
    "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
    "note": "Parent-station coordinates and route shapes. Feed version 20260826-X-long-term-supplement-trip-ids. Valid through 31 October 2026. Not live train tracking, walking routes or an accessibility inventory. Parent stations are not unique complexes."
  },
  {
    "id": "boroughs",
    "name": "NYC Planning · Borough boundaries",
    "kind": "Official geographic outlines",
    "url": "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne",
    "note": "Land boundaries only. Dot texture is generated for visual context. Dots are not buildings or available sites."
  },
  {
    "id": "field",
    "name": "Ritwik Agarwal · Supplied Station Lab archive",
    "kind": "User field evidence · October 2026",
    "local": true,
    "url": "assets/J3-01.jpg",
    "note": "J3-01 and J3-09: Brooklyn Bridge-City Hall views. J1-01: housing facades near the reported Jefferson St origin. Captions are from the supplied archive. No measured local heat, airflow or building demand was provided."
  },
  {
    "id": "colors",
    "name": "MTA · Current brand colors and service symbols",
    "kind": "Official route coding",
    "url": "https://www.mta.info/document/168976",
    "note": "Published MTA HEX palette, checked against the official MTA Colors dataset and the bundled GTFS. 6X, 7X and FX are printed as diamond 6, 7 and F. Route membership includes all scheduled services in the feed, not current arrivals."
  },
  {
    "id": "pluto",
    "name": "NYC Planning · PLUTO 26v2",
    "kind": "Official tax-lot data · local sample",
    "url": "https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks/about_data",
    "note": "400 sampled tax lots near 18 Av D and Jefferson St. Includes all 72 parking and vacant-land records within the two selected bounding boxes, then nearby residential and mixed-use parcels. Approximate point locations. Land use and FAR fields do not establish development rights, building condition or retrofit suitability."
  },
  {
    "id": "lift-map",
    "name": "NYC · LIFT project map data",
    "kind": "Official project layer · 120 records",
    "url": "https://services6.arcgis.com/mMjXyrLYuBDkMYq4/arcgis/rest/services/LIFT_Tracker/FeatureServer/0",
    "note": "120 published pipeline project points. Source last edited 5 October 2026. Downloaded 16 October 2026. Unit estimates are total project units, not an affordable-unit breakdown or completed homes. Text ranges and approximate estimates are preserved."
  },
  {
    "id": "zola",
    "name": "NYC Planning · ZoLa zoning and land-use map",
    "kind": "Official map for further parcel review",
    "url": "https://zola.planning.nyc.gov/",
    "note": "Use the selected tax-lot link to review mapped zoning and supporting layers. The local PLUTO field is a dated zoning reference. It does not replace the full zoning rules or an eligibility assessment."
  }
];
