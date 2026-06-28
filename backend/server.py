from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import asyncio
import logging
import uuid
import random
import bcrypt
import jwt
import resend
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, Header
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import requests

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

# ------------------------------------------------------------------ Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("rivalo")

# ------------------------------------------------------------------ Config
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_NAME = os.environ.get("APP_NAME", "Rivalo")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_SLUG = "rivalo"
_storage_key: Optional[str] = None

def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_LLM_KEY:
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        r.raise_for_status()
        _storage_key = r.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(503, "Storage not available")
    r = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if r.status_code == 403:
        # token may have expired — reinit once
        globals()["_storage_key"] = None
        key = init_storage()
        r = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    r.raise_for_status()
    return r.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(503, "Storage not available")
    r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if r.status_code == 403:
        globals()["_storage_key"] = None
        key = init_storage()
        r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")

resend.api_key = RESEND_API_KEY

# ------------------------------------------------------------------ Mongo
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ------------------------------------------------------------------ App
app = FastAPI(title="Rivalo API")
api = APIRouter(prefix="/api")

# ------------------------------------------------------------------ Utility
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode(
        {
            "sub": user_id,
            "email": email,
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
        },
        JWT_SECRET,
        algorithm=JWT_ALGO,
    )

def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "headline": u.get("headline", ""),
        "bio": u.get("bio", ""),
        "skills": u.get("skills", []),
        "portfolio": u.get("portfolio", []),
        "avatar_url": u.get("avatar_url", ""),
        "rating": u.get("rating", 0),
        "completed": u.get("completed", 0),
        "wins": u.get("wins", 0),
        "created_at": u.get("created_at"),
        "age": u.get("age"),
        "phone": u.get("phone", ""),
        "phone_verified": u.get("phone_verified", False),
        "email_verified": u.get("email_verified", False),
        "location": u.get("location", ""),
        "languages": u.get("languages", []),
        "hourly_rate": u.get("hourly_rate"),
        "available": u.get("available", True),
        "cv_url": u.get("cv_url", ""),
        "social_links": u.get("social_links", {}),
        "former_projects": u.get("former_projects", []),
        "payout_methods": u.get("payout_methods", {}),  # {paypal_email, visa_last4, bank_iban, bank_name, wise_email, crypto_wallet}
        "plan": u.get("plan", "free"),
        "plan_expires_at": u.get("plan_expires_at"),
        "trust_points": compute_trust(u),
    }

def compute_trust(u: dict) -> int:
    pts = 0
    if u.get("avatar_url"): pts += 5
    if u.get("email_verified"): pts += 10
    if u.get("phone"): pts += 5
    if u.get("phone_verified"): pts += 5
    if u.get("cv_url"): pts += 10
    if len((u.get("bio") or "")) >= 120: pts += 5
    if len(u.get("skills") or []) >= 5: pts += 5
    if len(u.get("portfolio") or []) >= 3: pts += 5
    socials = u.get("social_links") or {}
    n_soc = sum(1 for v in socials.values() if v)
    if n_soc >= 2: pts += 5
    if n_soc >= 4: pts += 5
    if len(u.get("former_projects") or []) >= 3: pts += 10
    wins = int(u.get("wins") or 0)
    if wins >= 1: pts += 15
    if wins >= 3: pts += 15
    if wins >= 5: pts += 10
    return min(pts, 100)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def send_email_async(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.info(f"[email mock] to={to} subj={subject}")
        return
    try:
        await asyncio.to_thread(
            resend.Emails.send,
            {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html},
        )
    except Exception as e:
        logger.error(f"Email send failed to {to}: {e}")

# Inline Rivalo logo (SVG) — works in all email clients
RIVALO_LOGO_SVG = (
    "<svg width='40' height='40' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'>"
    "<rect x='2' y='2' width='44' height='44' fill='none' stroke='#D4AF37' stroke-width='1.5'/>"
    "<path d='M6 6 L24 24 L6 42 Z' fill='#D4AF37'/>"
    "<path d='M42 6 L24 24 L42 42 Z' fill='#A855F7'/>"
    "<circle cx='24' cy='24' r='2.2' fill='#FFFFFF'/></svg>"
)

def email_shell(title: str, body_html: str) -> str:
    """Wrap content in branded Rivalo email template."""
    return f"""
    <div style='font-family:Arial,Helvetica,sans-serif;background:#050614;padding:32px 16px;'>
      <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='max-width:600px;margin:0 auto;background:#0A0C22;border:1px solid rgba(212,175,55,0.3);'>
        <tr><td style='padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);'>
          <table role='presentation' cellpadding='0' cellspacing='0'>
            <tr>
              <td style='vertical-align:middle;padding-right:12px;'>{RIVALO_LOGO_SVG}</td>
              <td style='vertical-align:middle;font-family:Georgia,serif;font-size:24px;color:#F8FAFC;letter-spacing:-0.5px;'>Rival<span style='color:#D4AF37;font-style:italic;'>o</span></td>
            </tr>
          </table>
        </td></tr>
        <tr><td style='padding:32px;color:#F8FAFC;'>
          <h1 style='font-family:Georgia,serif;color:#D4AF37;margin:0 0 16px;font-size:28px;'>{title}</h1>
          {body_html}
        </td></tr>
        <tr><td style='padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);color:#64748B;font-size:12px;'>
          Rivalo · the competitive freelance arena · You're receiving this because of activity on your account.
        </td></tr>
      </table>
    </div>"""

# ------------------------------------------------------------------ Notifications
async def push_notification(user_id: str, kind: str, title: str, message: str, link: str = ""):
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": user_id,
        "kind": kind,  # approved | rejected | won | new_applicant | submission
        "title": title,
        "message": message,
        "link": link,
        "read": False,
        "created_at": now_iso(),
    })

# ------------------------------------------------------------------ Models
class RegisterReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    portfolio: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    languages: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    available: Optional[bool] = None
    cv_url: Optional[str] = None
    social_links: Optional[dict] = None
    former_projects: Optional[List[dict]] = None
    payout_methods: Optional[dict] = None

class EmailVerifyReq(BaseModel):
    code: str = Field(min_length=4, max_length=8)

class AiChatReq(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None
    context: Optional[str] = "general"  # general | client | freelancer

class AiTaskReq(BaseModel):
    project_id: str
    freelancer_ids: List[str]

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=10)
    category: str
    budget: float = Field(gt=0)
    duration_hours: int = Field(ge=2, le=120)
    max_competitors: int = Field(ge=1, le=10, default=3)
    deliverables: str = ""
    attachments: List[str] = []

class ApplyReq(BaseModel):
    pitch: str = Field(min_length=10)
    sample_url: Optional[str] = ""

class ApproveReq(BaseModel):
    application_ids: List[str]

class SubmitWorkReq(BaseModel):
    description: str
    files: List[str] = []
    url: Optional[str] = ""

class PickWinnerReq(BaseModel):
    submission_id: str

class CheckoutInitReq(BaseModel):
    project_id: str
    origin_url: str

class SubscriptionInitReq(BaseModel):
    plan: Literal["basic", "pro", "business"]
    origin_url: str

PLANS = {
    "basic":    {"name": "Basic",    "price": 7.99,  "currency": "eur", "color": "#22C55E"},
    "pro":      {"name": "Pro",      "price": 14.99, "currency": "eur", "color": "#3B82F6"},
    "business": {"name": "Business", "price": 29.99, "currency": "eur", "color": "#A855F7"},
}

CATEGORIES = [
    "Graphic Design", "Web Development", "Mobile Development", "Writing & Translation",
    "Video & Animation", "Music & Audio", "Marketing & SEO", "Data & Analytics",
    "UX/UI Design", "3D & Illustration", "Business Consulting", "AI & ML",
]

# ------------------------------------------------------------------ Auth routes
@api.post("/auth/register")
async def register(req: RegisterReq, response: Response):
    email = req.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    user = {
        "id": new_id(),
        "email": email,
        "name": req.name,
        "password_hash": hash_password(req.password),
        "headline": "",
        "bio": "",
        "skills": [],
        "portfolio": [],
        "avatar_url": "",
        "rating": 0,
        "completed": 0,
        "wins": 0,
        "email_verified": False,
        "phone": "",
        "phone_verified": False,
        "age": None,
        "location": "",
        "languages": [],
        "hourly_rate": None,
        "available": True,
        "cv_url": "",
        "social_links": {},
        "former_projects": [],
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    await issue_email_code(user)
    token = create_access_token(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"user": public_user(user), "token": token, "verification_sent": True}

@api.post("/auth/login")
async def login(req: LoginReq, response: Response):
    email = req.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"user": public_user(user), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)

async def require_verified(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("email_verified"):
        raise HTTPException(403, "Please verify your email before performing this action.")
    return user

async def issue_email_code(user: dict):
    code = f"{random.randint(0, 999999):06d}"
    await db.email_codes.delete_many({"user_id": user["id"]})
    await db.email_codes.insert_one({
        "id": new_id(),
        "user_id": user["id"],
        "code": code,
        "created_at": now_iso(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
        "attempts": 0,
    })
    body = f"""
      <p style='margin:0 0 12px;'>Hi {user.get('name','')},</p>
      <p style='margin:0 0 16px;'>Your Rivalo verification code:</p>
      <div style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#3B82F6;background:rgba(59,130,246,0.08);padding:16px;text-align:center;border-radius:12px;border:1px solid rgba(59,130,246,0.3);'>{code}</div>
      <p style='margin:16px 0 0;color:#94A3B8;font-size:13px;'>This code expires in 15 minutes. If you didn't request it, ignore this email.</p>"""
    asyncio.create_task(send_email_async(user["email"], "Your Rivalo verification code", email_shell("Verify your email", body)))
    logger.info(f"[verify] code for {user['email']}: {code}")  # also logged for sandbox testing

@api.post("/auth/send-verification")
async def send_verification(user: dict = Depends(get_current_user)):
    if user.get("email_verified"):
        return {"ok": True, "already_verified": True}
    await issue_email_code(user)
    return {"ok": True}

@api.post("/auth/verify-email")
async def verify_email(body: EmailVerifyReq, user: dict = Depends(get_current_user)):
    if user.get("email_verified"):
        return {"ok": True, "already_verified": True}
    rec = await db.email_codes.find_one({"user_id": user["id"]})
    if not rec:
        raise HTTPException(400, "No code requested. Request a new one.")
    if rec["attempts"] >= 5:
        raise HTTPException(429, "Too many attempts. Request a new code.")
    if datetime.fromisoformat(rec["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(400, "Code expired. Request a new one.")
    await db.email_codes.update_one({"id": rec["id"]}, {"$inc": {"attempts": 1}})
    if (body.code or "").strip() != rec["code"]:
        raise HTTPException(400, "Invalid code")
    await db.users.update_one({"id": user["id"]}, {"$set": {"email_verified": True}})
    await db.email_codes.delete_many({"user_id": user["id"]})
    await push_notification(user["id"], "verified", "Email verified", "Your Rivalo account is now trusted (+10 points).")
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"ok": True, "user": public_user(fresh)}

# ------------------------------------------------------------------ Profile
@api.patch("/users/me")
async def update_me(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(fresh)

@api.get("/users/{user_id}")
async def get_user(user_id: str):
    u = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(404, "Not found")
    return public_user(u)

@api.get("/categories")
async def get_categories():
    return CATEGORIES

# ------------------------------------------------------------------ Projects
def project_view(p: dict) -> dict:
    p = {k: v for k, v in p.items() if k != "_id"}
    return p

@api.post("/projects")
async def create_project(body: ProjectCreate, user: dict = Depends(require_verified)):
    project = {
        "id": new_id(),
        "client_id": user["id"],
        "client_name": user.get("name", ""),
        "title": body.title,
        "description": body.description,
        "category": body.category,
        "budget": body.budget,
        "duration_hours": body.duration_hours,
        "max_competitors": body.max_competitors,
        "deliverables": body.deliverables,
        "attachments": body.attachments,
        # lifecycle: draft -> open -> in_progress -> completed -> closed
        "status": "draft",
        "payment_status": "unpaid",
        "stripe_session_id": None,
        "approved_freelancer_ids": [],
        "competition_started_at": None,
        "competition_deadline": None,
        "winner_submission_id": None,
        "winner_user_id": None,
        "created_at": now_iso(),
    }
    await db.projects.insert_one(project)
    return project_view(project)

@api.get("/projects")
async def list_projects(
    category: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    mine: Optional[bool] = False,
    request: Request = None,
):
    query: dict = {}
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["open", "in_progress", "completed"]}
    if category and category != "All":
        query["category"] = category
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    if mine:
        user = await get_current_user(request)
        query["client_id"] = user["id"]
        query.pop("status", None)  # show all statuses for mine
    cursor = db.projects.find(query, {"_id": 0}).sort("created_at", -1).limit(100)
    return await cursor.to_list(100)

@api.get("/projects/{project_id}")
async def get_project(project_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Project not found")
    return p

# ------------------------------------------------------------------ Applications
@api.post("/projects/{project_id}/apply")
async def apply_to_project(project_id: str, body: ApplyReq, user: dict = Depends(require_verified)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["status"] != "open":
        raise HTTPException(400, "Project is not open for applications")
    if project["client_id"] == user["id"]:
        raise HTTPException(400, "Cannot apply to your own project")
    existing = await db.applications.find_one({"project_id": project_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Already applied")
    app_doc = {
        "id": new_id(),
        "project_id": project_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_headline": user.get("headline", ""),
        "user_avatar": user.get("avatar_url", ""),
        "pitch": body.pitch,
        "sample_url": body.sample_url,
        "status": "pending",  # pending | approved | rejected
        "created_at": now_iso(),
    }
    await db.applications.insert_one(app_doc)
    await push_notification(project["client_id"], "new_applicant", "New applicant", f"{user.get('name','Someone')} applied to {project['title']}", f"/projects/{project_id}")
    return {k: v for k, v in app_doc.items() if k != "_id"}

@api.get("/projects/{project_id}/applications")
async def list_applications(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["client_id"] != user["id"]:
        raise HTTPException(403, "Only the project owner can view applications")
    cursor = db.applications.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(200)

@api.post("/projects/{project_id}/approve")
async def approve_applications(project_id: str, body: ApproveReq, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if project["status"] != "open":
        raise HTTPException(400, "Project not open")
    if len(body.application_ids) == 0:
        raise HTTPException(400, "Pick at least one applicant")
    if len(body.application_ids) > project["max_competitors"]:
        raise HTTPException(400, f"Max {project['max_competitors']} competitors")
    apps = await db.applications.find({"id": {"$in": body.application_ids}, "project_id": project_id}).to_list(50)
    if len(apps) != len(body.application_ids):
        raise HTTPException(400, "Invalid applications")
    approved_user_ids = [a["user_id"] for a in apps]
    started = datetime.now(timezone.utc)
    deadline = started + timedelta(hours=project["duration_hours"])
    await db.applications.update_many(
        {"id": {"$in": body.application_ids}}, {"$set": {"status": "approved"}}
    )
    await db.applications.update_many(
        {"project_id": project_id, "id": {"$nin": body.application_ids}},
        {"$set": {"status": "rejected"}},
    )
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": "in_progress",
            "approved_freelancer_ids": approved_user_ids,
            "competition_started_at": started.isoformat(),
            "competition_deadline": deadline.isoformat(),
        }},
    )
    # Notify approved freelancers
    approved_users = await db.users.find({"id": {"$in": approved_user_ids}}, {"_id": 0}).to_list(50)
    rejected_apps = await db.applications.find({"project_id": project_id, "status": "rejected"}, {"_id": 0}).to_list(50)
    deadline_str = deadline.strftime("%b %d, %Y at %H:%M UTC")
    for u in approved_users:
        body = f"""
          <p style='margin:0 0 12px;'>Hi {u.get('name','Freelancer')},</p>
          <p style='margin:0 0 12px;'>You've been approved to compete for <strong style='color:#D4AF37;'>{project['title']}</strong>.</p>
          <table cellpadding='0' cellspacing='0' style='margin:16px 0;'>
            <tr><td style='padding:4px 16px 4px 0;color:#94A3B8;'>Bounty</td><td style='color:#D4AF37;font-family:monospace;'>${project['budget']}</td></tr>
            <tr><td style='padding:4px 16px 4px 0;color:#94A3B8;'>Deadline</td><td>{deadline_str}</td></tr>
            <tr><td style='padding:4px 16px 4px 0;color:#94A3B8;'>Competitors</td><td>{len(approved_user_ids)}</td></tr>
          </table>
          <p style='margin:24px 0 0;'>Head to your dashboard and submit your best work before the timer runs out.</p>"""
        asyncio.create_task(send_email_async(u["email"], f"You're in the arena: {project['title']}", email_shell("You're in the arena", body)))
        await push_notification(u["id"], "approved", "Approved to compete", f"{project['title']} · deadline {deadline_str}", f"/projects/{project_id}")
    for a in rejected_apps:
        u = await db.users.find_one({"id": a["user_id"]}, {"_id": 0})
        if u:
            body = f"<p>Hi {u.get('name','')},</p><p>Thanks for applying to <strong>{project['title']}</strong>. The client chose other competitors this round. New briefs post daily on Rivalo.</p>"
            asyncio.create_task(send_email_async(u["email"], f"Update on {project['title']}", email_shell("Not this round", body)))
            await push_notification(u["id"], "rejected", "Not selected", f"You weren't picked for {project['title']}.", f"/projects/{project_id}")
    refreshed = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return refreshed

# ------------------------------------------------------------------ Submissions
@api.post("/projects/{project_id}/submit")
async def submit_work(project_id: str, body: SubmitWorkReq, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["status"] != "in_progress":
        raise HTTPException(400, "Competition not active")
    if user["id"] not in project["approved_freelancer_ids"]:
        raise HTTPException(403, "Not approved for this competition")
    deadline = datetime.fromisoformat(project["competition_deadline"])
    if datetime.now(timezone.utc) > deadline:
        raise HTTPException(400, "Deadline passed")
    existing = await db.submissions.find_one({"project_id": project_id, "user_id": user["id"]})
    doc = {
        "id": existing["id"] if existing else new_id(),
        "project_id": project_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_avatar": user.get("avatar_url", ""),
        "description": body.description,
        "files": body.files,
        "url": body.url,
        "submitted_at": now_iso(),
    }
    if existing:
        await db.submissions.update_one({"id": existing["id"]}, {"$set": doc})
    else:
        await db.submissions.insert_one(doc)
        await push_notification(project["client_id"], "submission", "New submission", f"{user.get('name','A competitor')} submitted work for {project['title']}", f"/projects/{project_id}")
    return {k: v for k, v in doc.items() if k != "_id"}

@api.get("/projects/{project_id}/submissions")
async def list_submissions(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    is_owner = project["client_id"] == user["id"]
    is_competitor = user["id"] in project["approved_freelancer_ids"]
    if not (is_owner or is_competitor):
        raise HTTPException(403, "Forbidden")
    cursor = db.submissions.find({"project_id": project_id}, {"_id": 0}).sort("submitted_at", -1)
    subs = await cursor.to_list(50)
    if not is_owner:
        subs = [s for s in subs if s["user_id"] == user["id"]]
    return subs

@api.post("/projects/{project_id}/pick-winner")
async def pick_winner(project_id: str, body: PickWinnerReq, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if project["status"] != "in_progress":
        raise HTTPException(400, "Project not in progress")
    sub = await db.submissions.find_one({"id": body.submission_id, "project_id": project_id})
    if not sub:
        raise HTTPException(404, "Submission not found")
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"status": "completed", "winner_submission_id": sub["id"], "winner_user_id": sub["user_id"]}},
    )
    await db.users.update_one({"id": sub["user_id"]}, {"$inc": {"wins": 1, "completed": 1}})
    winner = await db.users.find_one({"id": sub["user_id"]}, {"_id": 0})
    if winner:
        body = f"<p>Congratulations on winning <strong>{project['title']}</strong> — a <span style='color:#D4AF37;font-family:monospace;'>${project['budget']}</span> bounty. The client will be in touch shortly.</p>"
        asyncio.create_task(send_email_async(winner["email"], f"You won: {project['title']}", email_shell("You won.", body)))
        await push_notification(winner["id"], "won", "You won!", f"Bounty of ${project['budget']} for {project['title']}", f"/projects/{project_id}")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api.get("/dashboard/freelancer")
async def freelancer_dashboard(user: dict = Depends(get_current_user)):
    applied = await db.applications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    pids = list({a["project_id"] for a in applied})
    projects = await db.projects.find({"id": {"$in": pids}}, {"_id": 0}).to_list(200)
    pmap = {p["id"]: p for p in projects}
    competitions = []
    for a in applied:
        p = pmap.get(a["project_id"])
        if p:
            competitions.append({"application": a, "project": p})
    return {"competitions": competitions}

# ------------------------------------------------------------------ Payments
@api.post("/payments/checkout")
async def create_checkout(body: CheckoutInitReq, request: Request, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": body.project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if project["payment_status"] == "paid":
        raise HTTPException(400, "Already paid")
    amount = float(project["budget"])  # server-side amount
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_co = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&project_id={project['id']}"
    cancel_url = f"{origin}/projects/{project['id']}"
    co_req = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"project_id": project["id"], "client_id": user["id"], "kind": "project_bounty"},
    )
    session = await stripe_co.create_checkout_session(co_req)
    await db.payment_transactions.insert_one({
        "id": new_id(),
        "session_id": session.session_id,
        "project_id": project["id"],
        "user_id": user["id"],
        "amount": amount,
        "currency": "usd",
        "payment_status": "initiated",
        "status": "open",
        "metadata": {"project_id": project["id"], "client_id": user["id"]},
        "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.session_id}

@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_co = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_co.get_checkout_status(session_id)
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(404, "Transaction not found")
    if tx["payment_status"] != "paid" and status.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "status": status.status, "paid_at": now_iso()}},
        )
        meta = tx.get("metadata") or {}
        if tx.get("kind") == "subscription" or meta.get("kind") == "subscription":
            uid = meta.get("user_id") or tx.get("user_id")
            plan = meta.get("plan") or tx.get("plan")
            if uid and plan:
                expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                await db.users.update_one({"id": uid}, {"$set": {"plan": plan, "plan_expires_at": expires}})
                await push_notification(uid, "subscription", f"{PLANS[plan]['name']} active", f"Your {PLANS[plan]['name']} subscription is active for 30 days.", "/profile")
        else:
            project_id = tx["metadata"].get("project_id")
            if project_id:
                await db.projects.update_one(
                    {"id": project_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"payment_status": "paid", "status": "open"}},
                )
    else:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status}},
        )
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "metadata": status.metadata,
    }

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_co = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        evt = await stripe_co.handle_webhook(body, sig)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return JSONResponse({"received": False}, status_code=400)
    if evt.payment_status == "paid":
        tx = await db.payment_transactions.find_one({"session_id": evt.session_id})
        if tx and tx["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
                {"$set": {"payment_status": "paid", "status": "complete", "paid_at": now_iso()}},
            )
            project_id = (evt.metadata or {}).get("project_id") or tx["metadata"].get("project_id")
            if project_id:
                await db.projects.update_one(
                    {"id": project_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"payment_status": "paid", "status": "open"}},
                )
    return {"received": True}

# ------------------------------------------------------------------ Uploads & Notifications
ALLOWED_MIMES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "application/zip",
    "video/mp4", "video/quicktime",
    "text/plain", "text/csv",
}
EXT_BY_MIME = {
    "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
    "application/pdf": "pdf", "application/zip": "zip",
    "video/mp4": "mp4", "video/quicktime": "mov",
    "text/plain": "txt", "text/csv": "csv",
}

@api.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ct = (file.content_type or "application/octet-stream").lower()
    if ct not in ALLOWED_MIMES:
        raise HTTPException(400, f"Unsupported file type: {ct}")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    ext = EXT_BY_MIME.get(ct, "bin")
    path = f"{APP_SLUG}/uploads/{user['id']}/{new_id()}.{ext}"
    result = put_object(path, data, ct)
    rec = {
        "id": new_id(),
        "storage_path": result["path"],
        "owner_id": user["id"],
        "original_filename": file.filename or f"file.{ext}",
        "content_type": ct,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": now_iso(),
    }
    await db.files.insert_one(rec)
    # Public URL relative to our API; frontend embeds with ?auth=token
    return {"id": rec["id"], "url": f"/api/files/{result['path']}", "content_type": ct, "filename": rec["original_filename"]}

@api.get("/files/{path:path}")
async def download_file(path: str, request: Request, auth: Optional[str] = Query(None)):
    # Accept either Authorization header (cookie/Bearer) or ?auth=token (for <img> tags).
    if auth and "authorization" not in {k.lower() for k in request.headers.keys()} and "access_token" not in request.cookies:
        # Inject Bearer for get_current_user
        class _R: pass
        # Easier: just decode here.
        try:
            payload = jwt.decode(auth, JWT_SECRET, algorithms=[JWT_ALGO])
            user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
            if not user: raise HTTPException(401)
        except Exception:
            raise HTTPException(401, "Invalid auth")
    else:
        await get_current_user(request)
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "File not found")
    data, ct = get_object(path)
    return Response(content=data, media_type=rec.get("content_type", ct))

@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    cursor = db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50)
    items = await cursor.to_list(50)
    unread = sum(1 for n in items if not n["read"])
    return {"items": items, "unread": unread}

@api.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}

# ------------------------------------------------------------------ Subscriptions
@api.get("/subscriptions/plans")
async def list_plans():
    return PLANS

@api.post("/subscriptions/checkout")
async def subscribe_checkout(body: SubscriptionInitReq, request: Request, user: dict = Depends(require_verified)):
    if body.plan not in PLANS:
        raise HTTPException(400, "Unknown plan")
    plan = PLANS[body.plan]
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_co = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&sub_plan={body.plan}"
    cancel_url = f"{origin}/pricing"
    co_req = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"kind": "subscription", "plan": body.plan, "user_id": user["id"]},
    )
    session = await stripe_co.create_checkout_session(co_req)
    await db.payment_transactions.insert_one({
        "id": new_id(),
        "session_id": session.session_id,
        "user_id": user["id"],
        "amount": plan["price"],
        "currency": plan["currency"],
        "kind": "subscription",
        "plan": body.plan,
        "payment_status": "initiated",
        "status": "open",
        "metadata": {"kind": "subscription", "plan": body.plan, "user_id": user["id"]},
        "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.session_id, "amount": plan["price"], "currency": plan["currency"]}

# ------------------------------------------------------------------ AI Coach & Vetting Task
RIVALO_COACH_SYS = (
    "You are RIVALO COACH — an elite AI assistant on the Rivalo competitive freelance arena. "
    "Identity: a calm, professional mentor, project manager, evaluator, strategist, and assistant — never a chatbot. "
    "Audience: BOTH clients (project owners) and freelancers (competitors).\n\n"
    "MISSION (freelancers): help them understand competitions, improve proposals, break work into milestones, manage deadlines, "
    "estimate completion time, find missing requirements, motivate, raise quality, interpret client feedback. Encourage LEARNING, not dependency.\n"
    "MISSION (clients): help them write professional briefs, suggest realistic budgets & deadlines, generate evaluation criteria, "
    "compare freelancers objectively, detect suspicious entries, and select winners with TRANSPARENT reasoning.\n\n"
    "PERSONALITY: professional, friendly, fast, confident, motivating, respectful, calm, helpful. Use light, purposeful emojis "
    "(🎯 🚀 ✅ 💡 📌 ⚡ 🏆 👏) — never spam them. Always understand intent first; ask one clarifying question only if essential.\n\n"
    "RESPONSE STYLE: short and structured. Use headings, bullets, numbered steps, and concrete next actions. "
    "Concise by default; deeper analysis only when explicitly requested.\n\n"
    "HARD RULES — never violate:\n"
    "  • Never write the full competition solution (no full logos, no production code, no finished copy).\n"
    "  • Never reveal another competitor's submission, identity, or pitch.\n"
    "  • Never disclose internal scoring formulas, hidden evaluation weights, or platform internals.\n"
    "  • Never help with: plagiarism, AI-spam submissions, fake portfolios/screenshots/reviews, rating manipulation, "
    "    bribery, bypassing payments, fraud, illegal activity, identity falsification, off-platform fee circumvention.\n"
    "  • If asked to do their work or cheat, politely decline and pivot to coaching questions that develop the user's thinking.\n\n"
    "REASONING: when comparing freelancers or evaluating work, mention multiple dimensions — portfolio quality, communication, "
    "deadline commitment, past ratings, consistency, technical/design/creative quality, originality, professionalism — and explain WHY. "
    "Be objective; never moralize unnecessarily. Don't accuse users directly when something looks suspicious — recommend a fairness review."
)

@api.post("/ai/chat")
async def ai_chat(body: AiChatReq, user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "AI not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception:
        raise HTTPException(503, "AI library unavailable")
    ctx_hint = {
        "client": " The user is acting as a CLIENT (project owner). Lean toward brief-writing, evaluation criteria, fair comparison.",
        "freelancer": " The user is acting as a FREELANCER (competitor). Lean toward pitch quality, planning, time estimation, learning.",
    }.get(body.context, "")
    session_id = body.session_id or f"u-{user['id']}"
    chat_obj = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=RIVALO_COACH_SYS + ctx_hint,
    ).with_model("openai", "gpt-4o-mini")
    try:
        reply = await chat_obj.send_message(UserMessage(text=body.message))
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        raise HTTPException(502, "Coach is offline — try again in a moment.")
    await db.ai_chat_log.insert_one({
        "id": new_id(), "user_id": user["id"], "session_id": session_id,
        "user_msg": body.message, "reply": reply, "created_at": now_iso(),
    })
    return {"reply": reply, "session_id": session_id}

@api.post("/ai/vetting-task")
async def ai_vetting_task(body: AiTaskReq, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": body.project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "AI not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception:
        raise HTTPException(503, "AI library unavailable")
    fids = body.freelancer_ids[:5] if body.freelancer_ids else project.get("approved_freelancer_ids", [])
    freelancers = await db.users.find({"id": {"$in": fids}}, {"_id": 0}).to_list(10)
    fdesc = "\n".join([f"- {f.get('name','?')}: skills={', '.join(f.get('skills') or [])}; headline={f.get('headline','')}" for f in freelancers]) or "- (no freelancer profiles available)"
    sys = (
        "You design a SHORT freelancer vetting task (a mini-challenge) tailored to: "
        "(1) the brief, (2) the time window, (3) the overlapping skills of the chosen competitors. "
        "Constraints: completable in under 25% of the project window, single deliverable, evaluable in <5 min by the client. "
        "Output JSON ONLY with fields: title (<=80 chars), goal (1 sentence), tasks (3-5 bullets, each <=120 chars), evaluation_criteria (3 bullets), time_estimate_minutes (integer)."
    )
    prompt = (
        f"Brief: {project['title']} — {project['description']}\n"
        f"Category: {project['category']}\n"
        f"Total window: {project['duration_hours']} hours\n"
        f"Competitors:\n{fdesc}\n"
        f"Respond with JSON only."
    )
    chat_obj = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"task-{body.project_id}",
        system_message=sys,
    ).with_model("openai", "gpt-4o-mini")
    try:
        raw = await chat_obj.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI vetting task failed: {e}")
        raise HTTPException(502, "AI is offline — try again in a moment.")
    # Strip markdown fences if any
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    import json as _json
    try:
        parsed = _json.loads(cleaned)
    except Exception:
        parsed = {"title": "Vetting task", "goal": raw[:200], "tasks": [], "evaluation_criteria": [],
                  "time_estimate_minutes": 30, "difficulty": "medium", "fairness_score": 70, "fairness_reasoning": "Heuristic default."}
    # Guarantee the fairness contract even when the LLM forgets a field.
    parsed.setdefault("difficulty", "medium")
    parsed.setdefault("fairness_score", 75)
    parsed.setdefault("fairness_reasoning", "Default fairness — task scoped within 25% of the project window with a single deliverable.")
    parsed.setdefault("time_estimate_minutes", 30)
    parsed.setdefault("tasks", [])
    parsed.setdefault("evaluation_criteria", [])
    return parsed

# ----- Winner recommendation -----
class WinnerRecReq(BaseModel):
    project_id: str

@api.post("/ai/winner-recommendation")
async def ai_winner_recommendation(body: WinnerRecReq, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": body.project_id})
    if not project:
        raise HTTPException(404, "Project not found")
    if project["client_id"] != user["id"]:
        raise HTTPException(403, "Only the project owner can request a recommendation")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "AI not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception:
        raise HTTPException(503, "AI library unavailable")
    subs = await db.submissions.find({"project_id": body.project_id}, {"_id": 0}).to_list(20)
    if not subs:
        raise HTTPException(400, "No submissions yet")
    competitor_ids = [s["user_id"] for s in subs]
    profiles = await db.users.find({"id": {"$in": competitor_ids}}, {"_id": 0}).to_list(20)
    pmap = {p["id"]: p for p in profiles}
    rows = []
    for s in subs:
        p = pmap.get(s["user_id"], {})
        rows.append(
            f"- {p.get('name','?')} (wins={p.get('wins',0)}, trust=?): "
            f"submission='{(s.get('description') or '')[:240]}', "
            f"deliverable_url={s.get('url') or 'n/a'}, files={len(s.get('files') or [])}"
        )
    summary = "\n".join(rows)
    sys = (
        "You are evaluating freelancer submissions for a competition. Score each on multiple dimensions: "
        "portfolio_quality, communication, deadline_commitment, past_ratings (use wins as proxy), consistency, "
        "technical_quality, creativity, originality, professionalism. NEVER expose the formula. "
        "Return JSON ONLY: { ranked: [ { user_id, rank, headline, why } ], "
        "winner_user_id, winner_explanation }. "
        "winner_explanation must be a single paragraph of clear, evidence-led prose without revealing internal scores."
    )
    prompt = (
        f"Brief: {project['title']} — {project['description']}\nCategory: {project['category']}\n"
        f"Bounty: ${project['budget']}\n\nSubmissions:\n{summary}\n\n"
        "Build a fair ranking. If two are equivalent, prefer the one with stronger past wins and clearer deliverable.\n"
        "Return JSON only."
    )
    chat_obj = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"rec-{body.project_id}", system_message=sys).with_model("openai", "gpt-4o-mini")
    try:
        raw = await chat_obj.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI winner rec failed: {e}")
        raise HTTPException(502, "AI is offline — try again in a moment.")
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    try:
        parsed = _json.loads(cleaned)
    except Exception:
        parsed = {"ranked": [], "winner_user_id": competitor_ids[0] if competitor_ids else None,
                  "winner_explanation": raw[:500]}
    # attach names for UI convenience
    for r in parsed.get("ranked", []):
        r["name"] = pmap.get(r.get("user_id"), {}).get("name", "Unknown")
    return parsed

# ----- Contact form -----
class ContactReq(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=10, max_length=5000)
    honeypot: Optional[str] = ""

@api.post("/contact")
async def contact_form(body: ContactReq, request: Request):
    if (body.honeypot or "").strip():
        return {"ok": True}  # silently drop bots
    rec = {
        "id": new_id(),
        "name": body.name,
        "email": str(body.email).lower(),
        "subject": body.subject,
        "message": body.message,
        "ip": request.client.host if request.client else "",
        "created_at": now_iso(),
        "status": "open",
    }
    await db.contact_messages.insert_one(rec)
    return {"ok": True, "ticket_id": rec["id"]}

# ------------------------------------------------------------------ Stats
@api.get("/stats")
async def stats():
    open_projects = await db.projects.count_documents({"status": "open"})
    in_progress = await db.projects.count_documents({"status": "in_progress"})
    completed = await db.projects.count_documents({"status": "completed"})
    users = await db.users.count_documents({})
    return {
        "open_projects": open_projects,
        "in_progress": in_progress,
        "completed": completed,
        "users": users,
    }

# ------------------------------------------------------------------ Seed
async def seed_demo():
    indexes_users = await db.users.index_information()
    if "email_1" not in indexes_users:
        await db.users.create_index("email", unique=True)
    await db.applications.create_index([("project_id", 1), ("user_id", 1)], unique=True)

    demos = [
        {"email": "client@demo.com", "name": "Aria Quinn", "headline": "Founder · Loop Studio"},
        {"email": "freelancer@demo.com", "name": "Milo Tanaka", "headline": "Brand designer · 7 yrs",
         "skills": ["Logo", "Branding", "Typography"], "portfolio": [
             "https://images.pexels.com/photos/7864379/pexels-photo-7864379.jpeg",
             "https://images.pexels.com/photos/12899144/pexels-photo-12899144.jpeg",
         ]},
    ]
    for d in demos:
        if not await db.users.find_one({"email": d["email"]}):
            await db.users.insert_one({
                "id": new_id(),
                "email": d["email"],
                "name": d["name"],
                "password_hash": hash_password("demo1234"),
                "headline": d.get("headline", ""),
                "bio": d.get("bio", ""),
                "skills": d.get("skills", []),
                "portfolio": d.get("portfolio", []),
                "avatar_url": "",
                "rating": 0,
                "completed": 0,
                "wins": 0,
                "email_verified": True,
                "phone": "", "phone_verified": False,
                "age": None, "location": "",
                "languages": [], "hourly_rate": None, "available": True,
                "cv_url": "", "social_links": {}, "former_projects": [],
                "created_at": now_iso(),
            })

@app.on_event("startup")
async def on_startup():
    await seed_demo()
    init_storage()
    logger.info("Rivalo backend started")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
