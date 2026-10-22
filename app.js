const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const villainsRouter = require('./routes/villains');

const app = express();

// Conexión con MongoDB Atlas (la cadena de conexión vive en el .env)
if (!process.env.MONGODB_URI) {
  console.error('Falta la variable de entorno MONGODB_URI. Copia .env.example a .env y rellénala.');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas DataBase connection successful'))
  .catch((err) => {
    console.error('No se pudo conectar con MongoDB:', err.message);
    process.exit(1);
  });

if (process.env.NODE_ENV !== 'test') app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Montamos la ruta raíz de nuestra jerarquía
app.use('/api/villains', villainsRouter);

// Catch 404
app.use(function (req, res, next) {
  res.status(404).json({ error: "Ruta no encontrada en el multiverso" });
});

// Error handler (JSON en lugar de vista)
app.use(function (err, req, res, next) {
  const invalid = err.name === 'ValidationError' || err.name === 'CastError';
  res.status(err.status || (invalid ? 400 : 500)).json({ error: err.message });
});

module.exports = app;
