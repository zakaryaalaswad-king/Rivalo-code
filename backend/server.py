from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import asyncio
import logging
import uuid
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
    }

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
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"user": public_user(user), "token": token}

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
async def create_project(body: ProjectCreate, user: dict = Depends(get_current_user)):
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
async def apply_to_project(project_id: str, body: ApplyReq, user: dict = Depends(get_current_user)):
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
        # activate project
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
