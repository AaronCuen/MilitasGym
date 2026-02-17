import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Users() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

    const rol = localStorage.getItem("rol");
    const isAdmin = rol === "admin";
    const user = JSON.parse(localStorage.getItem("user"));

const authHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");
  return {
    Authorization: `Bearer ${token}`
  };
};

  // States acciones de la tabla 
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Inicio de las funciones de las acciones de la tabla 
const verUsuario = async (id) => {
  try {
    const res = await axios.get(
      `http://localhost:4000/usuarios/${id}`,
      { headers: authHeaders() }
    );
    setUsuarioSeleccionado(res.data);
    setMostrarModal(true);
  } catch {
    alert("Error al obtener información del usuario");
  }
};

const eliminarUsuario = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;

  try {
    await axios.delete(
      `http://localhost:4000/usuarios/${id}`,
      { headers: authHeaders() }
    );
    setUsuarios(usuarios.filter(u => u.id !== id));
  } catch {
    alert("Error al eliminar usuario");
  }
};

const cerrarModal = () => {
  setMostrarModal(false);
  setUsuarioSeleccionado(null);
};

// Fin de las funciones de las acciones de la tabla 

  const [filtros, setFiltros] = useState({
    id: "",
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "todos", // activo | inactivo | todos
  });

const obtenerEstado = async (usuario_id) => {
  try {
    const res = await axios.get(
      `http://localhost:4000/inscripcion/${usuario_id}`,
      { headers: authHeaders() }
    );

    const hoy = new Date();
    const fechaFin = new Date(res.data.fecha_fin);

    return fechaFin >= hoy;
  } catch {
    return false;
  }
};

const limpiarFiltros = () => {
  setFiltros({
    id: "",
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "todos",
  });

  axios
    .get(
      "http://localhost:4000/usuarios-con-membresia",
      { headers: authHeaders() }
    )
    .then((res) => setUsuarios(res.data));
};


const buscarUsuarios = async () => {
  setLoading(true);

  const res = await axios.get(
    "http://localhost:4000/usuarios/filtrar-con-membresia",
    {
      params: filtros,
      headers: authHeaders()
    }
  );

  let data = res.data;

  if (filtros.estado !== "todos") {
    const filtrados = [];

    for (const u of data) {
      const activo = await obtenerEstado(u.id);

      if (
        (filtros.estado === "activo" && activo) ||
        (filtros.estado === "inactivo" && !activo)
      ) {
        filtrados.push(u);
      }
    }

    data = filtrados;
  }

  setUsuarios(data);
  setLoading(false);
};



  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

useEffect(() => {
  axios
    .get(
      "http://localhost:4000/usuarios-con-membresia",
      { headers: authHeaders() }
    )
    .then((res) => {
      setUsuarios(res.data);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
      navigate("/");
    });
}, []);

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          Militas<span style={{ color: "#a31211" }}>GYM</span>
        </div>

        <nav style={styles.nav}>
          <div style={styles.sectionLabel}>- USUARIOS</div>
          <Link
            to="/registrar"
            style={{ ...styles.link, ...(isActive("/registrar") && styles.active) }}
          >
            Registrar usuarios
          </Link>

          <Link
            to="/buscar-usuario"
            style={{
              ...styles.link,
              ...(isActive("/buscar-usuario") && styles.active),
            }}
          >
            Registrar asistencia 
          </Link>

          <Link
            to="/usuarios"
            style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}
          >
            Lista de usuarios 
          </Link>
            {isAdmin && (
              <Link
                to="/registrar-recepcionista"
                style={{
                  ...styles.link,
                  ...(isActive("/registrar-recepcionista") && styles.active),
                }}
              >
                Registrar recepcionista
              </Link>
            )}
        </nav>

        {/* 🔴 LOGOUT ABAJO */}
        <div style={styles.logoutContainer}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* AREA DERECHA */}
      <div style={styles.right}>
        {/* TOPBAR */}
        <header style={styles.topbar}>
          <span style={styles.topTitle}>
            Usuarios registrados en el sistema.
          </span>
          <div style={styles.avatar}>H</div>
        </header>

        {/* CONTENIDO */}
        <main style={styles.content}>
          <div style={styles.card}>


            <h2 style={styles.title}>Usuarios registrados</h2>

            <div style={styles.FilersRow}>
              <input style={styles.InputFilters}
                placeholder="ID"
                value={filtros.id}
                onChange={(e) =>
                  setFiltros({ ...filtros, id: e.target.value })
                }
              />

              <input style={styles.InputFilters}
                placeholder="Nombre"
                value={filtros.nombre}
                onChange={(e) =>
                  setFiltros({ ...filtros, nombre: e.target.value })
                }
              />

              <input style={styles.InputFilters}
                type="date"
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_inicio: e.target.value })
                }
              />

              <input style={styles.InputFilters}
                type="date"
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_fin: e.target.value })
                }
              />

              <select style={styles.InputFilters}
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value })
                }
              >
                <option value="todos">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>

              <button style={styles.ButtonSearch} onClick={buscarUsuarios}>Buscar</button>
              <button style={styles.ButtonClear} onClick={limpiarFiltros}>Limpiar</button>

            </div>



            {loading ? (
              <p>Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
              <p>No hay usuarios registrados.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Nombre</th>
                    <th style={styles.th}>Apellido</th>
                    <th style={styles.th}>Teléfono</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Vence</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((u, index) => (
                    <tr
                      key={u.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <td style={styles.td}>{u.id}</td>
                      <td style={styles.td}>{u.nombre}</td>
                      <td style={styles.td}>{u.apellido}</td>
                      <td style={styles.td}>{u.telefono}</td>
                      <td style={styles.td}>{u.email}</td>

                      <td style={{
                      ...styles.td,
                      color: u.estado === "ACTIVO" ? "#16a34a" : "#dc2626",
                      fontWeight: "600"
                    }}>
                      {u.estado}
                    </td>

                    <td style={styles.td}>
                      {u.fecha_fin
                        ? new Date(u.fecha_fin).toLocaleDateString()
                        : "—"}
                    </td>
                      
                      {/* Esto se cambiara cuando se modifique el index.js */}
                      <td style={{ ...styles.td, textAlign: "center" }}>
                      <div style={styles.actions}>
                      <button style={styles.btnView} onClick={() => verUsuario(u.id)}>Ver</button>
                      <button style={styles.btnDelete} onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                      </div>
                    </td>
                    {/*De aqui pa arriba */}

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
            {mostrarModal && usuarioSeleccionado && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                  {usuarioSeleccionado.foto && (
                    <div style={{ textAlign: "center", marginTop: "10px" }}>
                      <img
                        src={usuarioSeleccionado.foto}
                        alt="Foto del usuario"
                        style={{
                          width: "170px",
                          height: "170px",
                          objectFit: "cover",
                          borderRadius: "10%",
                          border: "3px solid #a31211",
                          boxShadow: "0px 0px 10px rgba(0,0,0,0.2)"
                        }}
                      />
                    </div>
                  )}
                  <p><b>ID:</b> {usuarioSeleccionado.id}</p>
                  <p><b>Nombre:</b> {usuarioSeleccionado.nombre}</p>
                  <p><b>Apellido:</b> {usuarioSeleccionado.apellido}</p>
                  <p><b>Teléfono:</b> {usuarioSeleccionado.telefono}</p>
                  <p><b>Email:</b> {usuarioSeleccionado.email}</p>

                  <p><b>Fecha de nacimiento:</b> {usuarioSeleccionado.fecha_nacimiento || "No registrada"}</p>
                  <p><b>Género:</b> {usuarioSeleccionado.genero || "No registrado"}</p>
                  <p><b>Fecha de registro:</b> {new Date(usuarioSeleccionado.fecha_registro).toLocaleString()}</p>

                  <button onClick={() => setMostrarModal(false)}>Cerrar</button>
                </div>
              </div>
            )}  
        </main>
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    fontFamily: "Segoe UI, Arial, sans-serif",
    overflow: "hidden",
  },

  sidebar: {
    width: "260px",
    backgroundColor: "#111827",
    color: "#d1d5db",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0,0,0,0.4)",
  },

  logo: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    paddingLeft: "20px",
    fontSize: "18px",
    fontWeight: "600",
    borderBottom: "1px solid #1f2937",
    color: "#ffffff",
  },

  nav: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },

  link: {
    textDecoration: "none",
    color: "#9ca3af",
    padding: "12px 14px",
    borderRadius: "6px",
    fontSize: "14px",
  },

  active: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
  },

  logoutContainer: {
    padding: "16px",
    borderTop: "1px solid #1f2937",
  },

  logoutBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#7f1d1d",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  ButtonClear: {
  padding: "8px 14px",
  backgroundColor: "#7f1d1d",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  },
  ButtonSearch: {
  padding: "8px 14px",
  backgroundColor: "#374151",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  },

  InputFilters: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    color: "#000",
    outline: "none",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)"
  },
  FilersRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "14px",
    flexWrap: "nowrap",
  },

  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f3f4f6",
  },

  topbar: {
    height: "64px",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: "1px solid #d1d5db",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
    backdropFilter: "blur(2px)",
  },

  topTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#a31211",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
  },

  content: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "24px",
  },

  card: {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: "#ffffff",
    padding: "28px",
    borderRadius: "14px",
    boxShadow: "none",
    marginTop: "10px",
  },

  title: {
    marginBottom: "20px",
    fontSize: "22px",
    fontWeight: "600",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "8px",
    color: "black",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 -10px 30px rgba(0,0,0,0.25), 0 14px 40px rgba(0,0,0,0.25)"
  },

  th: {
    background: "linear-gradient(to right, #580c0c, #6e0101)",
    color: "#ffffff",
    padding: "14px",
    textAlign: "left",
    fontWeight: "600",
  },

  td: {
    padding: "14px",
    color: "#111827",
    borderBottom: "1px solid #e5e7eb",
  },

actions: {
  display: "flex",
  gap: "8px",
  justifyContent: "center",
},

btnView: {
  padding: "6px 10px",
  backgroundColor: "#1f2937",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  cursor: "pointer",
},

btnDelete: {
  padding: "6px 10px",
  backgroundColor: "#7f1d1d",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  cursor: "pointer",
},
modalOverlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

modal: {
  background: "#fff",
  padding: "40px",                 // más espacio interno
  borderRadius: "16px",            // bordes más grandes
  width: "700px",                  // ancho grande
  maxWidth: "90vw",                // no se sale de pantalla
  maxHeight: "85vh",               // alto grande
  overflowY: "auto",               // scroll si se llena
  boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
  color: "#000",
  textAlign: "justify",
},

btnClose: {
  marginTop: "20px",
  padding: "10px",
  width: "100%",
  backgroundColor: "#374151",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
},
  sectionLabel: {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#94a3b8",
  marginTop: "20px",
  marginBottom: "10px",
  paddingLeft: "10px",
},


};

export default Users;
