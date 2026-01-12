import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Users() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

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
        `http://localhost:4000/inscripcion/${usuario_id}`
      );

      const hoy = new Date();
      const fechaFin = new Date(res.data.fecha_fin);

      return fechaFin >= hoy;
    } catch {
      return false; // sin membresía = inactivo
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

    // opcional: volver a cargar todos
    axios.get("http://localhost:4000/usuarios").then((res) => {
      setUsuarios(res.data);
    });
  };


  const buscarUsuarios = async () => {
    setLoading(true);

    const res = await axios.get(
      "http://localhost:4000/usuarios/filtrar",
      { params: filtros }
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
      .get("http://localhost:4000/usuarios")
      .then((res) => {
        setUsuarios(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
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
            Buscar usuario
          </Link>

          <Link
            to="/usuarios"
            style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}
          >
            Usuarios
          </Link>
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

            <div>
              <input
                placeholder="ID"
                value={filtros.id}
                onChange={(e) =>
                  setFiltros({ ...filtros, id: e.target.value })
                }
              />

              <input
                placeholder="Nombre"
                value={filtros.nombre}
                onChange={(e) =>
                  setFiltros({ ...filtros, nombre: e.target.value })
                }
              />

              <input
                type="date"
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_inicio: e.target.value })
                }
              />

              <input
                type="date"
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_fin: e.target.value })
                }
              />

              <select
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value })
                }
              >
                <option value="todos">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>

              <button onClick={buscarUsuarios}>Buscar</button>
              <button onClick={limpiarFiltros}>Limpiar</button>

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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
    fontSize: "18px",
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
};

export default Users;
