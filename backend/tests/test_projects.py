def test_project_crud(client, auth_headers):
    # 1. Create Project
    create_payload = {
        "name": "Boreal Peatland Restoration",
        "description": "Restoring northern peat bogs to stabilize permafrost carbon.",
        "project_type": "Peatland Conservation",
        "country": "Canada",
        "status": "active",
    }
    create_res = client.post("/api/v1/projects", json=create_payload, headers=auth_headers)
    assert create_res.status_code == 201
    project_data = create_res.json()
    project_id = project_data["id"]
    assert project_data["name"] == create_payload["name"]

    # 2. Get Project Detail
    detail_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == project_id

    # 3. Update Project
    update_res = client.put(
        f"/api/v1/projects/{project_id}",
        json={"name": "Updated Boreal Initiative", "status": "active"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Boreal Initiative"

    # 4. List Projects
    list_res = client.get("/api/v1/projects", headers=auth_headers)
    assert list_res.status_code == 200
    projects = list_res.json()
    assert any(p["id"] == project_id for p in projects)

    # 5. Delete Project
    del_res = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Confirm 404 after deletion
    detail_after = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert detail_after.status_code == 404
