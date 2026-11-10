"""Refresh the local snapshot of NYC's public LIFT housing pipeline points.

Run from any folder: python3 scripts/fetch-lift.py
Uses Python's standard library. Reads public data and writes one JSON snapshot.
The StoryMap -> Web Map -> feature-layer chain is verified before download.
No geocoding, parcel inference, or development-eligibility scoring is performed.
"""
from collections import Counter
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import urllib.parse
import urllib.request


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist/data/lift-sites.json"
STORY_ID = "afce9e93d79847608fc846878e17db8e"
WEBMAP_ID = "70bd4dc0d246454d82e0784a8ab9c265"
LAYER_ITEM_ID = "f4ab8860ae8849349bd7830557661450"
LAYER_URL = "https://services6.arcgis.com/mMjXyrLYuBDkMYq4/arcgis/rest/services/LIFT_Tracker/FeatureServer/0"
STORY_URL = f"https://storymaps.arcgis.com/stories/{STORY_ID}"
NYC_URL = "https://www.nyc.gov/main/land-inventory-fast-track"
ARCGIS = "https://www.arcgis.com/sharing/rest/content/items/"


def query_url(url, **parameters):
    return url + "?" + urllib.parse.urlencode(parameters)


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "TransitAffordabilityLocal/1.0 (public data snapshot)"})
    with urllib.request.urlopen(request, timeout=45) as response:
        result = json.load(response)
    if isinstance(result, dict) and "error" in result:
        raise RuntimeError(f"ArcGIS returned an error for {url}: {result['error']}")
    return result


def utc_timestamp(milliseconds):
    if milliseconds is None:
        return None
    return datetime.fromtimestamp(milliseconds / 1000, timezone.utc).isoformat().replace("+00:00", "Z")


def clean_text(value):
    return str(value).strip() if value is not None and str(value).strip() else None


def normalized_record(feature):
    attributes = feature["attributes"]
    object_id = attributes["ObjectId"]
    geometry = feature.get("geometry")
    coordinates = None
    if geometry and geometry.get("x") is not None and geometry.get("y") is not None:
        lon, lat = geometry["x"], geometry["y"]
        if not all(isinstance(n, (int, float)) and math.isfinite(n) for n in (lon, lat)):
            raise ValueError(f"Non-finite geometry for ObjectId {object_id}")
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError(f"Geometry was not returned as longitude/latitude for ObjectId {object_id}")
        coordinates = [lon, lat]
    homes_label = clean_text(attributes.get("UnitsTot"))
    # Keep ranges, + values and ~ estimates as text, with no invented midpoint.
    homes = int(homes_label.replace(",", "")) if homes_label and re.fullmatch(r"(?:\d{1,3}(?:,\d{3})+|\d+)", homes_label) else None
    notes = "Published pipeline project. The supplied point does not define a parcel, approved buildable area, or thermal network connection."
    if homes is None and homes_label:
        notes += f" The published units value is a range or approximation: {homes_label}."
    return {
        "id": f"lift-{object_id}",
        "sourceId": object_id,
        "sourceIds": {"storyMapItemId": STORY_ID, "webMapItemId": WEBMAP_ID, "layerItemId": LAYER_ITEM_ID, "objectId": object_id},
        "title": clean_text(attributes.get("New_Name")) or f"LIFT site {object_id}",
        "coordinates": coordinates,
        "stage": clean_text(attributes.get("StatusNew")),
        "homes": homes,
        "homesLabel": homes_label,
        "address": clean_text(attributes.get("Address")),
        "leadAgency": clean_text(attributes.get("Agency")),
        "owner": clean_text(attributes.get("OwnerName")),
        "url": STORY_URL,
        "featureUrl": query_url(LAYER_URL + "/query", objectIds=object_id, outFields="*", returnGeometry="true", outSR=4326, f="pjson"),
        "source": "NYC LIFT Tracker",
        "notes": notes,
    }


def main():
    story_data_url = query_url(ARCGIS + STORY_ID + "/data", f="json")
    story = fetch_json(story_data_url)
    lift_nodes = [node for node in story.get("nodes", {}).values()
                  if node.get("type") == "webmap" and node.get("data", {}).get("caption") == "LIFT Tracker Map"]
    if len(lift_nodes) != 1:
        raise RuntimeError("The official StoryMap's LIFT Tracker Map reference changed. Review it before refreshing.")
    resource_id = lift_nodes[0]["data"]["map"]
    discovered_webmap = story["resources"][resource_id]["data"]["itemId"]
    if discovered_webmap != WEBMAP_ID:
        raise RuntimeError(f"The official LIFT Web Map ID changed to {discovered_webmap}. Review the new map first.")

    webmap_data_url = query_url(ARCGIS + WEBMAP_ID + "/data", f="json")
    webmap = fetch_json(webmap_data_url)
    matched_layers = [layer for layer in webmap.get("operationalLayers", [])
                      if layer.get("itemId") == LAYER_ITEM_ID and layer.get("url", "").rstrip("/") == LAYER_URL]
    if len(matched_layers) != 1:
        raise RuntimeError("The official LIFT feature-layer reference changed. Review it before refreshing.")

    layer = fetch_json(query_url(LAYER_URL, f="json"))
    if layer.get("geometryType") != "esriGeometryPoint" or layer.get("objectIdField") != "ObjectId":
        raise RuntimeError("The official layer geometry or ID schema changed. Review it before refreshing.")
    required = {"New_Name", "StatusNew", "UnitsTot", "Address", "Agency", "OwnerName", "ObjectId"}
    if not required.issubset({field["name"] for field in layer["fields"]}):
        raise RuntimeError("Required LIFT fields are missing. The existing local snapshot was preserved.")

    ids_url = query_url(LAYER_URL + "/query", where="1=1", returnIdsOnly="true", f="json")
    ids = sorted(fetch_json(ids_url).get("objectIds", []))
    if not ids or len(ids) != len(set(ids)):
        raise RuntimeError("The LIFT source returned empty or duplicated IDs. The local snapshot was preserved.")
    features = []
    query_urls = []
    for start in range(0, len(ids), 500):
        batch = ids[start:start + 500]
        url = query_url(LAYER_URL + "/query", objectIds=",".join(map(str, batch)), outFields="*", returnGeometry="true", outSR=4326, f="json")
        page = fetch_json(url)
        if page.get("exceededTransferLimit"):
            raise RuntimeError("ArcGIS truncated a page. The existing local snapshot was preserved.")
        if page.get("spatialReference", {}).get("wkid") != 4326:
            raise RuntimeError("ArcGIS did not return WGS84 coordinates.")
        features.extend(page.get("features", []))
        query_urls.append(url)
    if sorted(feature["attributes"]["ObjectId"] for feature in features) != ids:
        raise RuntimeError("Returned records do not match the complete source ID list.")
    records = sorted((normalized_record(feature) for feature in features), key=lambda record: record["sourceId"])
    snapshot = {
        "provenance": {
            "source": "NYC Mayor's Office, Land Inventory Fast Track (LIFT)",
            "sourceUrl": NYC_URL,
            "storyMapUrl": STORY_URL,
            "storyMapItemId": STORY_ID,
            "storyMapDataUrl": story_data_url,
            "webMapItemId": WEBMAP_ID,
            "webMapDataUrl": webmap_data_url,
            "featureServiceItemId": LAYER_ITEM_ID,
            "featureServiceUrl": LAYER_URL,
            "featureServiceLastEditedAt": utc_timestamp(layer.get("editingInfo", {}).get("lastEditDate")),
            "downloadedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            "totalCount": len(records),
            "coordinatesCount": sum(record["coordinates"] is not None for record in records),
            "stageCounts": dict(sorted(Counter(record["stage"] for record in records).items())),
            "homesAsTextCount": sum(record["homes"] is None and record["homesLabel"] is not None for record in records),
            "coordinateSystem": "EPSG:4326 longitude, latitude; source project points requested with outSR=4326",
            "recordGrain": "One published LIFT pipeline project point. A project may span multiple properties.",
            "fieldMapping": {"title": "New_Name", "stage": "StatusNew", "homesLabel": "UnitsTot", "address": "Address", "leadAgency": "Agency", "owner": "OwnerName", "sourceId": "ObjectId"},
            "queryUrls": query_urls,
            "limitations": [
                "Pipeline projects and published unit estimates are not completed homes.",
                "UnitsTot reports total published project units. The layer does not give an affordable-unit breakdown or household income eligibility.",
                "Stage labels are preserved as supplied. No planning approval or zoning permission is inferred.",
                "Project points are not parcel boundaries, available land listings, or verified buildable areas.",
                "Nearby subway service, accessible walking routes, energy demand and thermal feasibility are separate questions.",
                "Numeric homes values are parsed only from plain integer UnitsTot text. Ranges and approximations remain in homesLabel with homes null.",
                "This is a dated local snapshot. It does not automatically reflect later source edits."
            ],
        },
        "records": records,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(OUTPUT)
    print(f"Saved {len(records)} official LIFT project records to {OUTPUT}")
    print(json.dumps(snapshot["provenance"]["stageCounts"], indent=2))


if __name__ == "__main__":
    main()
