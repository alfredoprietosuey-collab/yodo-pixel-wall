# Click por Agua — GH Pages V2 (World Map Pixel)

Repo 100% estático (HTML/CSS/JS) para GitHub Pages.

Incluye:
- Check-in diario + rachas (localStorage)
- Progreso semanal/mensual
- Mapa del mundo pixel (canvas) que se “riega” con el progreso semanal
- Team demo (local)

## Publicar (GitHub Pages)
Settings → Pages → Deploy from branch → main / (root)

## Conectar extensión
Apunta a:
https://TUUSUARIO.github.io/TUREPO/

## Nota
- Streaks en este MVP son locales (por navegador).
- Para rachas/global real: conecta a tu backend (API) en `app.js` (API_BASE) y sirve /api/status + /api/checkin con CORS.
