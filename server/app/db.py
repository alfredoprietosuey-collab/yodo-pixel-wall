import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data.sqlite3"

def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db() -> None:
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        team_id TEXT,
        UNIQUE(client_id, date),
        FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        goal_checkins INTEGER NOT NULL,
        sponsor_name TEXT,
        sponsor_claim TEXT,
        sponsor_logo_url TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS team_members (
        client_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        PRIMARY KEY (client_id, team_id),
        FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()
