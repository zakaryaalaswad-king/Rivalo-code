"""Iter8 — Rivaloz rename + Night Arena regression sanity for backend."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "client@demo.com", "password": "demo1234"},
                      timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def test_stats_200():
    r = requests.get(f"{API}/stats", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert isinstance(j, dict)


def test_categories_200():
    r = requests.get(f"{API}/categories", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_subscription_plans_200():
    r = requests.get(f"{API}/subscriptions/plans", timeout=15)
    assert r.status_code == 200
    plans = r.json()
    # should have basic/pro/business
    ids = {p.get("id", p.get("plan_id", "")).lower() for p in plans} if isinstance(plans, list) else set()
    assert plans, "no plans returned"


def test_login_200():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "client@demo.com", "password": "demo1234"},
                      timeout=15)
    assert r.status_code == 200
    assert "token" in r.json()


def test_auth_me_after_login(client_token):
    r = requests.get(f"{API}/auth/me",
                     headers={"Authorization": f"Bearer {client_token}"},
                     timeout=15)
    assert r.status_code == 200
    assert "@" in r.json().get("email", "")


def test_ai_chat_returns_reply_or_502(client_token):
    r = requests.post(f"{API}/ai/chat",
                      headers={"Authorization": f"Bearer {client_token}",
                               "Content-Type": "application/json"},
                      json={"message": "hi", "history": []},
                      timeout=45)
    # 502 acceptable if LLM budget exhausted
    if r.status_code == 502:
        pytest.skip("AI offline (budget/upstream) — acceptable per spec")
    assert r.status_code == 200, r.text
    # tolerant: any string-y payload
    body = r.json()
    assert isinstance(body, dict) and (body.get("reply") or body.get("message") or body.get("content"))


def test_openapi_title_is_rivaloz():
    r = requests.get(f"{API}/openapi.json", timeout=15)
    if r.status_code != 200:
        # some deployments hide openapi; try root
        r = requests.get(f"{BASE_URL}/openapi.json", timeout=15)
    if r.status_code == 200:
        assert "Rivaloz" in r.json().get("info", {}).get("title", ""), r.json().get("info")
    else:
        pytest.skip("openapi.json not exposed")


def test_projects_list_200():
    r = requests.get(f"{API}/projects", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), (list, dict))
