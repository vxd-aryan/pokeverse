import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

# Note: You'll need a mock override for get_current_user in your actual test suite setup
# Example override token header
HEADERS = {"Authorization": "Bearer MOCK_TEST_TOKEN"}

def test_start_battle():
    payload = {
        "mode": "practice",
        "player_team_ids": [25, 1, 4],
        "opponent_team_ids": None
    }
    response = client.post("/api/battle/start", json=payload, headers=HEADERS)
    
    assert response.status_code == 200
    data = response.json()
    assert "battle_id" in data
    assert data["status"] == "active"
    assert data["turn_count"] == 0
    assert "current_state" in data

def test_submit_action():
    # Assuming battle ID 1 was created from a previous fixture
    payload = {
        "action_type": "move",
        "move_id": 1
    }
    response = client.post("/api/battle/1/action", json=payload, headers=HEADERS)
    
    assert response.status_code == 200
    data = response.json()
    assert data["turn_count"] >= 1
    assert len(data["latest_logs"]) > 0

def test_get_history():
    response = client.get("/api/battle/history", headers=HEADERS)
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)