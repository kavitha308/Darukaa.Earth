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
