const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db.js');
const carritoMiddleware = require('../middleware/carrito.js');

// POST: Completar venta
router.post('/venta', carritoMiddleware.validarCarrito, (req, res) => {
  const { id_usuario } = req.body;

  // 1. Obtener productos del carrito
  db.query(
    `SELECT c.*, p.precio, p.stock 
     FROM carrito c 
     JOIN productos p ON c.id_producto = p.id 
     WHERE c.id_usuario = ?`,
    [id_usuario],
    (err, carrito) => {
      if (err) return res.status(500).send({ message: 'Error al obtener el carrito' });
      if (carrito.length === 0) return res.status(400).send({ message: 'El carrito está vacío' });

      // 2. Verificar stock disponible
      for (let item of carrito) {
        if (item.cantidad > item.stock) {
          return res.status(400).send({
            message: `Stock insuficiente para el producto ${item.id_producto}. Disponible: ${item.stock}, Solicitado: ${item.cantidad}`
          });
        }
      }

      // 3. Insertar en tabla 'ventas'
      const id_venta = uuidv4();
      const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const totalVenta = carrito.reduce((suma, item) => suma + item.total, 0);

      db.query(
        'INSERT INTO ventas (id_venta, id_usuario, fecha, total) VALUES (?, ?, ?, ?)',
        [id_venta, id_usuario, fecha, totalVenta],
        (err) => {
          if (err) return res.status(500).send({ message: 'Error al registrar la venta' });

          // 4. Procesar cada producto del carrito
          const tareas = carrito.map((item) => {
            return new Promise((resolve, reject) => {
              // Insertar en detallescarrito
              db.query(
                'INSERT INTO detallescarrito (id_carrito, id_producto, cantidad, precio) VALUES (?, ?, ?, ?)',
                [id_venta, item.id_producto, item.cantidad, item.precio],
                (err) => {
                  if (err) return reject('Error al guardar detalle del producto');

                  // Actualizar stock en productos
                  const nuevoStock = item.stock - item.cantidad;
                  db.query(
                    'UPDATE productos SET stock = ? WHERE id = ?',
                    [nuevoStock, item.id_producto],
                    (err) => {
                      if (err) return reject('Error al actualizar stock');
                      resolve();
                    }
                  );
                }
              );
            });
          });

          // 5. Ejecutar todo y vaciar carrito
          Promise.all(tareas)
            .then(() => {
              db.query(
                'DELETE FROM carrito WHERE id_usuario = ?',
                [id_usuario],
                (err) => {
                  if (err) return res.status(500).send({ message: 'Venta completada, pero error al vaciar carrito' });

                  return res.status(200).send({ 
                    message: '¡Venta completada con éxito!',
                    id_venta: id_venta,
                    total: totalVenta.toFixed(2)
                  });
                }
              );
            })
            .catch((error) => {
              return res.status(500).send({ message: `Error durante la venta: ${error}` });
            });
        }
      );
    }
  );
});
// Al final de cada archivo de rutas
module.exports = router;