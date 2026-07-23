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

El admin usa la **biblioteca de Cloudinary** (`media_library: cloudinary` en `config.yml`, cloud `dzhpzwfkq`). Al pulsar el boton de medios se abre el widget de Cloudinary: se puede subir ahi mismo o elegir un asset ya subido, y se guarda la URL completa con `f_auto,q_auto`. Los archivos no pasan por el repo.

La `api_key` del config es publica por diseño; la que nunca debe entrar al repo es el *api secret*.

**No subir videos al repositorio.** En produccion el CMS commitea via git-gateway, y GitHub rechaza los archivos grandes con un 422 que Decap muestra como `Failed to persist entry: API_ERROR: Validation Failed`. Sintoma tipico: modificar una entrada existente funciona, pero crear una nueva con video falla. Restos de esa epoca: `public/uploads/caminata-1.mov` (17 MB, huerfano).

El proxy local (`scripts/cms-proxy.mjs`) acepta archivos grandes (hasta ~700 MB reales; el `decap-server` original cortaba en ~35 MB y mostraba el error `"<!DOCTYPE ..." is not valid JSON`), pero **eso es solo en local**: no hay equivalente en produccion.

Historico: la integracion de Cloudinary se quito el 2026-07-04 (commit `21d2c58`) porque el selector le aparecia vacio a la editora. La causa real eran los permisos de su usuario en Cloudinary, no el widget. Se restauro al darle rol Master admin.

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
