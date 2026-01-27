# Click por Agua — GitHub Pages MVP (100% estático)

Este repo está pensado para desplegarse en **GitHub Pages** (solo HTML/CSS/JS).

Incluye:
- Check-in diario ("Regar hoy")
- Rachas (streaks)
- Gotas y conversión (**10 gotas = 1L**)
- Mapa pixel (grid) que se llena con el progreso semanal
- Team demo (objetivo público) en modo local

## Cómo publicar en GitHub Pages
1) Sube estos archivos a un repo (raíz).
2) GitHub → Settings → Pages → Deploy from branch → `main` / `/root`.
3) URL típica: `https://TUUSUARIO.github.io/TUREPO/`

## Conectar tu extensión
Haz que el botón abra:
`https://TUUSUARIO.github.io/TUREPO/`

## Actualizaciones
- Si cambias textos/estilos/funciones: haces `git push` y Pages se actualiza.
- Si quieres campañas/sponsor sin tocar el repo: conecta a tu backend (ver `app.js` → `API_BASE`) y sirve un `/api/status` y `/api/checkin`.

## Streaks
- En este MVP: se guardan en **localStorage** (por navegador/dispositivo).
- Si necesitas rachas “reales” multi-dispositivo y anti-trampa: guarda el estado en tu backend y usa fecha del servidor.
