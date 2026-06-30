# Control de Envíos

Aplicación web para registrar y dar seguimiento a envíos con incidencias (perdidos, retrasados, en investigación...). Todo el equipo accede desde un único panel compartido: lo que registra una persona lo ve el resto al instante.

## Qué incluye

- Login con usuario y contraseña (sin registro público)
- Listado de envíos con búsqueda y filtros por estado
- Ficha de cada envío: número de seguimiento, mensajero, motivo, descripción, destinatario
- Histórico de cambios de estado (quién lo cambió y cuándo)
- Notas y comentarios por envío
- Adjuntar fotos o documentos (PDF, Word) a cada envío
- Página de alertas: envíos perdidos o sin actualizar en X días
- Exportación a Excel con filtros
- Gestión de usuarios del equipo (solo administradores)

---

## Cómo ponerlo en marcha (sin usar la terminal)

Vas a desplegar esto en **Railway**, un servicio que aloja la aplicación y la base de datos por ti. No necesitas instalar nada en tu ordenador.

### Paso 1 — Sube el proyecto a GitHub

1. Crea una cuenta gratuita en [github.com](https://github.com) si no tienes una.
2. Crea un repositorio nuevo (botón verde "New").
3. Sube ahí todos los archivos de esta carpeta. La forma más simple: en la página del repositorio recién creado, usa "uploading an existing file" y arrastra toda la carpeta.

### Paso 2 — Crea el proyecto en Railway

1. Ve a [railway.com](https://railway.com) y crea una cuenta (puedes entrar directamente con tu cuenta de GitHub).
2. Pulsa **"New Project"** → **"Deploy from GitHub repo"** → selecciona el repositorio que has subido.
3. Railway detectará que es un proyecto Next.js y empezará a construirlo automáticamente. Esto puede tardar un par de minutos y es normal que **falle la primera vez** porque todavía no tiene base de datos ni variables configuradas — sigue con los siguientes pasos.

### Paso 3 — Añade la base de datos

1. Dentro de tu proyecto en Railway, pulsa **"+ New"** → **"Database"** → **"Add PostgreSQL"**.
2. Railway crea la base de datos y la conecta automáticamente a tu aplicación rellenando la variable `DATABASE_URL`. No tienes que copiar nada a mano.

### Paso 4 — Configura las variables de entorno

1. Entra en el servicio de tu aplicación (no el de la base de datos) → pestaña **"Variables"**.
2. Añade estas variables:

   | Variable | Valor |
   |---|---|
   | `JWT_SECRET` | Una frase larga y aleatoria, por ejemplo: `correos-perdidos-2026-clave-secreta-xyz789` (cualquier texto largo sirve, cuanto más raro mejor) |
   | `SEED_ADMIN_EMAIL` | El email con el que quieres entrar como administrador la primera vez |
   | `SEED_ADMIN_PASSWORD` | Una contraseña temporal (cámbiala luego desde la app) |
   | `SEED_ADMIN_NOMBRE` | Tu nombre |

3. Guarda. Railway volverá a desplegar la aplicación automáticamente.

### Paso 5 — Crea tu usuario administrador

Railway no ejecuta el script de creación de usuario automáticamente (por seguridad), así que hay que lanzarlo una vez:

1. En tu servicio de Railway, busca la pestaña con un icono de terminal (**"Shell"** o el menú de tres puntos → algo similar).
2. Escribe exactamente esto y pulsa Enter:
   ```
   npm run db:seed
   ```
3. Verás un mensaje confirmando que se ha creado el usuario administrador con el email y contraseña que configuraste en el Paso 4.

### Paso 6 — Accede a la aplicación

1. En Railway, dentro de tu servicio, ve a **"Settings"** → **"Networking"** → pulsa **"Generate Domain"**. Esto te da una URL pública (algo como `tuapp.up.railway.app`).
2. Abre esa URL, inicia sesión con el email y contraseña del Paso 4.
3. Ve a la sección **"Usuarios"** del menú lateral y crea las cuentas del resto de tu equipo (2-5 personas). Recomendamos que cambies tu propia contraseña inicial cuanto antes.

¡Ya está! Cualquier persona con la URL y sus credenciales puede entrar y todo se sincroniza automáticamente porque todos comparten la misma base de datos.

---

## Coste aproximado

Railway funciona con un plan de pago por uso. Para 2-5 personas usando esta aplicación, el coste mensual estimado es de **unos 5-10 dólares al mes** (servidor pequeño + base de datos pequeña). Railway ofrece créditos gratuitos iniciales para probarlo sin coste.

---

## Si quieres probarlo en tu ordenador antes de desplegarlo

Esto ya requiere algo de terminal. Necesitas tener Node.js instalado (versión 20 o superior) y una base de datos PostgreSQL accesible (puedes crear una gratuita en Railway y usar su URL aquí también).

```bash
npm install
cp .env.example .env
# Edita .env y pon tu DATABASE_URL real y un JWT_SECRET
npx prisma migrate deploy
SEED_ADMIN_EMAIL=tu@email.com SEED_ADMIN_PASSWORD=tucontraseña npm run db:seed
npm run dev
```

Abre `http://localhost:3000` en el navegador.

---

## Mantenimiento

- **Añadir o quitar personas del equipo**: hazlo desde la sección "Usuarios" dentro de la app (necesitas ser administrador).
- **Copia de seguridad**: Railway hace copias automáticas de la base de datos PostgreSQL. Para una copia manual, puedes exportarla desde el panel de la base de datos en Railway.
- **Actualizar la aplicación**: si en el futuro quieres pedir cambios o mejoras, vuelve a subir los archivos modificados a GitHub y Railway redesplegará automáticamente.

## Soporte técnico

Si algo no funciona durante el despliegue, lo más común es:
- Variable `DATABASE_URL` no configurada → revisa que el servicio de PostgreSQL esté enlazado al de la aplicación (Railway lo hace solo si añadiste la base de datos *después* de crear el servicio de la app; si no, ve a Variables → "Add variable reference" y enlázala manualmente).
- Olvidar ejecutar `npm run db:seed` → no podrás iniciar sesión la primera vez porque no existe ningún usuario todavía.
