from fastapi import FastAPI, Request, Response, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid

from .db import init_db
from .timeutil import today_str, iso_now
from .settings import APP_NAME, BASE_URL, DROPS_PER_CHECKIN, DROPS_PER_LITER, WEEKLY_GOAL_CHECKINS, MONTHLY_GOAL_CHECKINS
from .logic import (
    ensure_client, get_user_checkin_dates, compute_streak, get_counts, get_global_counts,
    drops_to_liters, active_team_id, ensure_demo_team, join_team, user_team, team_progress, create_checkin, get_team
)

app = FastAPI(title=APP_NAME)
templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
def _startup():
    init_db()
    ensure_demo_team(goal=50000)

def get_or_set_client_id(request: Request, response: Response) -> str:
    cid = request.cookies.get("cpa_cid")
    if cid:
        return cid
    cid = str(uuid.uuid4())
    response.set_cookie("cpa_cid", cid, httponly=True, samesite="lax", max_age=60*60*24*365*2)
    ensure_client(cid, iso_now())
    return cid

def context_common():
    return {
        "APP_NAME": APP_NAME,
        "BASE_URL": BASE_URL,
        "DROPS_PER_LITER": DROPS_PER_LITER,
        "DROPS_PER_CHECKIN": DROPS_PER_CHECKIN,
        "WEEKLY_GOAL_CHECKINS": WEEKLY_GOAL_CHECKINS,
        "MONTHLY_GOAL_CHECKINS": MONTHLY_GOAL_CHECKINS,
    }

@app.get("/", response_class=HTMLResponse)
def root(request: Request):
    return RedirectResponse(url="/hoy", status_code=302)

@app.get("/hoy", response_class=HTMLResponse)
def hoy(request: Request):
    response = templates.TemplateResponse("hoy.html", {"request": request})
    cid = get_or_set_client_id(request, response)

    t = today_str()
    dates = get_user_checkin_dates(cid)
    streak, best, checked = compute_streak(dates, t)

    counts = get_counts(cid)
    global_counts = get_global_counts()

    drops_mtd = counts["mtd"] * DROPS_PER_CHECKIN
    liters_mtd = drops_to_liters(drops_mtd)

    weekly_goal = WEEKLY_GOAL_CHECKINS
    weekly_pct = 0 if weekly_goal <= 0 else min(100, int((global_counts["week"] / weekly_goal) * 100))

    active_tid = active_team_id()
    team_row = get_team(active_tid) if active_tid else None
    joined_tid = user_team(cid)
    team_stats = team_progress(active_tid) if active_tid else {"checkins": 0, "goal": 0}
    team_pct = 0 if team_stats["goal"] <= 0 else min(100, int((team_stats["checkins"] / team_stats["goal"]) * 100))

    ctx = {
        **context_common(),
        "today": t,
        "checked_in_today": checked,
        "streak": streak,
        "best_streak": best,
        "drops_mtd": drops_mtd,
        "liters_mtd": liters_mtd,
        "global_week_checkins": global_counts["week"],
        "weekly_pct": weekly_pct,
        "team": team_row,
        "team_joined": bool(joined_tid),
        "team_pct": team_pct,
        "team_checkins": team_stats["checkins"],
        "team_goal": team_stats["goal"],
    }
    response.context.update(ctx)
    return response

@app.post("/api/checkin")
def api_checkin(request: Request):
    response = JSONResponse({"ok": True})
    cid = get_or_set_client_id(request, response)
    t = today_str()
    tid = user_team(cid)
    created = create_checkin(cid, t, iso_now(), tid)
    return JSONResponse({"ok": True, "created": created, "date": t})

@app.post("/api/join-team")
def api_join_team(request: Request, team_id: str = Form(...)):
    response = JSONResponse({"ok": True})
    cid = get_or_set_client_id(request, response)
    join_team(cid, team_id, iso_now())
    return JSONResponse({"ok": True, "team_id": team_id})

@app.get("/team/{team_id}", response_class=HTMLResponse)
def team_page(request: Request, team_id: str):
    response = templates.TemplateResponse("team.html", {"request": request})
    cid = get_or_set_client_id(request, response)

    team = get_team(team_id)
    stats = team_progress(team_id)
    pct = 0 if stats["goal"] <= 0 else min(100, int((stats["checkins"] / stats["goal"]) * 100))

    joined = user_team(cid) == team_id
    ctx = {**context_common(), "team": team, "team_id": team_id, "team_checkins": stats["checkins"], "team_goal": stats["goal"], "team_pct": pct, "joined": joined}
    response.context.update(ctx)
    return response

@app.get("/transparencia", response_class=HTMLResponse)
def transparencia(request: Request):
    return templates.TemplateResponse("transparencia.html", {"request": request, **context_common()})
