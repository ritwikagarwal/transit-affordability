#!/usr/bin/env python3
"""Download a small, reproducible public PLUTO tax-lot sample. Standard library only.

This downloads descriptive land use, not development or retrofit eligibility.
The bundled result is an offline snapshot. Rerunning can produce a newer snapshot.
"""

import argparse
import hashlib
import json
import math
import time
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
import urllib.parse
import urllib.request
import urllib.error


ROOT = Path(__file__).resolve().parents[1]
DATASET_ID = "64uk-42ks"
API = f"https://data.cityofnewyork.us/resource/{DATASET_ID}.json"
METADATA = f"https://data.cityofnewyork.us/api/views/{DATASET_ID}.json"
SOURCE = f"https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/{DATASET_ID}/about_data"
DICTIONARY = "https://s-media.nyc.gov/agencies/dcp/assets/files/pdf/data-tools/bytes/pluto_datadictionary.pdf"
FIELDS = ["bbl", "address", "longitude", "latitude", "landuse", "bldgclass", "unitsres", "lotarea", "bldgarea", "builtfar", "residfar", "zonedist1", "yearbuilt", "version", "numbldgs"]
LABELS = {
    1: "One & Two Family Buildings",
    2: "Multi-Family Walk-Up Buildings",
    3: "Multi-Family Elevator Buildings",
    4: "Mixed Residential & Commercial Buildings",
    10: "Parking Facilities",
    11: "Vacant Land",
}
STATION_IDS = ["B19", "L15"]


def get_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "TransitAffordabilityResearch/1.0", "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                raw = response.read()
            break
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
            time.sleep(2 ** attempt)
    return json.loads(raw), hashlib.sha256(raw).hexdigest()


def make_url(parameters):
    return API + "?" + urllib.parse.urlencode(parameters)


def number(raw, zero_unknown=False, integer=False):
    if raw is None or raw == "":
        return None
    value = float(raw)
    if not math.isfinite(value) or value < 0:
        raise ValueError(f"Unexpected nonphysical numeric source value: {raw!r}")
    if zero_unknown and value == 0:
        return None
    if integer:
        if not value.is_integer():
            raise ValueError(f"Expected integer source value: {raw!r}")
        return int(value)
    return value


def bbl_identifier(raw):
    value = Decimal(raw)
    if value != value.to_integral_value():
        raise ValueError("BBL is not an integer identifier.")
    result = str(int(value))
    if len(result) != 10 or not result.isdigit():
        raise ValueError(f"Unexpected BBL: {raw!r}")
    return result


def normalize(row, station):
    lon, lat = float(row["longitude"]), float(row["latitude"])
    if not (-74.3 < lon < -73.6 and 40.4 < lat < 41):
        raise ValueError("Parcel coordinate is outside NYC context.")
    bbl = bbl_identifier(row["bbl"])
    code = int(row["landuse"])
    # Approximate local equirectangular distance, for sample context only.
    east_m = (lon - station["lon"]) * 111320 * math.cos(math.radians(station["lat"]))
    north_m = (lat - station["lat"]) * 111320
    return {
        "id": "pluto-" + bbl,
        "bbl": bbl,
        "address": row.get("address") or None,
        "coordinates": [lon, lat],
        "geometryType": "approximate-point",
        "stationId": station["id"],
        "landUse": code,
        "label": LABELS[code],
        "buildingClass": row.get("bldgclass") or None,
        "unitsResidential": number(row.get("unitsres"), integer=True),
        "yearBuilt": number(row.get("yearbuilt"), zero_unknown=True, integer=True),
        "zoning": row.get("zonedist1") or None,
        "builtFAR": number(row.get("builtfar"), zero_unknown=True),
        "maxResidentialFAR": number(row.get("residfar")),
        "lotAreaSqFt": number(row.get("lotarea"), zero_unknown=True),
        "buildingAreaSqFt": number(row.get("bldgarea"), zero_unknown=True),
        "distanceFromStationM": round(math.hypot(east_m, north_m)),
        "sourceVersion": row.get("version") or None,
    }


def download(output, half_extent_m, max_per_station):
    if not 100 <= half_extent_m <= 550:
        raise ValueError("Use a bounding-box half extent between 100 and 550 metres.")
    if not 1 <= max_per_station <= 200:
        raise ValueError("Keep the download to at most 200 records per station.")
    metadata, metadata_hash = get_json(METADATA)
    available = {column.get("fieldName") for column in metadata.get("columns", [])}
    if not set(FIELDS) <= available:
        raise ValueError("PLUTO schema changed. Missing fields: " + ", ".join(sorted(set(FIELDS) - available)))
    network = json.loads((ROOT / "dist/data/network.json").read_text())
    stations = {station["id"]: station for station in network["stations"]}
    if not set(STATION_IDS) <= stations.keys():
        raise ValueError("The bundled transit snapshot does not contain the study stations.")
    records, queries, studies = [], [], []
    versions = set()
    for station_id in STATION_IDS:
        station = stations[station_id]
        lon, lat = station["lon"], station["lat"]
        dx = half_extent_m / (111320 * math.cos(math.radians(lat)))
        dy = half_extent_m / 111320
        bounds = [round(lon - dx, 8), round(lat - dy, 8), round(lon + dx, 8), round(lat + dy, 8)]
        where = (f"longitude between {bounds[0]} and {bounds[2]} and "
                 f"latitude between {bounds[1]} and {bounds[3]} and landuse in (1,2,3,4,10,11)")
        count_parameters = {"$select": "landuse,count(*) as count", "$where": where, "$group": "landuse", "$order": "landuse"}
        count_url = make_url(count_parameters)
        counts, count_hash = get_json(count_url)
        counts = {int(row["landuse"]): int(row["count"]) for row in counts}
        queries.append({"stationId": station_id, "purpose": "Full matching-source counts before sampling", "parameters": count_parameters, "url": count_url, "responseSHA256": count_hash})
        parking_vacant_count = counts.get(10, 0) + counts.get(11, 0)
        residential_count = sum(counts.get(code, 0) for code in [1, 2, 3, 4])
        cosine_squared = math.cos(math.radians(lat)) ** 2
        distance = f"(longitude-({lon}))*(longitude-({lon}))*{cosine_squared:.12f}+(latitude-({lat}))*(latitude-({lat}))"
        selected = []
        groups = [("Parking and vacant land", "landuse in (10,11)", min(max_per_station, parking_vacant_count))]
        residential_limit = min(residential_count, max_per_station - groups[0][2])
        groups.append(("Residential and mixed residential/commercial", "landuse in (1,2,3,4)", residential_limit))
        for group_name, group_where, limit in groups:
            if limit == 0:
                continue
            parameters = {"$select": ",".join(FIELDS), "$where": f"({where}) and {group_where}", "$order": distance + ",bbl", "$limit": limit}
            url = make_url(parameters)
            rows, response_hash = get_json(url)
            if len(rows) != limit:
                raise ValueError(f"Expected {limit} source records for {station_id}; received {len(rows)}. No snapshot written.")
            versions.update(row.get("version") for row in rows)
            selected.extend(normalize(row, station) for row in rows)
            queries.append({"stationId": station_id, "purpose": group_name, "parameters": parameters, "url": url, "returnedCount": len(rows), "responseSHA256": response_hash})
        if len({record["bbl"] for record in selected}) != len(selected):
            raise ValueError("Duplicate source tax lot in station sample.")
        records.extend(selected)
        studies.append({
            "stationId": station_id,
            "stationName": station["name"],
            "stationCoordinates": [lon, lat],
            "boundingBox": bounds,
            "boundingBoxHalfExtentM": half_extent_m,
            "maximumApproximateCornerDistanceM": round(half_extent_m * math.sqrt(2)),
            "sourceMatchingCount": sum(counts.values()),
            "sourceCountsByLandUse": {str(code): count for code, count in sorted(counts.items())},
            "downloadedCount": len(selected),
            "downloadedCountsByLandUse": {str(code): count for code, count in sorted(Counter(record["landUse"] for record in selected).items())},
            "completeInventory": len(selected) == sum(counts.values()),
            "selection": "Parking and vacant land first, then nearest residential and mixed-use records to the station, capped per station. Distances use approximate PLUTO points.",
        })
    after, _ = get_json(METADATA)
    if after.get("rowsUpdatedAt") != metadata.get("rowsUpdatedAt"):
        raise ValueError("The source changed during download. Rerun to obtain a consistent snapshot.")
    if None in versions or len(versions) != 1:
        raise ValueError("Expected a single nonempty PLUTO release version.")
    if len({record["id"] for record in records}) != len(records):
        raise ValueError("Study areas overlap or contain duplicate BBLs. Resolve station association before writing.")
    document = {
        "schemaVersion": 1,
        "provenance": {
            "sourceUrl": SOURCE,
            "datasetId": DATASET_ID,
            "datasetTitle": metadata["name"],
            "agency": "NYC Department of City Planning",
            "apiUrl": API,
            "metadataUrl": METADATA,
            "dataDictionaryUrl": DICTIONARY,
            "sourceVersion": next(iter(versions)),
            "sourceLastUpdatedAt": datetime.fromtimestamp(metadata["rowsUpdatedAt"], timezone.utc).isoformat().replace("+00:00", "Z"),
            "downloadedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            "metadataResponseSHA256": metadata_hash,
            "sourceFields": FIELDS,
            "fieldDescriptions": {column["fieldName"]: column.get("description", "") for column in metadata["columns"] if column.get("fieldName") in FIELDS},
            "totalDownloadedCount": len(records),
            "maxPerStation": max_per_station,
            "geometry": "Approximate tax-lot points from PLUTO longitude and latitude. Not surveyed parcel boundaries or building footprints.",
            "scope": "Selected land-use sample in two bounded study areas. Not a complete neighborhood inventory or a representative sample of NYC.",
            "selection": "Include parking/vacant records before nearest residential/mixed-use records. Use source count queries to disclose omitted records.",
            "normalization": {
                "yearBuilt": "Source 0 or null becomes null because the data dictionary defines zero as unknown.",
                "buildingAreaSqFt": "Source 0 or null becomes null. A zero can mean unavailable or not applicable.",
                "lotAreaSqFt": "Source 0 or null becomes null.",
                "builtFAR": "Source 0 or null becomes null conservatively because building area may be unavailable or not applicable.",
                "unitsResidential": "Source zero is preserved. It indicates no residential units in the source record, not no redevelopment potential.",
                "maxResidentialFAR": "Source zero is preserved as published. This is standard-residence FAR in PLUTO, not a complete zoning or housing-eligibility determination.",
                "zoning": "Only ZoneDist1 is included. Split districts, overlays, special districts, bonuses and other controls are not assessed.",
            },
            "limits": [
                "Land-use classification does not establish availability, ownership permission, vacancy today, development eligibility or retrofit need.",
                "Units are tax-lot residential units, not affordable units or available homes.",
                "Building year and floor areas are source estimates. No heat demand or financial savings is inferred.",
                "No private owner-name field is requested or stored.",
                "The upstream dataset is mutable. This bundled file records a single release and download time; refreshing is an explicit local action.",
            ],
            "studies": studies,
            "queries": queries,
        },
        "records": records,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(output)
    print(json.dumps({"output": str(output), "sourceVersion": document["provenance"]["sourceVersion"], "records": len(records), "studies": [{key: study[key] for key in ["stationId", "sourceMatchingCount", "downloadedCount", "downloadedCountsByLandUse"]} for study in studies]}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist/data/parcels.json")
    parser.add_argument("--half-extent-m", type=int, default=500)
    parser.add_argument("--max-per-station", type=int, default=200)
    arguments = parser.parse_args()
    download(arguments.output, arguments.half_extent_m, arguments.max_per_station)
