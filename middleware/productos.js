const jwt = require('jsonwebtoken');

module.exports = {
    validarProducto: (req, res, next) => {
        const { nombre_producto, descripcion, precio, stock, tipo_producto } = req.body;
        
        if (!nombre_producto || nombre_producto.length < 3) {
            return res.status(400).send({
                message: 'Ingrese un nombre con mínimo 3 caracteres',
            });
        }
        
        if (!descripcion || descripcion.length < 10) {
            return res.status(400).send({
                message: 'Ingrese una descripción con mínimo 10 caracteres',
            });
        }
        
        // Hacer precio opcional ya que en tu ruta adminproducto no lo usas
        if (precio !== undefined) {
            const precioNum = parseFloat(precio);
            if (isNaN(precioNum) || precioNum <= 0) {
                return res.status(400).send({
                    message: 'Ingrese un precio válido',
                });
            }
        }
        
        const stockNum = parseInt(stock, 10);
        if (isNaN(stockNum) || stockNum < 0) {
            return res.status(400).send({
                message: 'Ingrese un stock válido',
            });
        }
        
        if (!tipo_producto || tipo_producto.length < 3) {
            return res.status(400).send({
                message: 'Ingrese un tipo con mínimo 3 caracteres',
            });
        }
        
        next();
    },

    validarUsuario: (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).send({ message: 'Token de acceso requerido' });
            }
            
            const token = authHeader.substring(7);
            // Usar la misma clave secreta que en el login
            const decoded = jwt.verify(token, 'SECRETKEY');
            
            // Solo permite si el usuario es admin
            if (decoded.rol !== 'admin') {
                return res.status(403).send({
                    message: 'Acceso denegado. Solo los administradores pueden realizar esta acción'
                });
            }
            
            req.usuario = decoded;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).send({ message: 'Token inválido' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).send({ message: 'Token expirado' });
            }
            return res.status(500).send({ message: 'Error interno del servidor' });
        }
    },

    validarUsuarioNoAdmin: (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).send({ message: 'Token de acceso requerido' });
            }
            
            const token = authHeader.substring(7);
            // Usar la misma clave secreta que en el login
            const decoded = jwt.verify(token, 'SECRETKEY');
            
            // Solo permite si el usuario NO es admin
            if (decoded.rol === 'admin') {
                return res.status(403).send({
                    message: 'Acceso denegado. Los administradores no pueden acceder a estas rutas'
                });
            }
            
            req.usuario = decoded;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).send({ message: 'Token inválido' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).send({ message: 'Token expirado' });
            }
            return res.status(500).send({ message: 'Error interno del servidor' });
        }
    }
};