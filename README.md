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

El admin usa la **biblioteca por defecto de Decap** (`media_folder: public/uploads`): al pulsar el boton de medios la editora ve y selecciona lo que ya hay subido, y puede subir archivos ligeros. Los campos de imagen/video tienen `choose_url: true`, asi que ademas se puede **pegar una URL externa** ("Insert from URL").

**No subir videos pesados al repositorio.** En produccion el CMS commitea via git-gateway, y GitHub rechaza los archivos grandes con un 422 que Decap muestra como `Failed to persist entry: API_ERROR: Validation Failed`. Sintoma tipico: modificar una entrada existente funciona, pero crear una nueva con video pesado falla. Restos de esa epoca: `public/uploads/caminata-1.mov` (17 MB, huerfano).

**Flujo para videos:** subir el video a Cloudinary (cloud `dzhpzwfkq`) por fuera del CMS, copiar la URL y pegarla en el campo Video con "Insert from URL". No es automatico: Cloudinary y el CMS son cosas separadas, el vinculo es la URL. Los videos actuales del sitio ya son URLs de Cloudinary servidas con `q_auto`.

El proxy local (`scripts/cms-proxy.mjs`) acepta archivos grandes (hasta ~700 MB reales; el `decap-server` original cortaba en ~35 MB y mostraba el error `"<!DOCTYPE ..." is not valid JSON`), pero **eso es solo en local**: no hay equivalente en produccion.

Historico del widget de Cloudinary (`media_library: cloudinary`): se quito el 2026-07-04 (`21d2c58`) porque el selector aparecia vacio a la editora; se restauro el 2026-07-24 (`357556d`) al darle rol Master admin; y se volvio a quitar poco despues porque **seguia sin ver ni poder subir** (permisos/sesion de su usuario, no reproducible en remoto) y ademas le quitaba la biblioteca por defecto que si le funcionaba para seleccionar lo existente. Si se reintenta, la via robusta es el Upload Widget de Cloudinary con preset unsigned (no depende de la sesion del usuario), que requiere integracion a medida via `CMS.registerMediaLibrary`.

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
