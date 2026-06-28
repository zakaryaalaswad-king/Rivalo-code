"""Iteration 7 — Targeted retest of /api/ai/vetting-task fairness contract.

Fix under test: server.py /api/ai/vetting-task now uses parsed.setdefault(...) calls
to guarantee fairness_score / difficulty / fairness_reasoning are always present
in the 200 response, even when the LLM omits them.

Scope (per main-agent review request):
  1) Owner happy path -> 200 with ALL 8 contract keys
  2) Non-owner -> 403
  3) Non-existent project_id -> 404
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "freelancer_comp")
API = f"{BASE_URL}/api"

CLIENT_EMAIL = "client@demo.com"
FREELANCER_EMAIL = "freelancer@demo.com"
PW = "demo1234"

REQUIRED_KEYS = {
    "title",
    "goal",
    "tasks",
    "evaluation_criteria",
    "time_estimate_minutes",
    "difficulty",
    "fairness_score",
    "fairness_reasoning",
}


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def db():
    return MongoClient(MONGO_URL)[DB_NAME]


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login {email} failed: {r.status_code} {r.text}"
    return r.json()["token"]


def _session_with_token(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def client_session():
    return _session_with_token(_login(CLIENT_EMAIL, PW))


@pytest.fixture(scope="module")
def freelancer_session():
    return _session_with_token(_login(FREELANCER_EMAIL, PW))


@pytest.fixture(scope="module")
def owner_project(db, client_session, freelancer_session):
    """Create a fresh project owned by client@demo.com so we can call vetting-task on it."""
    me_free = freelancer_session.get(f"{API}/auth/me", timeout=10).json()
    free_id = me_free["id"]

    r = client_session.post(f"{API}/projects", json={
        "title": f"TEST_iter7_vetproj_{uuid.uuid4().hex[:6]}",
        "description": "Iter7 vetting fairness retest — design a modern logo.",
        "category": "Design",
        "budget": 200.0,
        "duration_hours": 48,
        "max_competitors": 3,
        "deliverables": "Logo PNG + SVG",
    }, timeout=15)
    assert r.status_code == 200, f"create project failed: {r.text}"
    pid = r.json()["id"]

    yield {"project_id": pid, "freelancer_id": free_id}

    db.submissions.delete_many({"project_id": pid})
    db.projects.delete_one({"id": pid})


# ---------- tests ----------
class TestVettingTaskFairnessRetest:
    """Iteration-7 retest: verify the .setdefault() fix guarantees the full 8-key contract."""

    def test_vetting_task_owner_returns_all_8_fields(self, client_session, owner_project):
        pid = owner_project["project_id"]
        free_id = owner_project["freelancer_id"]
        r = client_session.post(
            f"{API}/ai/vetting-task",
            json={"project_id": pid, "freelancer_ids": [free_id]},
            timeout=60,
        )
        if r.status_code == 502:
            pytest.skip("AI offline (502) — acceptable per spec")
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        present = set(data.keys())
        missing = REQUIRED_KEYS - present
        assert not missing, f"missing required keys {missing}; got keys={sorted(present)}"

        # fairness_score must be an integer in [0, 100]
        fs = data["fairness_score"]
        assert isinstance(fs, (int, float)) and not isinstance(fs, bool), \
            f"fairness_score must be numeric, got {type(fs).__name__}: {fs!r}"
        fs_int = int(fs)
        assert 0 <= fs_int <= 100, f"fairness_score out of [0,100]: {fs_int}"

        # difficulty must be one of: easy / medium / hard
        assert data["difficulty"] in ("easy", "medium", "hard"), \
            f"difficulty unexpected: {data['difficulty']!r}"

        # fairness_reasoning must be a non-empty string
        assert isinstance(data["fairness_reasoning"], str) and data["fairness_reasoning"].strip(), \
            f"fairness_reasoning must be non-empty string, got: {data['fairness_reasoning']!r}"

        # Sanity on the other contract fields
        assert isinstance(data["title"], str) and data["title"].strip()
        assert isinstance(data["goal"], str) and data["goal"].strip()
        assert isinstance(data["tasks"], list)
        assert isinstance(data["evaluation_criteria"], list)
        assert isinstance(data["time_estimate_minutes"], (int, float))

    def test_vetting_task_non_owner_returns_403(self, freelancer_session, owner_project):
        pid = owner_project["project_id"]
        r = freelancer_session.post(
            f"{API}/ai/vetting-task",
            json={"project_id": pid, "freelancer_ids": []},
            timeout=30,
        )
        assert r.status_code == 403, f"expected 403 for non-owner, got {r.status_code}: {r.text}"

    def test_vetting_task_nonexistent_project_returns_404(self, client_session):
        bogus_pid = f"nonexistent-{uuid.uuid4().hex}"
        r = client_session.post(
            f"{API}/ai/vetting-task",
            json={"project_id": bogus_pid, "freelancer_ids": []},
            timeout=30,
        )
        assert r.status_code == 404, f"expected 404 for missing project, got {r.status_code}: {r.text}"
