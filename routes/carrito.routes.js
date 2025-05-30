const express = require('express');
const router = express.Router();
const db = require('../lib/db.js');

// POST: Agregar producto al carrito
router.post('/carrito', (req, res) => {
    const { id_comprador, id_producto, cantidad = 1 } = req.body;

    if (!id_comprador || !id_producto) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador e id_producto son requeridos' 
        });
    }

    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ 
            error: true,
            message: 'La cantidad debe ser un número mayor a 0' 
        });
    }

    const idProductoNum = parseInt(id_producto, 10);
    if (isNaN(idProductoNum)) {
        return res.status(400).json({ 
            error: true,
            message: 'id_producto debe ser un número válido' 
        });
    }

    db.query(
        'SELECT * FROM productos WHERE id = ?',
        [idProductoNum],
        (err, producto) => {
            if (err) {
                console.error('Error en query productos:', err);
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al verificar el producto',
                    details: err.message 
                });
            }

            if (producto.length === 0) {
                return res.status(404).json({ 
                    error: true,
                    message: 'Producto no encontrado' 
                });
            }

            if (producto[0].stock < cantidadNum) {
                return res.status(400).json({ 
                    error: true,
                    message: `Stock insuficiente. Disponible: ${producto[0].stock}` 
                });
            }

            const total = producto[0].precio_producto * cantidadNum;
            const fechaActual = new Date();

            db.query(
                'SELECT * FROM carrito WHERE id_comprador = ? AND id_producto = ?',
                [id_comprador, idProductoNum],
                (err, carritoExistente) => {
                    if (err) {
                        console.error('Error en query carrito:', err);
                        return res.status(500).json({ 
                            error: true,
                            message: 'Error al verificar el carrito',
                            details: err.message 
                        });
                    }

                    if (carritoExistente.length > 0) {
                        const nuevaCantidad = carritoExistente[0].cantidad + cantidadNum;
                        const nuevoTotal = producto[0].precio_producto * nuevaCantidad;
                        
                        if (producto[0].stock < nuevaCantidad) {
                            return res.status(400).json({ 
                                error: true,
                                message: `Stock insuficiente para la cantidad total solicitada. Disponible: ${producto[0].stock}, En carrito: ${carritoExistente[0].cantidad}` 
                            });
                        }

                        db.query(
                            'UPDATE carrito SET cantidad = ?, total = ?, fecha = ? WHERE id_comprador = ? AND id_producto = ?',
                            [nuevaCantidad, nuevoTotal, fechaActual, id_comprador, idProductoNum],
                            (err, result) => {
                                if (err) {
                                    console.error('Error al actualizar carrito:', err);
                                    return res.status(500).json({ 
                                        error: true,
                                        message: 'Error al actualizar el carrito',
                                        details: err.message 
                                    });
                                }
                                return res.status(200).json({ 
                                    success: true,
                                    message: 'Cantidad actualizada en el carrito correctamente!',
                                    cantidad_total: nuevaCantidad,
                                    total: nuevoTotal
                                });
                            }
                        );
                    } else {
                        db.query(
                            'INSERT INTO carrito (id_comprador, id_producto, cantidad, fecha, total) VALUES (?, ?, ?, ?, ?)',
                            [id_comprador, idProductoNum, cantidadNum, fechaActual, total],
                            (err, result) => {
                                if (err) {
                                    console.error('Error al agregar al carrito:', err);
                                    return res.status(500).json({ 
                                        error: true,
                                        message: 'Error al agregar al carrito',
                                        details: err.message 
                                    });
                                }
                                return res.status(201).json({ 
                                    success: true,
                                    message: 'Producto agregado al carrito correctamente!',
                                    cantidad: cantidadNum,
                                    total: total,
                                    id_carrito: result.insertId
                                });
                            }
                        );
                    }
                }
            );
        }
    );
});

// PUT: Actualizar cantidad específica de un producto en el carrito
router.put('/carrito', (req, res) => {
    const { id_comprador, id_producto, cantidad } = req.body;
    
    if (!id_comprador || !id_producto || !cantidad) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador, id_producto y cantidad son requeridos' 
        });
    }
    
    const cantidadNum = parseInt(cantidad, 10);
    const idProductoNum = parseInt(id_producto, 10);
    
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ 
            error: true,
            message: 'La cantidad debe ser un número mayor a 0' 
        });
    }

    if (isNaN(idProductoNum)) {
        return res.status(400).json({ 
            error: true,
            message: 'id_producto debe ser un número válido' 
        });
    }
    
    db.query(
        'SELECT * FROM productos WHERE id = ?',
        [idProductoNum],
        (err, producto) => {
            if (err) {
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al verificar el producto',
                    details: err.message 
                });
            }
            
            if (producto.length === 0) {
                return res.status(404).json({ 
                    error: true,
                    message: 'Producto no encontrado' 
                });
            }
            
            if (producto[0].stock < cantidadNum) {
                return res.status(400).json({ 
                    error: true,
                    message: `Stock insuficiente. Disponible: ${producto[0].stock}` 
                });
            }
            
            db.query(
                'SELECT * FROM carrito WHERE id_comprador = ? AND id_producto = ?',
                [id_comprador, idProductoNum],
                (err, carritoItem) => {
                    if (err) {
                        return res.status(500).json({ 
                            error: true,
                            message: 'Error al verificar el carrito',
                            details: err.message 
                        });
                    }
                    
                    if (carritoItem.length === 0) {
                        return res.status(404).json({ 
                            error: true,
                            message: 'Producto no encontrado en el carrito' 
                        });
                    }
                    
                    const nuevoTotal = producto[0].precio_producto * cantidadNum;
                    const fechaActual = new Date();
                    
                    db.query(
                        'UPDATE carrito SET cantidad = ?, total = ?, fecha = ? WHERE id_comprador = ? AND id_producto = ?',
                        [cantidadNum, nuevoTotal, fechaActual, id_comprador, idProductoNum],
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({ 
                                    error: true,
                                    message: 'Error al actualizar el carrito',
                                    details: err.message 
                                });
                            }
                            
                            if (result.affectedRows === 0) {
                                return res.status(404).json({ 
                                    error: true,
                                    message: 'No se pudo actualizar el producto en el carrito' 
                                });
                            }
                            
                            return res.status(200).json({ 
                                success: true,
                                message: 'Cantidad actualizada correctamente!',
                                nueva_cantidad: cantidadNum,
                                nuevo_total: nuevoTotal
                            });
                        }
                    );
                }
            );
        }
    );
});

// PATCH: Incrementar o decrementar cantidad de un producto
router.patch('/carrito/cantidad', (req, res) => {
    const { id_comprador, id_producto, operacion } = req.body;
    
    if (!id_comprador || !id_producto || !operacion) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador, id_producto y operacion son requeridos' 
        });
    }
    
    if (operacion !== 'incrementar' && operacion !== 'decrementar') {
        return res.status(400).json({ 
            error: true,
            message: 'La operacion debe ser "incrementar" o "decrementar"' 
        });
    }

    const idProductoNum = parseInt(id_producto, 10);
    if (isNaN(idProductoNum)) {
        return res.status(400).json({ 
            error: true,
            message: 'id_producto debe ser un número válido' 
        });
    }
    
    db.query(
        'SELECT c.*, p.precio_producto, p.stock FROM carrito c JOIN productos p ON c.id_producto = p.id WHERE c.id_comprador = ? AND c.id_producto = ?',
        [id_comprador, idProductoNum],
        (err, carritoItem) => {
            if (err) {
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al obtener el producto del carrito',
                    details: err.message 
                });
            }
            
            if (carritoItem.length === 0) {
                return res.status(404).json({ 
                    error: true,
                    message: 'Producto no encontrado en el carrito' 
                });
            }
            
            const item = carritoItem[0];
            let nuevaCantidad;
            
            if (operacion === 'incrementar') {
                nuevaCantidad = item.cantidad + 1;
                
                if (item.stock < nuevaCantidad) {
                    return res.status(400).json({ 
                        error: true,
                        message: `Stock insuficiente. Disponible: ${item.stock}` 
                    });
                }
            } else {
                nuevaCantidad = item.cantidad - 1;
                
                if (nuevaCantidad <= 0) {
                    db.query(
                        'DELETE FROM carrito WHERE id_comprador = ? AND id_producto = ?',
                        [id_comprador, idProductoNum],
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({ 
                                    error: true,
                                    message: 'Error al eliminar el producto del carrito',
                                    details: err.message 
                                });
                            }
                            return res.status(200).json({ 
                                success: true,
                                message: 'Producto eliminado del carrito (cantidad llegó a 0)' 
                            });
                        }
                    );
                    return;
                }
            }
            
            const nuevoTotal = item.precio_producto * nuevaCantidad;
            const fechaActual = new Date();
            
            db.query(
                'UPDATE carrito SET cantidad = ?, total = ?, fecha = ? WHERE id_comprador = ? AND id_producto = ?',
                [nuevaCantidad, nuevoTotal, fechaActual, id_comprador, idProductoNum],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ 
                            error: true,
                            message: 'Error al actualizar la cantidad',
                            details: err.message 
                        });
                    }
                    
                    return res.status(200).json({ 
                        success: true,
                        message: `Cantidad ${operacion === 'incrementar' ? 'incrementada' : 'decrementada'} correctamente!`,
                        nueva_cantidad: nuevaCantidad,
                        nuevo_total: nuevoTotal
                    });
                }
            );
        }
    );
});

// DELETE: Eliminar un producto específico del carrito
router.delete('/carrito/producto', (req, res) => {
    const { id_comprador, id_producto } = req.body;
    
    if (!id_comprador || !id_producto) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador e id_producto son requeridos' 
        });
    }

    const idProductoNum = parseInt(id_producto, 10);
    if (isNaN(idProductoNum)) {
        return res.status(400).json({ 
            error: true,
            message: 'id_producto debe ser un número válido' 
        });
    }
    
    db.query(
        'SELECT * FROM carrito WHERE id_comprador = ? AND id_producto = ?',
        [id_comprador, idProductoNum],
        (err, carritoItem) => {
            if (err) {
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al verificar el carrito',
                    details: err.message 
                });
            }
            
            if (carritoItem.length === 0) {
                return res.status(404).json({ 
                    error: true,
                    message: 'Producto no encontrado en el carrito' 
                });
            }
            
            db.query(
                'DELETE FROM carrito WHERE id_comprador = ? AND id_producto = ?',
                [id_comprador, idProductoNum],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ 
                            error: true,
                            message: 'Error al eliminar el producto del carrito',
                            details: err.message 
                        });
                    }
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ 
                            error: true,
                            message: 'No se pudo eliminar el producto del carrito' 
                        });
                    }
                    
                    return res.status(200).json({ 
                        success: true,
                        message: 'Producto eliminado del carrito correctamente!' 
                    });
                }
            );
        }
    );
});

// DELETE: Vaciar todo el carrito de un usuario (CORREGIDO)
router.delete('/carrito/vaciar', (req, res) => {
    // Permitir id_comprador tanto en body como en params para mayor flexibilidad
    const id_comprador = req.body.id_comprador || req.params.id_comprador;
    
    if (!id_comprador) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador es requerido en el body o como parámetro' 
        });
    }
    
    // Primero verificar si el usuario tiene productos en el carrito
    db.query(
        'SELECT COUNT(*) as total FROM carrito WHERE id_comprador = ?',
        [id_comprador],
        (err, countResult) => {
            if (err) {
                console.error('Error al verificar carrito:', err);
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al verificar el carrito',
                    details: err.message 
                });
            }
            
            const totalProductos = countResult[0].total;
            
            if (totalProductos === 0) {
                return res.status(200).json({ 
                    success: true,
                    message: 'El carrito ya estaba vacío',
                    productos_eliminados: 0
                });
            }
            
            // Proceder a vaciar el carrito
            db.query(
                'DELETE FROM carrito WHERE id_comprador = ?',
                [id_comprador],
                (err, result) => {
                    if (err) {
                        console.error('Error al vaciar carrito:', err);
                        return res.status(500).json({ 
                            error: true,
                            message: 'Error al vaciar el carrito',
                            details: err.message 
                        });
                    }
                    
                    return res.status(200).json({ 
                        success: true,
                        message: 'Carrito vaciado correctamente!',
                        productos_eliminados: result.affectedRows
                    });
                }
            );
        }
    );
});

// DELETE: Ruta alternativa para vaciar carrito con parámetro en URL
router.delete('/carrito/vaciar/:id_comprador', (req, res) => {
    const { id_comprador } = req.params;
    
    if (!id_comprador) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador es requerido' 
        });
    }
    
    db.query(
        'SELECT COUNT(*) as total FROM carrito WHERE id_comprador = ?',
        [id_comprador],
        (err, countResult) => {
            if (err) {
                console.error('Error al verificar carrito:', err);
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al verificar el carrito',
                    details: err.message 
                });
            }
            
            const totalProductos = countResult[0].total;
            
            if (totalProductos === 0) {
                return res.status(200).json({ 
                    success: true,
                    message: 'El carrito ya estaba vacío',
                    productos_eliminados: 0
                });
            }
            
            db.query(
                'DELETE FROM carrito WHERE id_comprador = ?',
                [id_comprador],
                (err, result) => {
                    if (err) {
                        console.error('Error al vaciar carrito:', err);
                        return res.status(500).json({ 
                            error: true,
                            message: 'Error al vaciar el carrito',
                            details: err.message 
                        });
                    }
                    
                    return res.status(200).json({ 
                        success: true,
                        message: 'Carrito vaciado correctamente!',
                        productos_eliminados: result.affectedRows
                    });
                }
            );
        }
    );
});

// GET: Ver el carrito de un usuario
router.get('/carrito/:id_comprador', (req, res) => {
    const { id_comprador } = req.params;
    
    if (!id_comprador) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador es requerido' 
        });
    }
    
    db.query(
        `SELECT c.*, p.nombre_producto, p.precio_producto as precio_unitario, p.tipo_producto, p.descripcion 
         FROM carrito c 
         JOIN productos p ON c.id_producto = p.id 
         WHERE c.id_comprador = ? 
         ORDER BY c.fecha DESC`,
        [id_comprador],
        (err, result) => {
            if (err) {
                console.error('Error al obtener carrito:', err);
                return res.status(500).json({ 
                    error: true,
                    message: 'Error al obtener el carrito',
                    details: err.message 
                });
            }
            
            const totalGeneral = result.reduce((suma, item) => suma + parseFloat(item.total || 0), 0);
            
            return res.status(200).json({ 
                success: true,
                carrito: result,
                total_items: result.length,
                total_general: totalGeneral.toFixed(2)
            });
        }
    );
});

// POST: Completar la venta (mover carrito a detallescarrito) - CORREGIDO CON TRANSACCIONES
router.post('/carrito/completar', (req, res) => {
    const { id_comprador } = req.body;

    if (!id_comprador) {
        return res.status(400).json({ 
            error: true,
            message: 'id_comprador es requerido' 
        });
    }

    // Iniciar transacción para asegurar consistencia
    db.query('START TRANSACTION', (err) => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ 
                error: true,
                message: 'Error al iniciar la transacción',
                details: err.message 
            });
        }

        // Obtener productos del carrito
        db.query(
            'SELECT * FROM carrito WHERE id_comprador = ?',
            [id_comprador],
            (err, carrito) => {
                if (err) {
                    console.error('Error al obtener carrito:', err);
                    return db.query('ROLLBACK', () => {
                        res.status(500).json({ 
                            error: true,
                            message: 'Error al obtener el carrito',
                            details: err.message 
                        });
                    });
                }

                if (carrito.length === 0) {
                    return db.query('ROLLBACK', () => {
                        res.status(400).json({ 
                            error: true,
                            message: 'El carrito está vacío' 
                        });
                    });
                }

                // Verificar stock antes de proceder
                const stockQueries = carrito.map(item => {
                    return new Promise((resolve, reject) => {
                        db.query(
                            'SELECT stock FROM productos WHERE id = ? AND stock >= ?',
                            [item.id_producto, item.cantidad],
                            (err, result) => {
                                if (err) return reject(err);
                                if (result.length === 0) {
                                    return reject(new Error(`Stock insuficiente para producto ID: ${item.id_producto}`));
                                }
                                resolve();
                            }
                        );
                    });
                });

                Promise.all(stockQueries)
                    .then(() => {
                        // Procesar la venta
                        const ventaQueries = carrito.map(item => {
                            return new Promise((resolve, reject) => {
                                // Insertar en detallescarrito
                                db.query(
                                    'INSERT INTO detallescarrito (id_carrito, id_producto, cantidad, precio) VALUES (?, ?, ?, ?)',
                                    [item.id_carrito, item.id_producto, item.cantidad, item.total],
                                    (err, result) => {
                                        if (err) {
                                            console.error('Error al insertar en detallescarrito:', err);
                                            return reject(err);
                                        }

                                        // Actualizar stock
                                        db.query(
                                            'UPDATE productos SET stock = stock - ? WHERE id = ?',
                                            [item.cantidad, item.id_producto],
                                            (err, updateResult) => {
                                                if (err) {
                                                    console.error('Error al actualizar stock:', err);
                                                    return reject(err);
                                                }
                                                
                                                if (updateResult.affectedRows === 0) {
                                                    return reject(new Error(`No se pudo actualizar el stock del producto ID: ${item.id_producto}`));
                                                }
                                                
                                                resolve();
                                            }
                                        );
                                    }
                                );
                            });
                        });

                        return Promise.all(ventaQueries);
                    })
                    .then(() => {
                        // Si todo salió bien, vaciar el carrito
                        db.query(
                            'DELETE FROM carrito WHERE id_comprador = ?',
                            [id_comprador],
                            (err, deleteResult) => {
                                if (err) {
                                    console.error('Error al vaciar carrito después de venta:', err);
                                    return db.query('ROLLBACK', () => {
                                        res.status(500).json({ 
                                            error: true,
                                            message: 'Error al vaciar el carrito después de completar la venta',
                                            details: err.message 
                                        });
                                    });
                                }

                                // Confirmar transacción
                                db.query('COMMIT', (err) => {
                                    if (err) {
                                        console.error('Error al confirmar transacción:', err);
                                        return db.query('ROLLBACK', () => {
                                            res.status(500).json({ 
                                                error: true,
                                                message: 'Error al confirmar la transacción',
                                                details: err.message 
                                            });
                                        });
                                    }

                                    return res.status(200).json({ 
                                        success: true,
                                        message: 'Venta completada exitosamente y carrito vaciado',
                                        productos_procesados: carrito.length,
                                        productos_eliminados_carrito: deleteResult.affectedRows
                                    });
                                });
                            }
                        );
                    })
                    .catch(err => {
                        console.error('Error durante el proceso de venta:', err);
                        return db.query('ROLLBACK', () => {
                            res.status(500).json({ 
                                error: true,
                                message: 'Error al completar la venta',
                                details: err.message 
                            });
                        });
                    });
            }
        );
    });
});

module.exports = router;