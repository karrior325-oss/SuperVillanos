const express = require('express');
const router = express.Router();
const Villain = require('../models/Villain');
const Lair = require('../models/Lair');
const Minion = require('../models/Minion');
const Device = require('../models/Device');
const lairsRouter = require('./lairs');
const pick = require('../utils/pick');

const FIELDS = ['name', 'alias', 'evilLevel'];

// Middleware: busca el villano de la URL y lo guarda en req.villain (404 si no existe).
// Si el id no es válido, Mongoose lanza un CastError y .catch(next) lo manda a app.js (400).
function loadVillain(req, res, next) {
  Villain.findById(req.params.villainId)
    .then((villain) => {
      if (!villain) return res.status(404).json({ error: "Villano no encontrado o está en la cárcel" });
      req.villain = villain;
      next();
    })
    .catch(next);
}

// Delegamos /:villainId/lairs al router de guaridas (antes cargamos el villano)
router.use('/:villainId/lairs', loadVillain, lairsRouter);

// GET: listar todos los villanos
router.get('/', (req, res, next) => {
  Villain.find()
    .then((villains) => res.json({ message: "Sindicato del mal super cargado!!!", data: villains }))
    .catch(next);
});

// POST: contratar un nuevo villano
router.post('/', (req, res, next) => {
  Villain.create(pick(req.body, FIELDS))
    .then((villain) => res.status(201).json({ message: "Nuevo villano registrado. El mundo tiembla.", data: villain }))
    .catch(next);
});

// GET: obtener un villano específico
router.get('/:villainId', loadVillain, (req, res) => {
  res.json(req.villain);
});

// PUT: modificar un villano
router.put('/:villainId', loadVillain, (req, res, next) => {
  req.villain.set(pick(req.body, FIELDS));
  req.villain.save()
    .then((villain) => res.json({ message: "Villano actualizado. Sus planes siguen en marcha.", data: villain }))
    .catch(next);
});

// DELETE: dar de baja a un villano y a todo lo que cuelga de él
router.delete('/:villainId', loadVillain, (req, res, next) => {
  Lair.find({ villain: req.villain._id })
    .then((lairs) => {
      const lairIds = lairs.map((l) => l._id);
      return Minion.deleteMany({ lair: { $in: lairIds } })
        .then(() => Device.deleteMany({ lair: { $in: lairIds } }));
    })
    .then(() => Lair.deleteMany({ villain: req.villain._id }))
    .then(() => req.villain.deleteOne())
    .then(() => res.json({ message: "Villano capturado. Sus guaridas, esbirros y máquinas, desmantelados." }))
    .catch(next);
});

module.exports = router;
