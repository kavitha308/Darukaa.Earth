import httpx
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_full_workflow():
    client = httpx.Client(timeout=30.0)

    print("=== Step 1: Authentication (Login as Administrator) ===")
    login_res = client.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@darukaa.earth", "password": "AdminPassword123!"}
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    tokens = login_res.json()
    token = tokens["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    print("[OK] Successfully logged in and received JWT Bearer token.")

    print("\n=== Step 2: Dashboard & Projects List ===")
    proj_res = client.get(f"{BASE_URL}/projects")
    assert proj_res.status_code == 200, f"List projects failed: {proj_res.text}"
    projects = proj_res.json()
    print(f"[OK] Retrieved {len(projects)} existing projects from database.")
    for p in projects:
        print(f"  - [{p['id'][:8]}] {p['name']} ({p['country']}) - Sites: {p['site_count']}, Area: {p['total_area_hectares']} ha")

    print("\n=== Step 3: Create / Select Project ===")
    new_proj_payload = {
        "name": "Madagascar Baobab Restoration Reserve",
        "description": "Restoration of dry deciduous forest and grandidier baobabs to protect lemur corridors.",
        "project_type": "Agroforestry",
        "country": "Madagascar"
    }
    p_create_res = client.post(f"{BASE_URL}/projects", json=new_proj_payload)
    assert p_create_res.status_code == 201, f"Project creation failed: {p_create_res.text}"
    project = p_create_res.json()
    project_id = project["id"]
    print(f"[OK] Created new project: {project['name']} (ID: {project_id})")

    print("\n=== Step 4: Add New Site #1 (Simulating Map Polygon Drawing) ===")
    # Polygon in Menabe Antimena, Madagascar: [lng, lat] format
    site_1_coords = [
        [44.3200, -20.2500],
        [44.3500, -20.2500],
        [44.3500, -20.2800],
        [44.3200, -20.2800],
        [44.3200, -20.2500]
    ]
    site_1_payload = {
        "project_id": project_id,
        "name": "Menabe Antimena Baobab Sector A",
        "description": "High-priority baobab seedling transplantation zone with community fire breaks.",
        "biome": "Savanna & Agroforestry",
        "geometry": {
            "type": "Polygon",
            "coordinates": [site_1_coords]
        }
    }
    s1_res = client.post(f"{BASE_URL}/projects/{project_id}/sites", json=site_1_payload)
    assert s1_res.status_code == 201, f"Site 1 creation failed: {s1_res.text}"
    s1_feature = s1_res.json()
    site1_id = s1_feature["id"]
    s1_area = s1_feature["properties"]["area_hectares"]
    print(f"[OK] Site 1 registered: {s1_feature['properties']['name']}")
    print(f"  - ID: {site1_id}")
    print(f"  - Geodetic Surface Area: {s1_area} hectares")
    print(f"  - Centroid: [{s1_feature['properties']['centroid_lng']}, {s1_feature['properties']['centroid_lat']}]")
    print(f"  - Biome: {s1_feature['properties']['biome']}")

    print("\n=== Step 5: Add New Site #2 to Same Project (Multiple Sites Verification) ===")
    site_2_coords = [
        [44.3700, -20.2900],
        [44.4000, -20.2900],
        [44.4000, -20.3200],
        [44.3700, -20.3200],
        [44.3700, -20.2900]
    ]
    site_2_payload = {
        "project_id": project_id,
        "name": "Kirindy Forest Canopy Corridor",
        "description": "Canopy corridor linking primary dry forest to secondary reforested parcels.",
        "biome": "Savanna & Agroforestry",
        "geometry": {
            "type": "Polygon",
            "coordinates": [site_2_coords]
        }
    }
    s2_res = client.post(f"{BASE_URL}/sites", json=site_2_payload)
    assert s2_res.status_code == 201, f"Site 2 creation failed: {s2_res.text}"
    s2_feature = s2_res.json()
    site2_id = s2_feature["id"]
    s2_area = s2_feature["properties"]["area_hectares"]
    print(f"[OK] Site 2 registered: {s2_feature['properties']['name']}")
    print(f"  - ID: {site2_id}")
    print(f"  - Geodetic Surface Area: {s2_area} hectares")

    print("\n=== Step 6: Verify Persistence and Aggregates on Project ===")
    p_detail_res = client.get(f"{BASE_URL}/projects/{project_id}")
    assert p_detail_res.status_code == 200
    p_detail = p_detail_res.json()
    print(f"[OK] Project Detail retrieved:")
    print(f"  - Site Count: {p_detail['site_count']} (Expected: 2)")
    print(f"  - Total Aggregated Area: {p_detail['total_area_hectares']} ha (Expected: {round(s1_area + s2_area, 2)} ha)")
    assert p_detail["site_count"] == 2
    assert abs(p_detail["total_area_hectares"] - (s1_area + s2_area)) < 0.05

    print("\n=== Step 7: Verify GeoJSON FeatureCollection Rendering Layer Data ===")
    sites_fc_res = client.get(f"{BASE_URL}/sites?project_id={project_id}")
    assert sites_fc_res.status_code == 200
    fc = sites_fc_res.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 2
    print(f"[OK] GeoJSON FeatureCollection contains {len(fc['features'])} valid Mapbox features.")
    for feat in fc["features"]:
        print(f"  - Feature '{feat['properties']['name']}' (Geometry: {feat['geometry']['type']}, Coordinates count: {len(feat['geometry']['coordinates'][0])})")

    print("\n=== Step 8: Verify Historical Time-Series Analytics Generation ===")
    for s_id, s_name in [(site1_id, "Site 1"), (site2_id, "Site 2")]:
        analytics_res = client.get(f"{BASE_URL}/sites/{s_id}/analytics")
        assert analytics_res.status_code == 200, f"Analytics failed for {s_id}: {analytics_res.text}"
        analytics = analytics_res.json()
        print(f"[OK] Analytics retrieved for {s_name}:")
        print(f"  - Total Cumulative Carbon: {analytics['total_cumulative_carbon_tco2e']} tCO2e")
        print(f"  - Latest Biodiversity Index: {analytics['latest_biodiversity_index']}")
        print(f"  - Latest NDVI: {analytics['latest_ndvi']}")
        print(f"  - Monthly Time-Series points: {len(analytics['time_series'])} records")
        assert len(analytics["time_series"]) > 0

    print("\n========================================================")
    print("ALL END-TO-END VERIFICATION STEPS PASSED WITH 100% SUCCESS!")
    print("========================================================")

if __name__ == "__main__":
    try:
        test_full_workflow()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
