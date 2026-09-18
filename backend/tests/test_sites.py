def test_site_creation_and_spatial_calculation(client, auth_headers):
    # 1. First create a parent project
    p_res = client.post(
        "/api/v1/projects",
        json={"name": "Atlantic Forest Corridor", "country": "Brazil"},
        headers=auth_headers,
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # 2. Create a site with a valid GeoJSON Polygon (~100 hectare test polygon in Brazil)
    site_payload = {
        "project_id": project_id,
        "name": "Monte Pascoal Site Alpha",
        "description": "Native seedling replanting zone.",
        "biome": "Tropical Rainforest",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-39.4200, -16.8800],
                    [-39.4000, -16.8800],
                    [-39.4000, -16.9000],
                    [-39.4200, -16.9000],
                    [-39.4200, -16.8800],
                ]
            ],
        },
    }
    s_res = client.post("/api/v1/sites", json=site_payload, headers=auth_headers)
    assert s_res.status_code == 201
    feature = s_res.json()

    assert feature["type"] == "Feature"
    site_id = feature["id"]
    props = feature["properties"]
    assert props["name"] == site_payload["name"]
    # Check that area in hectares was calculated and is positive
    assert props["area_hectares"] > 0
    # Centroid check
    assert -17.0 < props["centroid_lat"] < -16.8
    assert -39.5 < props["centroid_lng"] < -39.3

    # 3. List sites as GeoJSON FeatureCollection
    list_res = client.get(f"/api/v1/sites?project_id={project_id}", headers=auth_headers)
    assert list_res.status_code == 200
    fc = list_res.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) >= 1

    # 4. Get single site
    single_res = client.get(f"/api/v1/sites/{site_id}", headers=auth_headers)
    assert single_res.status_code == 200
    assert single_res.json()["id"] == site_id

    # 5. Delete site
    del_res = client.delete(f"/api/v1/sites/{site_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_site_invalid_geometry(client, auth_headers):
    # Try creating a site with degenerate coordinates (< 4 points)
    p_res = client.post(
        "/api/v1/projects",
        json={"name": "Invalid Geom Project", "country": "Peru"},
        headers=auth_headers,
    )
    project_id = p_res.json()["id"]

    invalid_payload = {
        "project_id": project_id,
        "name": "Degenerate Site",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-70.0, -12.0], [-70.1, -12.1]]],
        },
    }
    res = client.post("/api/v1/sites", json=invalid_payload, headers=auth_headers)
    assert res.status_code == 422  # Pydantic validation error on coordinate ring


def test_nested_project_sites_endpoints(client, auth_headers):
    # Create parent project
    p_res = client.post(
        "/api/v1/projects",
        json={"name": "Serengeti Buffer Project", "country": "Tanzania"},
        headers=auth_headers,
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # Post site via nested /projects/{id}/sites endpoint
    site_payload = {
        "project_id": project_id,
        "name": "Acacia Savanna Zone 1",
        "biome": "Savanna & Agroforestry",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [34.8000, -2.3000],
                    [34.8500, -2.3000],
                    [34.8500, -2.3500],
                    [34.8000, -2.3500],
                    [34.8000, -2.3000],
                ]
            ],
        },
    }
    s_res = client.post(
        f"/api/v1/projects/{project_id}/sites",
        json=site_payload,
        headers=auth_headers,
    )
    assert s_res.status_code == 201
    created_site = s_res.json()
    assert created_site["type"] == "Feature"
    assert created_site["properties"]["name"] == "Acacia Savanna Zone 1"
    assert created_site["properties"]["area_hectares"] > 0

    # Get sites via nested endpoint
    list_res = client.get(f"/api/v1/projects/{project_id}/sites", headers=auth_headers)
    assert list_res.status_code == 200
    fc = list_res.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 1
    assert fc["features"][0]["properties"]["name"] == "Acacia Savanna Zone 1"


def test_multiple_sites_per_project(client, auth_headers):
    # Create project
    p_res = client.post(
        "/api/v1/projects",
        json={"name": "Borneo Peatland Reserve", "country": "Indonesia"},
        headers=auth_headers,
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # Add Site 1
    site1 = {
        "project_id": project_id,
        "name": "Sebangau Peat Sector A",
        "biome": "Temperate Peatland",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [113.8000, -2.5000],
                    [113.8200, -2.5000],
                    [113.8200, -2.5200],
                    [113.8000, -2.5200],
                    [113.8000, -2.5000],
                ]
            ],
        },
    }
    r1 = client.post("/api/v1/sites", json=site1, headers=auth_headers)
    assert r1.status_code == 201
    area1 = r1.json()["properties"]["area_hectares"]

    # Add Site 2
    site2 = {
        "project_id": project_id,
        "name": "Sebangau Peat Sector B",
        "biome": "Temperate Peatland",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [113.8500, -2.5300],
                    [113.8800, -2.5300],
                    [113.8800, -2.5600],
                    [113.8500, -2.5600],
                    [113.8500, -2.5300],
                ]
            ],
        },
    }
    r2 = client.post("/api/v1/sites", json=site2, headers=auth_headers)
    assert r2.status_code == 201
    area2 = r2.json()["properties"]["area_hectares"]

    # Retrieve project detail and check site_count and aggregated total_area_hectares
    proj_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert proj_res.status_code == 200
    p_data = proj_res.json()
    assert p_data["site_count"] == 2
    assert p_data["total_area_hectares"] == round(area1 + area2, 2)
    assert len(p_data["sites"]) == 2
