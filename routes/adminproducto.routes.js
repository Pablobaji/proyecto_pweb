const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db.js');
const productoMiddleware = require('../middleware/productos.js');

// POST: Crear producto (Solo administradores)
router.post('/producto', 
  productoMiddleware.validarUsuario, 
  productoMiddleware.validarProducto, 
  (req, res) => {
    console.log('BODY:', req.body);
const { nombre_producto, tipo_producto, descripcion, stock, precio_producto } = req.body;    
    db.query(
      'SELECT id FROM productos WHERE LOWER(nombre_producto) = LOWER(?)',
      [nombre_producto],
      (err, result) => {
        if (err) {
          return res.status(500).send({ message: err });
        }
        if (result.length) {
          return res.status(409).send({ message: 'Este producto ya existe!' });
        }
        
        db.query(
  'INSERT INTO productos (nombre_producto, tipo_producto, precio_producto, descripcion, stock) VALUES (?, ?, ?, ?, ?)',
[nombre_producto, tipo_producto, precio_producto, descripcion, stock],
  (err, result) => {
    if (err) {
      return res.status(400).send({ message: err });
    }
    return res.status(201).send({ message: 'Producto agregado correctamente!' });
  }
);
      }
    );
  }
);

// POST: Modificar producto (Solo administradores)
router.put('/modificar', 
  productoMiddleware.validarUsuario,
  productoMiddleware.validarProducto,
  (req, res) => {
    const { nombre_producto, tipo_producto, descripcion, stock, id } = req.body;
    
    db.query(
      'UPDATE productos SET nombre_producto = ?, tipo_producto = ?, descripcion = ?, stock = ? WHERE id = ?;',
      [nombre_producto, tipo_producto, descripcion, stock, id],
      (err, result) => {
        if (err) {
          return res.status(400).send({ message: err });
        }
        if (result.affectedRows === 0) {
          return res.status(404).send({ message: 'Producto no encontrado' });
        }
        return res.status(200).send({ message: 'Producto modificado correctamente!' });
      }
    );
  }
);

// GET: Listar productos (Solo administradores)
router.get('/productos', 
  productoMiddleware.validarUsuario, 
  (req, res) => {
    db.query('SELECT * FROM productos;', (err, result) => {
      if (err) {
        return res.status(400).send({ message: err });
      }
      return res.status(200).send({ productos: result });
    });
  }
);

// GET: Listar clientes (Solo administradores)
router.get('/clientes', 
  productoMiddleware.validarUsuario,
  (req, res) => {
    db.query('SELECT * FROM usuarios;', (err, result) => {
      if (err) {
        return res.status(400).send({ message: err });
      }
      return res.status(200).send({ usuarios: result });
    });
  }
);

module.exports = router;