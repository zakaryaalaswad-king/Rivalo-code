"""
Rivaloz iteration 4 backend tests:
- Auth + email verification flow (gating)
- Profile update with new fields + trust points recomputation
- AI Coach chat + AI vetting task
"""
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://project-bid-arena.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "freelancer_comp")
_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def client_session():
    """Login demo client."""
    r = requests.post(f"{API}/auth/login", json={"email": "client@demo.com", "password": "demo1234"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"]}


@pytest.fixture(scope="module")
def freelancer_session():
    r = requests.post(f"{API}/auth/login", json={"email": "freelancer@demo.com", "password": "demo1234"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"]}


@pytest.fixture(scope="module")
def fresh_user():
    """Register a fresh unverified user."""
    email = f"TEST_iter4_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "demo1234", "name": "Iter4 Tester"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    yield {"token": data["token"], "user": data["user"], "email": email}
    # cleanup
    try:
        _db.users.delete_one({"email": email})
        _db.email_codes.delete_many({"user_id": data["user"]["id"]})
    except Exception:
        pass


# ---------------------------------------------------------------- /me shape & demo verification
class TestMeShape:
    def test_demo_client_me_shape(self, client_session):
        r = requests.get(f"{API}/auth/me", headers=auth_headers(client_session["token"]), timeout=15)
        assert r.status_code == 200
        u = r.json()
        for k in [
            "email_verified", "trust_points", "social_links", "former_projects",
            "cv_url", "age", "phone", "location", "languages", "hourly_rate",
        ]:
            assert k in u, f"Missing key {k} in /me response"
        assert u["email_verified"] is True, "Demo client should be auto-verified"
        # Demo client has only email_verified set -> trust = 10
        assert u["trust_points"] == 10, f"Expected trust=10 for demo client, got {u['trust_points']}"

    def test_demo_freelancer_verified(self, freelancer_session):
        r = requests.get(f"{API}/auth/me", headers=auth_headers(freelancer_session["token"]), timeout=15)
        assert r.status_code == 200
        assert r.json()["email_verified"] is True


# ---------------------------------------------------------------- Verification gating
class TestVerificationGating:
    def test_fresh_user_not_verified(self, fresh_user):
        r = requests.get(f"{API}/auth/me", headers=auth_headers(fresh_user["token"]), timeout=15)
        assert r.status_code == 200
        assert r.json()["email_verified"] is False

    def test_unverified_create_project_blocked(self, fresh_user):
        r = requests.post(
            f"{API}/projects",
            headers=auth_headers(fresh_user["token"]),
            json={
                "title": "Unverified Project",
                "description": "Should be blocked because email unverified",
                "category": "Graphic Design",
                "budget": 100.0,
                "duration_hours": 24,
            },
            timeout=15,
        )
        assert r.status_code == 403, r.text
        assert "verify" in r.text.lower()

    def test_unverified_apply_blocked(self, fresh_user, client_session):
        # Use any existing open project; if none, we just expect 403 from the require_verified gate
        plist = requests.get(f"{API}/projects?status=open", timeout=15).json()
        if plist:
            pid = plist[0]["id"]
            r = requests.post(
                f"{API}/projects/{pid}/apply",
                headers=auth_headers(fresh_user["token"]),
                json={"pitch": "I am unverified and should be blocked.", "sample_url": ""},
                timeout=15,
            )
            assert r.status_code == 403, r.text


# ---------------------------------------------------------------- Email code flow
class TestEmailVerification:
    def test_send_verification_and_code_in_db(self, fresh_user):
        r = requests.post(f"{API}/auth/send-verification", headers=auth_headers(fresh_user["token"]), timeout=15)
        assert r.status_code == 200
        # fetch code from mongo
        rec = _db.email_codes.find_one({"user_id": fresh_user["user"]["id"]})
        assert rec is not None, "No code stored in db.email_codes"
        assert "code" in rec and len(rec["code"]) == 6
        fresh_user["_otp"] = rec["code"]

    def test_verify_wrong_code_increments_attempts(self, fresh_user):
        # 4 wrong attempts; the 5th SHOULD return 429
        wrong = "000000" if fresh_user.get("_otp") != "000000" else "111111"
        for i in range(4):
            r = requests.post(
                f"{API}/auth/verify-email",
                headers=auth_headers(fresh_user["token"]),
                json={"code": wrong},
                timeout=15,
            )
            assert r.status_code == 400, f"Attempt {i}: {r.status_code} {r.text}"
        # 5th attempt: attempts was incremented to 4 then check; on this call attempts becomes 5 and returns 429? 
        # Actually code increments AFTER the check. Pre-check: attempts==4 (<5) OK then increments to 5 then 400. 
        # 6th call: attempts==5 → 429
        r = requests.post(
            f"{API}/auth/verify-email",
            headers=auth_headers(fresh_user["token"]),
            json={"code": wrong},
            timeout=15,
        )
        # Either 400 (just hit 5) or 429 (already at 5)
        assert r.status_code in (400, 429)
        r = requests.post(
            f"{API}/auth/verify-email",
            headers=auth_headers(fresh_user["token"]),
            json={"code": wrong},
            timeout=15,
        )
        assert r.status_code == 429, f"Expected 429 after 5 attempts, got {r.status_code}: {r.text}"

    def test_resend_then_verify_correct(self, fresh_user):
        # Resend (resets attempts)
        r = requests.post(f"{API}/auth/send-verification", headers=auth_headers(fresh_user["token"]), timeout=15)
        assert r.status_code == 200
        rec = _db.email_codes.find_one({"user_id": fresh_user["user"]["id"]})
        assert rec is not None
        code = rec["code"]
        r = requests.post(
            f"{API}/auth/verify-email",
            headers=auth_headers(fresh_user["token"]),
            json={"code": code},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Confirm /me shows verified now
        me = requests.get(f"{API}/auth/me", headers=auth_headers(fresh_user["token"]), timeout=15).json()
        assert me["email_verified"] is True

    def test_create_project_after_verify(self, fresh_user):
        r = requests.post(
            f"{API}/projects",
            headers=auth_headers(fresh_user["token"]),
            json={
                "title": "TEST_iter4 verified project",
                "description": "Created after email verification",
                "category": "Graphic Design",
                "budget": 100.0,
                "duration_hours": 24,
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        fresh_user["_project_id"] = r.json()["id"]


# ---------------------------------------------------------------- Profile + trust points
class TestProfileAndTrust:
    def test_patch_me_new_fields_and_trust_recompute(self, client_session):
        # Save original state
        before = requests.get(f"{API}/auth/me", headers=auth_headers(client_session["token"]), timeout=15).json()
        # Patch new fields - 5+ skills, 4+ socials, 3+ former_projects, long bio
        payload = {
            "age": 30,
            "phone": "+15551234567",
            "location": "Remote",
            "languages": ["English", "French"],
            "hourly_rate": 75.0,
            "cv_url": "/api/files/rivaloz/uploads/cv.pdf",
            "social_links": {
                "linkedin": "https://linkedin.com/in/x",
                "twitter": "https://twitter.com/x",
                "github": "https://github.com/x",
                "website": "https://example.com",
            },
            "former_projects": [
                {"title": "P1", "url": "x"}, {"title": "P2", "url": "y"}, {"title": "P3", "url": "z"},
            ],
            "bio": "x" * 130,
            "skills": ["a", "b", "c", "d", "e", "f"],
        }
        r = requests.patch(f"{API}/users/me", headers=auth_headers(client_session["token"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        after = r.json()
        assert after["age"] == 30
        assert after["phone"] == "+15551234567"
        assert after["hourly_rate"] == 75.0
        assert after["languages"] == ["English", "French"]
        assert after["social_links"]["github"] == "https://github.com/x"
        assert len(after["former_projects"]) == 3
        # Trust should increase substantially
        assert after["trust_points"] > before["trust_points"], (
            f"Trust did not increase: before={before['trust_points']} after={after['trust_points']}"
        )
        # Cap at 100
        assert after["trust_points"] <= 100

    def test_trust_ladder_monotonic_and_capped(self):
        # Compose user dicts and call public_user via API would be heavy. Instead, replicate compute_trust contract
        # by checking incremental fields applied to a fresh test user.
        from copy import deepcopy
        # Use API: register, then patch incrementally
        email = f"TEST_trust_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "demo1234", "name": "Trust Test"}, timeout=15)
        assert r.status_code == 200
        token = r.json()["token"]
        uid = r.json()["user"]["id"]
        try:
            # Baseline: unverified, no fields -> 0
            me = requests.get(f"{API}/auth/me", headers=auth_headers(token), timeout=15).json()
            assert me["trust_points"] == 0, f"Baseline trust should be 0, got {me['trust_points']}"
            last = 0
            steps = [
                {"avatar_url": "/x.png"},                                   # +5
                {"phone": "+1555"},                                         # +5
                {"bio": "y" * 130},                                         # +5
                {"skills": ["a", "b", "c", "d", "e"]},                      # +5
                {"portfolio": ["a", "b", "c"]},                             # +5
                {"social_links": {"l": "1", "t": "2"}},                     # +5 (>=2)
                {"social_links": {"l": "1", "t": "2", "g": "3", "w": "4"}}, # +5 more (>=4)
                {"former_projects": [{"t": 1}, {"t": 2}, {"t": 3}]},        # +10
                {"cv_url": "/x.pdf"},                                       # +10
            ]
            for s in steps:
                r = requests.patch(f"{API}/users/me", headers=auth_headers(token), json=s, timeout=15)
                assert r.status_code == 200
                tp = r.json()["trust_points"]
                assert tp >= last, f"Trust not monotonic: {last} → {tp} after {s}"
                last = tp
                assert tp <= 100
        finally:
            _db.users.delete_one({"id": uid})
            _db.email_codes.delete_many({"user_id": uid})


# ---------------------------------------------------------------- AI
class TestAI:
    def test_ai_chat_returns_reply(self, client_session):
        r = requests.post(
            f"{API}/ai/chat",
            headers=auth_headers(client_session["token"]),
            json={"message": "How do I price my first logo brief?", "context": "client"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "reply" in data
        assert isinstance(data["reply"], str) and len(data["reply"]) > 0
        assert "session_id" in data

    def test_ai_vetting_task_owner_paid_inprogress(self, client_session, freelancer_session):
        # Need a paid + in_progress project owned by client_session. Easiest: simulate by direct DB insert.
        pid = str(uuid.uuid4())
        proj = {
            "id": pid,
            "client_id": client_session["user"]["id"],
            "client_name": client_session["user"]["name"],
            "title": "TEST_iter4 vetting task project",
            "description": "Need a 5-page marketing website with a clean modern aesthetic.",
            "category": "Web Development",
            "budget": 500.0,
            "duration_hours": 48,
            "max_competitors": 3,
            "deliverables": "Wireframes + 1 styled mock",
            "attachments": [],
            "status": "in_progress",
            "payment_status": "paid",
            "approved_freelancer_ids": [freelancer_session["user"]["id"]],
            "competition_started_at": None,
            "competition_deadline": None,
            "winner_submission_id": None,
            "winner_user_id": None,
            "created_at": "2026-01-01T00:00:00+00:00",
        }
        _db.projects.insert_one(proj)
        try:
            r = requests.post(
                f"{API}/ai/vetting-task",
                headers=auth_headers(client_session["token"]),
                json={"project_id": pid, "freelancer_ids": [freelancer_session["user"]["id"]]},
                timeout=90,
            )
            assert r.status_code == 200, r.text
            data = r.json()
            for k in ["title", "goal", "tasks", "evaluation_criteria", "time_estimate_minutes"]:
                assert k in data, f"Missing field {k} in vetting task response: {data}"
            assert isinstance(data["tasks"], list)
            assert isinstance(data["evaluation_criteria"], list)
            assert isinstance(data["time_estimate_minutes"], int) or isinstance(data["time_estimate_minutes"], float)
        finally:
            _db.projects.delete_one({"id": pid})
