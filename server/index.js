require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* ==========================
   REGISTRAR RECEPCIONISTA
========================== */
app.post("/recepcionistas", async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  // Validación básica
  if (!nombre || !usuario || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    // Cifrar contraseña
    const hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO recepcionistas (nombre, usuario, password, rol, estado)
      VALUES (?, ?, ?, ?, 'activo')
    `;

    db.query(
      sql,
      [nombre, usuario, hash, rol || "recepcionista"],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "El usuario ya existe" });
          }
          return res.status(500).json(err);
        }

        res.status(201).json({
          message: "Recepcionista registrado",
          id: result.insertId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
});


/* ==========================
   LOGIN RECEPCIONISTA
========================== */
app.post("/login", (req, res) => {
  const { usuario, password } = req.body;

  const sql = "SELECT * FROM recepcionistas WHERE usuario = ? AND estado = 'activo'";
  db.query(sql, [usuario], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(401).json({ message: "Usuario no encontrado" });

    const recep = results[0];
    const ok = await bcrypt.compare(password, recep.password);

    if (!ok)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    res.json({
      id: recep.id,
      nombre: recep.nombre,
      rol: recep.rol
    });
  });
});

/* ==========================
   REGISTRAR USUARIO
========================== */
app.post("/registrar_usuario", (req, res) => {
  const { nombre, apellido, telefono, email } = req.body;

  const sql = `
    INSERT INTO usuarios (nombre, apellido, telefono, email)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [nombre, apellido, telefono, email], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Usuario registrado", id: result.insertId });
  });
});

/* ==========================
   INSCRIBIR USUARIO
========================== */
app.post("/inscripciones", (req, res) => {
  const { usuario_id, membresia_id, fecha_inicio, fecha_fin } = req.body;

  const sql = `
    INSERT INTO inscripciones (usuario_id, membresia_id, fecha_inicio, fecha_fin)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [usuario_id, membresia_id, fecha_inicio, fecha_fin], err => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Inscripción creada" });
  });
});

/* ==========================
   VALIDAR ACCESO (recepción)
========================== */
app.get("/validar/:telefono", (req, res) => {
  const { telefono } = req.params;

  const sql = `
    SELECT u.nombre, u.apellido, i.fecha_fin
    FROM usuarios u
    JOIN inscripciones i ON u.id = i.usuario_id
    WHERE u.telefono = ?
    AND i.estado = 'activa'
    AND i.fecha_fin >= CURDATE()
  `;

  db.query(sql, [telefono], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.json({ activo: false });

    res.json({
      activo: true,
      usuario: results[0]
    });
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
/*=====================================================
                ver usuarios
  =====================================================*/
// Todos los usuarios
app.get("/usuarios", (req, res) => {
  const sql = "SELECT * FROM usuarios";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener usuarios:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
    res.json(results);
  });
});
//USUARIOS POR ID 
app.get("/usuarios/:id", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM usuarios WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(results[0]);
  });
});
