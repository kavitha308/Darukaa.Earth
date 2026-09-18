def test_site_and_project_metrics_flow(client, auth_headers):
    # 1. Create project
    p_res = client.post(
        "/api/v1/projects",
        json={"name": "Costa Rica Cloud Forest", "country": "Costa Rica"},
        headers=auth_headers,
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # 2. Create site
    site_payload = {
        "project_id": project_id,
        "name": "Monteverde Canopy Sector 1",
        "biome": "Tropical Rainforest",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-84.8500, 10.3000],
                    [-84.8200, 10.3000],
                    [-84.8200, 10.3200],
                    [-84.8500, 10.3200],
                    [-84.8500, 10.3000],
                ]
            ],
        },
    }
    s_res = client.post("/api/v1/sites", json=site_payload, headers=auth_headers)
    assert s_res.status_code == 201
    site_id = s_res.json()["id"]

    # 3. Query site raw metrics
    metrics_res = client.get(f"/api/v1/sites/{site_id}/metrics", headers=auth_headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert len(metrics) > 0
    # Check that time-series contains carbon, ndvi, and biodiversity fields
    first_metric = metrics[0]
    assert "cumulative_carbon_tco2e" in first_metric
    assert "ndvi" in first_metric
    assert "biodiversity_index" in first_metric
    assert "canopy_cover_percentage" in first_metric

    # 4. Query site analytics summary (Highcharts payload)
    analytics_res = client.get(f"/api/v1/sites/{site_id}/analytics", headers=auth_headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["site_id"] == site_id
    assert analytics["total_cumulative_carbon_tco2e"] > 0
    assert 0.0 < analytics["latest_ndvi"] <= 1.0
    assert 0.0 <= analytics["latest_biodiversity_index"] <= 100.0
    assert len(analytics["time_series"]) == len(metrics)

    # 5. Query project-level aggregate analytics
    proj_analytics_res = client.get(
        f"/api/v1/projects/{project_id}/analytics", headers=auth_headers
    )
    assert proj_analytics_res.status_code == 200
    proj_analytics = proj_analytics_res.json()
    assert proj_analytics["project_id"] == project_id
    assert proj_analytics["total_sites"] >= 1
    assert proj_analytics["total_cumulative_carbon_tco2e"] > 0
    assert len(proj_analytics["time_series_aggregate"]) > 0
