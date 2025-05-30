const express = require('express');
const router = express.Router();
const db = require('../lib/db.js');
const userMiddleware = require('../middleware/productos.js');

// GET: Buscar producto por nombre (Solo usuarios no administradores)
router.get('/buscar/:nombre', 
  userMiddleware.validarUsuarioNoAdmin,
  (req, res) => {
    const { nombre } = req.params;
    
    db.query(
      'SELECT * FROM productos WHERE LOWER(nombre_producto) LIKE LOWER(?) LIMIT 10',
      ['%' + nombre + '%'],
      (err, result) => {
        if (err) {
          return res.status(400).send({ message: err });
        }
        return res.status(200).send({ productos: result });
      }
    );
  }
);

// GET: Buscar producto por tipo (Solo usuarios no administradores)
router.get('/buscar_tipo/:tipo', 
  userMiddleware.validarUsuarioNoAdmin,
  (req, res) => {
    const { tipo } = req.params;
    
    db.query(
      'SELECT * FROM productos WHERE LOWER(tipo_producto) LIKE LOWER(?) LIMIT 10',
      ['%' + tipo + '%'],
      (err, result) => {
        if (err) {
          return res.status(400).send({ message: err });
        }
        return res.status(200).send({ productos: result });
      }
    );
  }
);

// GET: Listar productos (Solo usuarios no administradores)
router.get('/productos', 
  userMiddleware.validarUsuarioNoAdmin,
  (req, res) => {
    db.query('SELECT * FROM productos;', (err, result) => {
      if (err) {
        return res.status(400).send({ message: err });
      }
      return res.status(200).send({ productos: result });
    });
  }
);

module.exports = router;