# VillainLair API

API REST de supervillanos, guaridas, esbirros y máquinas del juicio final.
Express (generado con `express-generator --no-view`) + Mongoose + MongoDB Atlas.

## Puesta en marcha

Requisitos: Node.js 20.6 o superior y un clúster de MongoDB Atlas.

### 1. Preparar Atlas
1. Crear el clúster (el gratuito M0 vale).
2. *Database Access*: crear un usuario de base de datos con contraseña.
3. *Network Access*: permitir tu IP (o `0.0.0.0/0` solo para pruebas).
4. *Database > Connect > Drivers*: copiar la cadena de conexión.

La base de datos `villainlair` y sus colecciones (`villains`, `lairs`, `minions`, `devices`)
se crean solas en la primera inserción.

### 2. Configurar y arrancar
```bash
npm install
cp .env.example .env      # edita MONGODB_URI con tu cadena de conexión
npm run seed              # opcional: datos de ejemplo
npm start                 # http://localhost:3000 (usa "npm run dev" para recargar al guardar)
```
Si todo va bien verás `MongoDB Atlas DataBase connection successful`.

`npm run seed` no toca una base de datos que ya tenga villanos; con `npm run seed -- --force` la vacía y recarga.

## Estructura
```
supervillain-api/
├── app.js            conexión con Atlas, middlewares, montaje de rutas y errores en JSON
├── bin/www           arranque del servidor (express-generator)
├── models/           Villain.js, Lair.js, Minion.js, Device.js (esquemas Mongoose)
├── routes/           villains.js > lairs.js > minions.js / devices.js (routers anidados)
├── utils/            pick
├── scripts/seed.js   datos de ejemplo
└── test/             pruebas de integración
```

## Endpoints
Todo cuelga de `/api/villains`. Los ids son `_id` de MongoDB.

| Método | Ruta | Acción |
|--------|------|--------|
| GET / POST | `/api/villains` | Listar / crear villanos |
| GET / PUT / DELETE | `/api/villains/:villainId` | Ver / modificar / eliminar (con todo lo que cuelga de él) |
| GET / POST | `/api/villains/:villainId/lairs` | Listar / crear guaridas |
| GET / PUT / DELETE | `.../lairs/:lairId` | Ver (con su villano) / modificar / eliminar (con sus esbirros y máquinas) |
| GET / POST | `.../lairs/:lairId/minions` | Listar / crear esbirros |
| GET / PUT / DELETE | `.../minions/:minionId` | Ver / modificar / eliminar |
| GET / POST | `.../lairs/:lairId/devices` | Listar / crear máquinas |
| GET / PUT / DELETE | `.../devices/:deviceId` | Ver / modificar / eliminar |

Campos: villano (`name`, `alias`, `evilLevel`), guarida (`name`, `location`), esbirro (`name`, `eyeCount`, `expendable`),
máquina (`name`, `status` = Inactiva, Cargando o Lista, `power`). La referencia al padre sale siempre de la URL.

```bash
curl http://localhost:3000/api/villains
curl -d '{"name":"Gru","alias":"El Ladrón de la Luna","evilLevel":8000}' \
  -H 'Content-Type: application/json' http://localhost:3000/api/villains
```

Códigos: `201` al crear, `400` si falla la validación o el id no es válido, `404` si el recurso no existe
(o la guarida no pertenece al villano de la URL), `500` ante errores del servidor.

## Pruebas
Usan una base de datos desechable, que se **borra entera** al terminar. Su nombre debe acabar en `_test`:
```bash
MONGODB_URI_TEST="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/villainlair_test?retryWrites=true&w=majority" npm test
```
No uses nunca la base de datos real.

## Diferencias con las diapositivas
- Cada router define un middleware normal (`loadVillain`, `loadLair`, `loadMinion`, `loadDevice`) que busca el recurso de la URL y lo guarda en `req`; se pone delante de las rutas que lo necesitan. Las consultas usan `.then()` y terminan en `.catch(next)`, así que los errores de validación y de id llegan al manejador de `app.js` sin repetir `try/catch` en cada ruta.
- Se completan los `PUT` y `DELETE` de todos los recursos y se comprueba que cada guarida, esbirro o máquina pertenece al padre de la URL.
- Los `POST` y `PUT` solo aceptan los campos del modelo (el resto del cuerpo se ignora).
