import uuid


def test_register_and_login(client):
    email = f"user_{uuid.uuid4().hex[:8]}@darukaa.earth"
    password = "SecurePassword123!"

    # 1. Register
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Dr. Jane Goodall",
            "role": "admin",
        },
    )
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # 2. Duplicate registration fails
    dup_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Duplicate User",
            "role": "admin",
        },
    )
    assert dup_response.status_code == 400

    # 3. Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token

    # 4. Get Current User /me
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@darukaa.earth", "password": "wrongpassword"},
    )
    assert response.status_code == 401
