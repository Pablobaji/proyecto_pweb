const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');

// http://localhost:3000/api/sign-up
router.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {
  db.query(
    'SELECT id_usuario FROM usuarios WHERE LOWER(nombre_usuario) = LOWER(?)',
    [req.body.username],
    (err, result) => {
      if (result && result.length) {
        // error
        return res.status(409).send({
          message: 'Este nombre de usuario ya esta en uso!',
        });
      } else {
        // username not in use
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              message: err,
            });
          } else {
            db.query(
              'INSERT INTO usuarios (id_usuario, nombre_usuario, contrasena_usuario, registro) VALUES (?, ?, ?, now());',
              [uuid.v4(), req.body.username, hash],
              (err, result) => {
                if (err) {
                  return res.status(400).send({
                    message: err,
                  });
                }
                return res.status(201).send({
                  message: 'Registrado!',
                });
              }
            );
          }
        });
      }
    }
  );
});

// http://localhost:3000/api/login
// ...existing code...

router.post('/login', (req, res, next) => {
    db.query(
        `SELECT * FROM usuarios WHERE nombre_usuario = ?;`,
        [req.body.username],
        (err, result) => {
            if (err) {
                return res.status(400).send({
                    message: err,
                });
            }
            if (!result.length) {
                return res.status(400).send({
                    message: 'Usuario o contraseña incorrectos!',
                });
            }

            bcrypt.compare(
                req.body.password,
                result[0]['contrasena_usuario'],
                (bErr, bResult) => {
                    if (bErr) {
                        return res.status(400).send({
                            message: 'Usuario o contraseña incorrectos!',
                        });
                    }
                    if (bResult) {
                        // Determinar el rol del usuario por nombre
                        let userRole = 'user';
                        if (
                            result[0].nombre_usuario === 'admin' ||
                            result[0].nombre_usuario === 'administrador'
                        ) {
                            userRole = 'admin';
                        }

                        const token = jwt.sign(
                            {
                                username: result[0].nombre_usuario,
                                userId: result[0].id_usuario,
                                rol: userRole
                            },
                            'SECRETKEY',
                            { expiresIn: '7d' }
                        );

                        db.query(
                            `UPDATE usuarios SET ultimo_inicio = now() WHERE id_usuario = ?;`,
                            [result[0].id_usuario]
                        );

                        // Solo envía datos necesarios al frontend
                        return res.status(200).send({
                            message: 'Sesion iniciada correctamente!',
                            token,
                            user: {
                                id_usuario: result[0].id_usuario,
                                nombre_usuario: result[0].nombre_usuario,
                                rol: userRole
                            },
                        });
                    }
                    return res.status(400).send({
                        message: 'Usuario o contraseña incorrectos!',
                    });
                }
            );
        }
    );
});

// ...existing code...

// http://localhost:3000/api/secret-route
router.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send('This is secret content!');
});

module.exports = router;