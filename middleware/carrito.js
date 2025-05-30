const jwt = require('jsonwebtoken');

module.exports = {
    validarCarrito: (req, res, next) => {
        const { id_carrito, id_comprador, fecha, total, id_producto } = req.body;

        // Verificamos si `id_producto` es un arreglo y contiene al menos un producto
        if (!id_producto || !Array.isArray(id_producto) || id_producto.length === 0) {
            return res.status(400).json({
                mensaje: 'El carrito está vacío. Agrega al menos un producto para continuar.'
            });
        }

        // Si todo está bien, continúa al siguiente middleware o controlador
        next();
    }
};