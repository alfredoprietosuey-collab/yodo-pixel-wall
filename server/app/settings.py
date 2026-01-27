import os
from dotenv import load_dotenv

load_dotenv()

def getenv_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except Exception:
        return default

APP_NAME = os.getenv("APP_NAME", "Click por Agua")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

DROPS_PER_CHECKIN = getenv_int("DROPS_PER_CHECKIN", 1)
DROPS_PER_LITER = getenv_int("DROPS_PER_LITER", 10)

WEEKLY_GOAL_CHECKINS = getenv_int("WEEKLY_GOAL_CHECKINS", 5000)
MONTHLY_GOAL_CHECKINS = getenv_int("MONTHLY_GOAL_CHECKINS", 20000)

TZ = os.getenv("TZ", "Europe/Madrid")
ACTIVE_TEAM_ID = os.getenv("ACTIVE_TEAM_ID", "demo")
