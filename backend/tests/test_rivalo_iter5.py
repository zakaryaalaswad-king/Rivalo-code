"""Iteration 5 — Subscriptions (Basic/Pro/Business), /me plan fields, sanity for project bounty checkout."""
import os
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "freelancer_comp")
API = f"{BASE_URL}/api"

CLIENT_EMAIL = "client@demo.com"
CLIENT_PW = "demo1234"

# ---------- fixtures ----------
@pytest.fixture(scope="session")
def db():
    return MongoClient(MONGO_URL)[DB_NAME]

@pytest.fixture(scope="session")
def client_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PW}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s

@pytest.fixture(scope="session")
def unverified_session(db):
    # register fresh unverified user
    import uuid
    email = f"test_iter5_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "demo1234", "name": "Iter5 Unverified", "role": "client"}, timeout=15)
    assert r.status_code == 200, f"register failed: {r.text}"
    token = r.json().get("token")
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    yield s, email
    # cleanup
    db.users.delete_one({"email": email})


# ---------- Plans endpoint ----------
class TestSubscriptionPlans:
    def test_get_plans_returns_three_with_eur_prices(self, client_session):
        r = client_session.get(f"{API}/subscriptions/plans", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert set(data.keys()) == {"basic", "pro", "business"}, data.keys()
        assert data["basic"]["price"] == 7.99
        assert data["pro"]["price"] == 14.99
        assert data["business"]["price"] == 29.99
        for k in ("basic", "pro", "business"):
            assert data[k]["currency"] == "eur"
            assert "name" in data[k]


# ---------- /me plan fields ----------
class TestMePlanFields:
    def test_me_returns_plan_and_plan_expires(self, client_session):
        r = client_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        me = r.json()
        assert "plan" in me, "plan key missing from /me"
        assert "plan_expires_at" in me, "plan_expires_at key missing from /me"
        # default should be free + null (unless previously activated)
        assert me["plan"] in ("free", "basic", "pro", "business")


# ---------- Checkout: verified ----------
class TestSubscriptionCheckoutVerified:
    def test_checkout_pro_returns_stripe_url(self, client_session, db):
        r = client_session.post(
            f"{API}/subscriptions/checkout",
            json={"plan": "pro", "origin_url": BASE_URL},
            timeout=20,
        )
        assert r.status_code == 200, f"unexpected: {r.status_code} {r.text}"
        data = r.json()
        for k in ("url", "session_id", "amount", "currency"):
            assert k in data, f"missing {k}"
        assert "stripe.com" in data["url"]
        assert data["amount"] == 14.99
        assert data["currency"] == "eur"
        # transaction doc persisted with kind=subscription
        tx = db.payment_transactions.find_one({"session_id": data["session_id"]})
        assert tx is not None, "payment_transactions row not created"
        assert tx.get("kind") == "subscription"
        assert tx.get("plan") == "pro"

    def test_checkout_invalid_plan_returns_4xx(self, client_session):
        r = client_session.post(f"{API}/subscriptions/checkout",
                                json={"plan": "platinum", "origin_url": BASE_URL}, timeout=10)
        assert r.status_code in (400, 422)


# ---------- Checkout: unverified ----------
class TestSubscriptionCheckoutUnverified:
    def test_unverified_user_blocked_403(self, unverified_session):
        s, email = unverified_session
        r = s.post(f"{API}/subscriptions/checkout",
                   json={"plan": "pro", "origin_url": BASE_URL}, timeout=10)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"


# ---------- Simulate paid subscription ----------
class TestSimulatedActivation:
    def test_simulate_paid_pro_then_me_reflects_plan(self, client_session, db):
        # find client user
        r = client_session.get(f"{API}/auth/me").json()
        uid = r["id"]
        original_plan = r.get("plan", "free")
        original_expires = r.get("plan_expires_at")
        # insert a paid tx (already created by previous test perhaps, but make a fresh one)
        from datetime import datetime, timedelta, timezone
        tx_id = "TEST_iter5_tx_simpaid"
        db.payment_transactions.insert_one({
            "id": tx_id,
            "session_id": "TEST_iter5_sess_simpaid",
            "user_id": uid,
            "amount": 14.99,
            "currency": "eur",
            "kind": "subscription",
            "plan": "pro",
            "payment_status": "paid",
            "status": "complete",
            "metadata": {"kind": "subscription", "plan": "pro", "user_id": uid},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        db.users.update_one({"id": uid}, {"$set": {"plan": "pro", "plan_expires_at": expires}})
        try:
            me = client_session.get(f"{API}/auth/me", timeout=10).json()
            assert me["plan"] == "pro"
            assert me["plan_expires_at"] == expires
        finally:
            # restore
            db.users.update_one({"id": uid}, {"$set": {"plan": original_plan, "plan_expires_at": original_expires}})
            db.payment_transactions.delete_one({"id": tx_id})


# ---------- Sanity: project-bounty checkout still works ----------
class TestProjectBountyCheckoutSanity:
    def test_project_payment_checkout_still_returns_url(self, client_session, db):
        # find an existing project owned by the client (status open or in_progress)
        me = client_session.get(f"{API}/auth/me").json()
        uid = me["id"]
        proj = db.projects.find_one({"owner_id": uid})
        if not proj:
            # create a quick one
            r = client_session.post(f"{API}/projects", json={
                "title": "TEST_iter5_sanity_project",
                "description": "Sanity test bounty checkout — auto created.",
                "category": "Web Development",
                "bounty": 100.0,
                "deadline_days": 7,
            }, timeout=10)
            assert r.status_code == 200, r.text
            proj = r.json()
        pid = proj["id"]
        r = client_session.post(f"{API}/payments/checkout",
                                json={"project_id": pid, "origin_url": BASE_URL}, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert "url" in data and "stripe.com" in data["url"]
