# Laia Serrano Valdivia Portfolio

Portfolio editable con Astro, Vue y Decap CMS. El sitio puede mostrar videos alojados en Cloudinary, Vimeo, Mux o YouTube si se pega su URL en el CMS.

## Desarrollo local

Usa siempre este comando:

```powershell
npm.cmd run dev
```

Levanta dos servicios:

- Web: `http://127.0.0.1:4321`
- Admin: `http://127.0.0.1:4321/admin/`
- Proxy local de Decap: `http://localhost:8081`

Si el admin muestra `Login with GitHub`, normalmente falta el proxy local. Para evitarlo, no arranques solo Astro con `npm run dev:site`; usa `npm.cmd run dev`.

## Subida de archivos

El admin sube imagenes y videos a `public/uploads` y guarda rutas tipo `/uploads/archivo.mp4`.

El proxy local (`scripts/cms-proxy.mjs`) acepta archivos grandes (hasta ~700 MB reales; el `decap-server` original cortaba en ~35 MB y mostraba el error `"<!DOCTYPE ..." is not valid JSON`).

Esto sirve para probar y para archivos ligeros. Para videos finales pesados, conviene subirlos fuera del repo, por ejemplo a Cloudinary, Vimeo o Mux, y pegar la URL/embed en el campo de video del proyecto.

No se usa el selector de biblioteca de Cloudinary dentro de Decap. Ese selector solo permite elegir assets que ya existen en Cloudinary y puede aparecer vacio si la cuenta no tiene assets o permisos de subida; por eso el CMS usa la subida normal de Decap y deja Cloudinary como URL externa.

## Produccion

El sitio esta desplegado en Netlify: `https://laia-portfolio.netlify.app`.

El CMS usa `git-gateway` (no hay que tocar placeholders en `config.yml`). Para que funcione, en el panel de Netlify deben estar activos **Identity** y **Git Gateway** (ya lo estan).

### Invitar a una editora

Netlify -> proyecto `laia-portfolio` -> **Identity** -> **Invite users** -> su email. Le llega un correo "You've been invited..." con un enlace valido **7 dias**; debe aceptarlo y crear contrasena desde `https://laia-portfolio.netlify.app/admin/`.

Si una usuaria ya confirmada olvida su contrasena, en su ficha de Identity usa **Send reset password email** (no hace falta reinvitar).

## Acceso inicial al admin

El panel `/admin/` tiene una barrera inicial hardcoded para evitar acceso casual:

- Usuario: `laia`
- Contrasena: `portfolio2026`

Esto no sustituye una proteccion real de servidor/plataforma en produccion, porque el proyecto compila como web estatica. Para publicar el portfolio con seguridad, protege tambien `/admin/` y `/config.yml` desde la plataforma de deploy o con una capa de servidor.
