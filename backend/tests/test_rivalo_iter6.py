"""Iteration 6 — Rivalo Coach upgrade, /ai/winner-recommendation, /ai/vetting-task fairness, /contact form,
plus regression on subscription checkout gating, project payment checkout, /auth/me plan fields, /ai/chat."""
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


# ---------- fixtures ----------
@pytest.fixture(scope="session")
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


@pytest.fixture(scope="session")
def client_session():
    return _session_with_token(_login(CLIENT_EMAIL, PW))


@pytest.fixture(scope="session")
def freelancer_session():
    return _session_with_token(_login(FREELANCER_EMAIL, PW))


@pytest.fixture(scope="session")
def unverified_session(db):
    email = f"test_iter6_unv_{uuid.uuid4().hex[:6]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"email": email, "password": PW, "name": "Iter6 Unverified", "role": "client"}, timeout=15)
    assert r.status_code == 200, f"register failed: {r.text}"
    token = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    yield s, email
    db.users.delete_one({"email": email})


@pytest.fixture(scope="session")
def project_with_submission(db, client_session, freelancer_session):
    """Create a fresh project owned by client, with one submission by freelancer (direct DB insert)."""
    # Get user IDs
    me_client = client_session.get(f"{API}/auth/me", timeout=10).json()
    me_free = freelancer_session.get(f"{API}/auth/me", timeout=10).json()
    client_id = me_client["id"]
    free_id = me_free["id"]

    # Create project via API (verified)
    r = client_session.post(f"{API}/projects", json={
        "title": "TEST_iter6_winner_proj",
        "description": "Iter6 testing project for winner recommendation.",
        "category": "Design",
        "budget": 200.0,
        "duration_hours": 48,
        "max_competitors": 3,
        "deliverables": "Logo files PNG + SVG",
    }, timeout=15)
    assert r.status_code == 200, f"create project failed: {r.text}"
    pid = r.json()["id"]

    # Direct DB insert of a submission so test does not depend on full apply/approve workflow.
    sub_id = f"TEST_iter6_sub_{uuid.uuid4().hex[:6]}"
    from datetime import datetime, timezone
    db.submissions.insert_one({
        "id": sub_id,
        "project_id": pid,
        "user_id": free_id,
        "description": "Polished, modern logo in three concepts; clean SVG output; rationale included.",
        "files": [],
        "url": "https://example.com/portfolio/test-iter6",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    yield {"project_id": pid, "client_id": client_id, "freelancer_id": free_id, "submission_id": sub_id}

    # cleanup
    db.submissions.delete_many({"project_id": pid})
    db.projects.delete_one({"id": pid})


# ---------- /api/contact ----------
class TestContactForm:
    def test_contact_valid_persists_doc(self, db):
        payload = {
            "name": "TEST_iter6_Contact",
            "email": "TEST_iter6_contact@example.com",
            "subject": "general",
            "message": "Hello, this is a test message that is well over ten characters long.",
        }
        r = requests.post(f"{API}/contact", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert "ticket_id" in data and isinstance(data["ticket_id"], str) and len(data["ticket_id"]) > 0
        doc = db.contact_messages.find_one({"id": data["ticket_id"]})
        assert doc is not None, "contact_messages doc not persisted"
        assert doc["email"] == payload["email"].lower()
        assert doc["subject"] == "general"
        # cleanup
        db.contact_messages.delete_one({"id": data["ticket_id"]})

    def test_contact_honeypot_silently_dropped(self, db):
        payload = {
            "name": "TEST_iter6_Bot",
            "email": "TEST_iter6_bot@example.com",
            "subject": "general",
            "message": "I am a bot trying to send spam content here.",
            "honeypot": "buy-cheap-meds",
        }
        # snapshot before
        before = db.contact_messages.count_documents({"email": payload["email"].lower()})
        r = requests.post(f"{API}/contact", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert "ticket_id" not in data, "honeypot should NOT return ticket_id"
        after = db.contact_messages.count_documents({"email": payload["email"].lower()})
        assert after == before, "honeypot doc was persisted but must be dropped"

    def test_contact_short_message_422(self):
        r = requests.post(f"{API}/contact", json={
            "name": "X",
            "email": "TEST_iter6_short@example.com",
            "subject": "general",
            "message": "hi",  # < 10 chars
        }, timeout=10)
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


# ---------- /api/ai/winner-recommendation ----------
class TestWinnerRecommendation:
    def test_owner_with_submissions_returns_ranked_and_winner(self, client_session, project_with_submission):
        pid = project_with_submission["project_id"]
        r = client_session.post(f"{API}/ai/winner-recommendation", json={"project_id": pid}, timeout=60)
        # 502 is acceptable (LLM offline / rate limit) per problem statement
        if r.status_code == 502:
            pytest.skip("AI offline (502) — acceptable per spec")
        assert r.status_code == 200, f"unexpected: {r.status_code} {r.text}"
        data = r.json()
        assert "ranked" in data and isinstance(data["ranked"], list)
        assert "winner_user_id" in data
        assert "winner_explanation" in data and isinstance(data["winner_explanation"], str)
        assert len(data["winner_explanation"]) > 0

    def test_non_owner_403(self, freelancer_session, project_with_submission):
        pid = project_with_submission["project_id"]
        r = freelancer_session.post(f"{API}/ai/winner-recommendation", json={"project_id": pid}, timeout=20)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

    def test_owner_zero_submissions_returns_400(self, client_session, db):
        # Create a fresh project with no submissions
        r = client_session.post(f"{API}/projects", json={
            "title": "TEST_iter6_zerosubs",
            "description": "Project with no submissions for 400 test.",
            "category": "Design",
            "budget": 100.0,
            "duration_hours": 24,
            "max_competitors": 3,
            "deliverables": "Anything",
        }, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        try:
            r2 = client_session.post(f"{API}/ai/winner-recommendation", json={"project_id": pid}, timeout=20)
            assert r2.status_code == 400, f"expected 400, got {r2.status_code}: {r2.text}"
        finally:
            db.projects.delete_one({"id": pid})


# ---------- /api/ai/vetting-task ----------
class TestVettingTaskFairness:
    def test_vetting_task_returns_fairness_fields(self, client_session, project_with_submission):
        pid = project_with_submission["project_id"]
        free_id = project_with_submission["freelancer_id"]
        r = client_session.post(f"{API}/ai/vetting-task",
                                json={"project_id": pid, "freelancer_ids": [free_id]},
                                timeout=60)
        if r.status_code == 502:
            pytest.skip("AI offline (502) — acceptable per spec")
        assert r.status_code == 200, f"unexpected: {r.status_code} {r.text}"
        data = r.json()
        # The endpoint guarantees fairness fields in fallback. Verify they are present.
        for k in ("fairness_score", "difficulty", "fairness_reasoning"):
            assert k in data, f"missing field {k} in vetting-task response: {list(data.keys())}"
        # constraints
        try:
            fs = int(data["fairness_score"])
            assert 0 <= fs <= 100, f"fairness_score out of range: {fs}"
        except (TypeError, ValueError):
            pytest.fail(f"fairness_score not an int-able value: {data['fairness_score']!r}")
        assert data["difficulty"] in ("easy", "medium", "hard"), f"difficulty unexpected: {data['difficulty']}"
        assert isinstance(data["fairness_reasoning"], str)


# ---------- Regression: subscription checkout unverified ----------
class TestRegressionSubscriptionUnverified:
    def test_unverified_blocked_403(self, unverified_session):
        s, email = unverified_session
        r = s.post(f"{API}/subscriptions/checkout",
                   json={"plan": "pro", "origin_url": BASE_URL}, timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"


# ---------- Regression: project payment checkout ----------
class TestRegressionProjectCheckout:
    def test_project_payment_checkout_returns_stripe_url(self, client_session, db):
        # Create a fresh draft project using the *correct* ProjectCreate schema
        r = client_session.post(f"{API}/projects", json={
            "title": "TEST_iter6_paychk",
            "description": "Regression project for payment checkout test.",
            "category": "Web Development",
            "budget": 150.0,
            "duration_hours": 24,
            "max_competitors": 3,
            "deliverables": "Single-page landing build.",
        }, timeout=15)
        assert r.status_code == 200, r.text
        proj = r.json()
        pid = proj["id"]
        try:
            r2 = client_session.post(f"{API}/payments/checkout",
                                     json={"project_id": pid, "origin_url": BASE_URL}, timeout=25)
            assert r2.status_code == 200, f"{r2.status_code} {r2.text}"
            data = r2.json()
            assert "url" in data and "stripe.com" in data["url"]
        finally:
            db.projects.delete_one({"id": pid})


# ---------- Regression: /auth/me plan fields ----------
class TestRegressionMePlan:
    def test_me_default_plan_free(self, db):
        # register a fresh user for plan defaults
        email = f"test_iter6_meplan_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/auth/register",
                          json={"email": email, "password": PW, "name": "Iter6 Meplan", "role": "client"},
                          timeout=15)
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        try:
            s = _session_with_token(token)
            me = s.get(f"{API}/auth/me", timeout=10).json()
            assert me.get("plan") == "free", f"default plan should be 'free', got {me.get('plan')}"
            assert "plan_expires_at" in me, "plan_expires_at key missing from /me"
        finally:
            db.users.delete_one({"email": email})


# ---------- Regression: /ai/chat with new RIVALO_COACH_SYS prompt ----------
class TestRegressionAiChat:
    def test_chat_returns_non_empty_reply(self, client_session):
        r = client_session.post(f"{API}/ai/chat",
                                json={"message": "Give me one short pricing tip for a new logo brief.",
                                      "context": "client"},
                                timeout=45)
        if r.status_code == 502:
            pytest.skip("AI offline (502) — acceptable per spec")
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert "reply" in data and isinstance(data["reply"], str) and len(data["reply"].strip()) > 0
        assert "session_id" in data
