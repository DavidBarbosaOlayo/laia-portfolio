# Laia Serrano Valdivia Portfolio

Portfolio editable con Astro, Vue, Decap CMS y Cloudinary.

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

En desarrollo local, el admin sube imagenes y videos a `public/uploads` y guarda rutas tipo `/uploads/archivo.mp4`.

El proxy local (`scripts/cms-proxy.mjs`) acepta archivos grandes (hasta ~700 MB reales; el `decap-server` original cortaba en ~35 MB y mostraba el error `"<!DOCTYPE ..." is not valid JSON`).

Esto sirve para probar y para archivos ligeros. Para videos finales pesados, conviene usar Cloudinary, Vimeo o Mux y guardar la URL/embed en el proyecto.

## Produccion

Antes de publicar, hay que sustituir los placeholders de `public/admin/config.yml`:

- `TU_USUARIO/laia-portfolio`

## Acceso inicial al admin

El panel `/admin/` tiene una barrera inicial hardcoded para evitar acceso casual:

- Usuario: `laia`
- Contrasena: `portfolio2026`

Esto no sustituye una proteccion real de servidor/plataforma en produccion, porque el proyecto compila como web estatica. Para publicar el portfolio con seguridad, protege tambien `/admin/` y `/config.yml` desde la plataforma de deploy o con una capa de servidor.
