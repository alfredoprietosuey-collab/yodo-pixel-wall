from datetime import date, timedelta
from typing import List, Dict, Tuple, Optional
from .db import connect
from .timeutil import today_str
from .settings import DROPS_PER_LITER, ACTIVE_TEAM_ID

def ensure_client(client_id: str, created_at_iso: str) -> None:
    conn = connect()
    conn.execute("INSERT OR IGNORE INTO clients(id, created_at) VALUES(?, ?)", (client_id, created_at_iso))
    conn.commit()
    conn.close()

def get_user_checkin_dates(client_id: str) -> List[str]:
    conn = connect()
    rows = conn.execute("SELECT date FROM checkins WHERE client_id=? ORDER BY date ASC", (client_id,)).fetchall()
    conn.close()
    return [r["date"] for r in rows]

def compute_streak(checkin_dates: List[str], today_iso: str) -> Tuple[int, int, bool]:
    if not checkin_dates:
        return 0, 0, False
    dates = [date.fromisoformat(d) for d in checkin_dates]
    checked_in_today = (dates[-1].isoformat() == today_iso)

    best = 1
    cur = 1
    for i in range(1, len(dates)):
        if dates[i] == dates[i-1] + timedelta(days=1):
            cur += 1
        else:
            best = max(best, cur)
            cur = 1
    best = max(best, cur)

    cur_streak = 1
    for i in range(len(dates)-1, 0, -1):
        if dates[i] == dates[i-1] + timedelta(days=1):
            cur_streak += 1
        else:
            break

    return cur_streak, best, checked_in_today

def get_counts(client_id: str) -> Dict[str, int]:
    conn = connect()
    total = conn.execute("SELECT COUNT(*) AS c FROM checkins WHERE client_id=?", (client_id,)).fetchone()["c"]

    today = date.fromisoformat(today_str())
    month_prefix = today.strftime("%Y-%m")
    mtd = conn.execute("SELECT COUNT(*) AS c FROM checkins WHERE client_id=? AND date LIKE ?", (client_id, f"{month_prefix}%")).fetchone()["c"]
    conn.close()
    return {"total": int(total), "mtd": int(mtd)}

def get_global_counts() -> Dict[str, int]:
    conn = connect()
    today = date.fromisoformat(today_str())

    start = today - timedelta(days=today.weekday())  # Monday
    end = start + timedelta(days=7)
    week = conn.execute("SELECT COUNT(*) AS c FROM checkins WHERE date >= ? AND date < ?", (start.isoformat(), end.isoformat())).fetchone()["c"]

    month_prefix = today.strftime("%Y-%m")
    month = conn.execute("SELECT COUNT(*) AS c FROM checkins WHERE date LIKE ?", (f"{month_prefix}%",)).fetchone()["c"]
    conn.close()
    return {"week": int(week), "month": int(month)}

def drops_to_liters(drops: int) -> float:
    if DROPS_PER_LITER <= 0:
        return 0.0
    return drops / float(DROPS_PER_LITER)

def active_team_id() -> Optional[str]:
    return ACTIVE_TEAM_ID or None

def get_team(team_id: str):
    conn = connect()
    row = conn.execute("SELECT * FROM teams WHERE id=?", (team_id,)).fetchone()
    conn.close()
    return row

def ensure_demo_team(goal: int = 50000) -> None:
    conn = connect()
    conn.execute(
        """INSERT OR IGNORE INTO teams(id, name, is_active, goal_checkins, sponsor_name, sponsor_claim, sponsor_logo_url)
           VALUES(?, ?, 1, ?, ?, ?, ?)""",
        ("demo", "Team Demo (MarcaX)", goal, "MarcaX", "Si llegamos a la meta, MarcaX financia agua (ejemplo).", "")
    )
    conn.commit()
    conn.close()

def join_team(client_id: str, team_id: str, joined_at_iso: str) -> None:
    conn = connect()
    conn.execute("INSERT OR IGNORE INTO team_members(client_id, team_id, joined_at) VALUES(?, ?, ?)", (client_id, team_id, joined_at_iso))
    conn.commit()
    conn.close()

def user_team(client_id: str) -> Optional[str]:
    tid = active_team_id()
    if not tid:
        return None
    conn = connect()
    row = conn.execute("SELECT team_id FROM team_members WHERE client_id=? AND team_id=?", (client_id, tid)).fetchone()
    conn.close()
    return tid if row else None

def team_progress(team_id: str) -> Dict[str, int]:
    conn = connect()
    total = conn.execute("SELECT COUNT(*) AS c FROM checkins WHERE team_id=?", (team_id,)).fetchone()["c"]
    team = conn.execute("SELECT goal_checkins FROM teams WHERE id=?", (team_id,)).fetchone()
    goal = int(team["goal_checkins"]) if team else 0
    conn.close()
    return {"checkins": int(total), "goal": goal}

def create_checkin(client_id: str, date_iso: str, created_at_iso: str, team_id: Optional[str]) -> bool:
    conn = connect()
    try:
        conn.execute("INSERT INTO checkins(client_id, date, created_at, team_id) VALUES(?, ?, ?, ?)", (client_id, date_iso, created_at_iso, team_id))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()
