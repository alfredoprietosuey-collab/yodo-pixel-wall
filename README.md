# Click por Agua — Web MVP (para conectar con vuestra extensión)

Este repo es SOLO la parte web/servidor. Vuestra extensión existente solo tiene que abrir:

- `https://TU_DOMINIO/hoy?src=newtab`

## Endpoints (contrato mínimo)
- `GET /hoy` → UI del check‑in (“regar”), racha, gotas y mapa semanal.
- `POST /api/checkin` → registra 1 check‑in/día por usuario (cookie `cpa_cid`).
- `POST /api/join-team` (form) → une al usuario al team activo.
- `GET /team/{team_id}` → landing pública del team.
- `GET /transparencia` → explicación “cómo se convierte en agua”.

## Equivalencia (producto)
- 1 check‑in = 💧 1 gota
- **10 gotas = 1L** (equivalencia de juego)
- Objetivo mensual ejemplo: 20.000 check‑ins → 2.000 L

> Recomendación: si vuestra monetización varía, etiquetad litros como “estimado” y cerrad “confirmado” a fin de mes.

## Ejecutar local
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Abre:
- http://localhost:8000/hoy
- http://localhost:8000/team/demo

## Subir a GitHub
1) Crea un repo vacío en GitHub.
2) En tu máquina, desde la carpeta del proyecto:
```bash
git init
git add .
git commit -m "MVP web: check-in + rachas + mapa semanal + team"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## Conectar la extensión
En vuestra extensión, el botón debería abrir:
`https://TU_DOMINIO/hoy?src=newtab`
