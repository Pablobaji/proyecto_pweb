const express = require('express');
const router = express.Router();

// Importa tus rutas
const userRoutes = require('./user.routes.js');
const adminProductoRoutes = require('./adminproducto.routes.js');
const userProductoRoutes = require('./userProducto.routes.js');
const carritoRoutes = require('./carrito.routes.js');
const detallesRoutes = require('./detalles.routes.js');

// Rutas de usuario (registro, login, etc)
router.use('/', userRoutes);

// Rutas de productos para admin
router.use('/admin', adminProductoRoutes);

// Rutas de productos para usuario
router.use('/user', userProductoRoutes);

// Rutas de carrito
router.use('/', carritoRoutes);

// Rutas de detalles/ventas
router.use('/', detallesRoutes);

module.exports = router;