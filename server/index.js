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

  if (!nombre || !usuario || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO recepcionistas (nombre, usuario, password, rol)
      VALUES (?, ?, ?, ?)
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

  const sql = "SELECT * FROM recepcionistas WHERE usuario = ?";

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
   REGISTRAR USUARIO + INSCRIPCION
========================== */
app.post("/registrar_usuario", (req, res) => {
  const { nombre, apellido, telefono, email, membresia_id } = req.body;

  const sqlUser = `
    INSERT INTO usuarios (nombre, apellido, telefono, email)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sqlUser, [nombre, apellido, telefono, email], (err, result) => {
    if (err) return res.status(500).json(err);

    const usuario_id = result.insertId;

    const sqlIns = `
      INSERT INTO inscripciones (usuario_id, membresia_id, fecha_inicio, fecha_fin)
      VALUES (
        ?, 
        ?, 
        CURDATE(),
        CASE
          WHEN ? = 1 THEN DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          WHEN ? = 2 THEN DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
          WHEN ? = 3 THEN DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
        END
      )
    `;

    db.query(
      sqlIns,
      [usuario_id, membresia_id, membresia_id, membresia_id, membresia_id],
      (err2) => {
        if (err2) return res.status(500).json(err2);

        res.json({
          message: "Usuario e inscripción creados correctamente",
          usuario_id,
          membresia_id,
        });
      }
    );
  });
});


/* ==========================
   INSCRIBIR USUARIO MANUAL
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
   REGISTRAR ASISTENCIA
========================== */
app.post("/asistencia/:usuario_id", (req, res) => {
  const { usuario_id } = req.params;

  const sqlInscripcion = `
    SELECT fecha_fin 
    FROM inscripciones
    WHERE usuario_id = ?
    ORDER BY fecha_fin DESC
    LIMIT 1
  `;

  db.query(sqlInscripcion, [usuario_id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(400).json({
        message: "El usuario no tiene membresía registrada ❌"
      });
    }

    const fechaFin = new Date(results[0].fecha_fin);
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);

    if (hoy > fechaFin) {
      return res.status(400).json({
        message: "Membresía vencida ❌"
      });
    }

    const sqlAsistencia = `
      INSERT INTO asistencia (usuario_id, fecha_asistencia)
      VALUES (?, NOW())
    `;

    db.query(sqlAsistencia, [usuario_id], (err2) => {
      if (err2) return res.status(500).json(err2);

      res.json({
        message: "Asistencia registrada correctamente ✔️"
      });
    });
  });
});


/* ==========================
   CONSULTAR ESTADO DE MEMBRESÍA
========================== */
app.get("/inscripcion/:usuario_id", (req, res) => {
  const { usuario_id } = req.params;

  const sql = `
    SELECT *
    FROM inscripciones
    WHERE usuario_id = ?
    ORDER BY fecha_fin DESC
    LIMIT 1
  `;

  db.query(sql, [usuario_id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0)
      return res.status(404).json({ message: "Sin membresía" });

    res.json(result[0]);
  });
});


/* ==========================
   USUARIOS FILTRADOS
========================== */
app.get("/usuarios/filtrar", (req, res) => {
  const { id, nombre, fecha_inicio, fecha_fin } = req.query;

  let sql = `
    SELECT DISTINCT u.*
    FROM usuarios u
    LEFT JOIN inscripciones i ON u.id = i.usuario_id
    WHERE 1=1
  `;

  const params = [];

  if (id) {
    sql += " AND u.id = ?";
    params.push(id);
  }

  if (nombre) {
    sql += " AND (u.nombre LIKE ? OR u.apellido LIKE ?)";
    params.push(`%${nombre}%`, `%${nombre}%`);
  }

  if (fecha_inicio) {
    sql += " AND i.fecha_inicio >= ?";
    params.push(fecha_inicio);
  }

  if (fecha_fin) {
    sql += " AND i.fecha_fin <= ?";
    params.push(fecha_fin);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});



/* ==========================
   VER USUARIOS
========================== */

// todos
app.get("/usuarios", (req, res) => {
  const sql = "SELECT * FROM usuarios";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor" });
    }
    res.json(results);
  });
});

// por id
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


/* ==========================
   TEST SERVER
========================== */
app.get("/", (req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});


/* ==========================
   INICIAR SERVIDOR
========================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
