from datetime import datetime
from zoneinfo import ZoneInfo
from .settings import TZ

def now_tz() -> datetime:
    return datetime.now(tz=ZoneInfo(TZ))

def today_str() -> str:
    return now_tz().date().isoformat()

def iso_now() -> str:
    return now_tz().isoformat()
