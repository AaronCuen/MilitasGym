import { useEffect, useState } from "react";
import axios from "axios";

function Users() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalRenovar, setMostrarModalRenovar] = useState(false);
  const [usuarioRenovar, setUsuarioRenovar] = useState(null);


  const [filtros, setFiltros] = useState({
    id: "",
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "todos",
  });

  const user = JSON.parse(localStorage.getItem("user"));

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const confirmarRenovacion = async (membresia_id) => {
    try {
      await axios.post(
        "http://localhost:4000/inscripciones/renovar",
        {
          usuario_id: usuarioRenovar.id,
          membresia_id
        },
        { headers: authHeaders() }
      );

      alert("Membresía renovada correctamente");

      setMostrarModalRenovar(false);
      setMostrarModal(false);

      // Recargar lista
      const res = await axios.get(
        "http://localhost:4000/usuarios-con-membresia",
        { headers: authHeaders() }
      );

      setUsuarios(res.data);

    } catch (error) {
      alert("Error al renovar membresía");
    }
  };
  
  const filtrarPorEstado = async (estado) => {
    const nuevosFiltros = { ...filtros, estado };
    setFiltros(nuevosFiltros);

    setLoading(true);

    const res = await axios.get(
      "http://localhost:4000/usuarios/filtrar-con-membresia",
      {
        params: nuevosFiltros,
        headers: authHeaders(),
      }
    );

    let data = res.data;
    console.log("ESTADO ACTUAL:", filtros.estado);


    /*if (estado !== "todos") {
      const filtrados = [];

      for (const u of data) {
        const activo = await obtenerEstado(u.id);

        if (
          (estado === "activo" && activo) ||
          (estado === "inactivo" && !activo)
        ) {
          filtrados.push(u);
        }
      }

      data = filtrados;
    }*/

    setUsuarios(data);
    setLoading(false);
  };


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
      setUsuarios(usuarios.filter((u) => u.id !== id));
    } catch {
      alert("Error al eliminar usuario");
    }
  };

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
      .get("http://localhost:4000/usuarios-con-membresia", {
        headers: authHeaders(),
      })
      .then((res) => setUsuarios(res.data));
  };

  const buscarUsuarios = async () => {
    setLoading(true);

    const res = await axios.get(
      "http://localhost:4000/usuarios/filtrar-con-membresia",
      {
        params: filtros,
        headers: authHeaders(),
      }
    );

    let data = res.data;

    if (filtros.estado !== "todos") {
      const filtrados = [];

      for (const u of data) {
        const activo = await obtenerEstado(u.id);

       /* if (
          (filtros.estado === "activo" && activo) ||
          (filtros.estado === "inactivo" && !activo)
        ) */{
          filtrados.push(u);
        }
      }

      data = filtrados;
    }

    setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => {
    axios
      .get("http://localhost:4000/usuarios-con-membresia", {
        headers: authHeaders(),
      })
      .then((res) => {
        setUsuarios(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <header style={styles.topbar}>
        <span style={styles.topTitle}>
          Usuarios registrados en el sistema.
        </span>
        <div style={styles.avatar}>
          {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.title}>Lista de usuarios registrados</h2>

          <div style={styles.FilersRow}>
            <input
              style={styles.InputFilters}
              placeholder="ID"
              value={filtros.id}
              onChange={(e) =>
                setFiltros({ ...filtros, id: e.target.value })
              }
            />

            <input
              style={styles.InputFilters}
              placeholder="Nombre"
              value={filtros.nombre}
              onChange={(e) =>
                setFiltros({ ...filtros, nombre: e.target.value })
              }
            />

            <div style={styles.dateGroup}>
              <label style={styles.dateLabel}>Fecha de registro</label>
              <input
                type="date"
                style={styles.InputFilters}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_inicio: e.target.value })
                }
              />
            </div>

            <div style={styles.dateGroup}>
              <label style={styles.dateLabel}>Fecha de vencimiento</label>
              <input
                type="date"
                style={styles.InputFilters}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_fin: e.target.value })
                }
              />
            </div>

            <button
              style={{
                ...styles.ButtonSearch,
                backgroundColor: filtros.estado === "activo" ? "#16a34a" : "#206320",
              }}
              onClick={() => filtrarPorEstado("activo")}
            >
              Activos
            </button>

            <button
              style={{
                ...styles.ButtonSearch,
                backgroundColor: filtros.estado === "inactivo" ? "#dc2626" : "rgb(116, 29, 29)",
              }}
              onClick={() => filtrarPorEstado("inactivo")}
            >
              Inactivos
            </button>



            <button style={styles.ButtonSearch} onClick={buscarUsuarios}>
              Buscar
            </button>
            <button style={styles.ButtonClear} onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>

          {loading ? (
            <p>Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            
            <div style={styles.tableContainer}>
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
                  <th style={{ ...styles.th, textAlign: "center" }}>
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((u, index) => (
              <tr
                key={u.id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                  transition: "background-color 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    index % 2 === 0 ? "#ffffff" : "#f9fafb")
                }
              >
                    <td style={styles.td}>{u.id}</td>
                    <td style={styles.td}>{u.nombre}</td>
                    <td style={styles.td}>{u.apellido}</td>
                    <td style={styles.td}>{u.telefono}</td>
                    <td style={styles.td}>{u.email}</td>

                    <td style={styles.td}>
                      <span
                        style={
                          u.estado === "ACTIVO"
                            ? styles.estadoActivo
                            : styles.estadoInactivo
                        }
                      >
                        {u.estado}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {u.fecha_fin
                        ? new Date(u.fecha_fin).toLocaleDateString()
                        : "—"}
                    </td>

                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <div style={styles.actions}>
                        <button
                          style={styles.btnView}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          onClick={() => verUsuario(u.id)}
                        >
                          Ver
                        </button>
                        <button
                          style={styles.btnDelete}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          onClick={() => eliminarUsuario(u.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
          )}
        </div>

{mostrarModal && usuarioSeleccionado && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      <div style={styles.modalContent}>

        {usuarioSeleccionado.foto && (
          <div style={styles.profileHeader}>
            <img
              src={usuarioSeleccionado.foto}
              alt="Foto del usuario"
              style={styles.profileImage}
            />
            <div>
              <h2 style={styles.profileName}>
                {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
              </h2>
              <p style={styles.profileEmail}>
                {usuarioSeleccionado.email}
              </p>
            </div>
          </div>
        )}

        <div style={styles.profileGrid}>
          <div>
            <span style={styles.label}>ID</span>
            <p style={styles.value}>{usuarioSeleccionado.id}</p>
          </div>

          <div>
            <span style={styles.label}>Teléfono</span>
            <p style={styles.value}>{usuarioSeleccionado.telefono}</p>
          </div>

          <div>
            <span style={styles.label}>Fecha de nacimiento</span>
            <p style={styles.value}>
              {usuarioSeleccionado.fecha_nacimiento || "No registrada"}
            </p>
          </div>

          <div>
            <span style={styles.label}>Género</span>
            <p style={styles.value}>
              {usuarioSeleccionado.genero || "No registrado"}
            </p>
          </div>

          <div>
            <span style={styles.label}>Fecha de registro</span>
            <p style={styles.value}>
              {usuarioSeleccionado.fecha_registro}
            </p>
          </div>

          <div>
            <span style={styles.label}>Fecha de vencimiento</span>
            <p style={styles.value}>
              {usuarioSeleccionado.fecha_fin}
            </p>
          </div>
        </div>

        {/* BOTÓN RENOVAR */}
        <div style={styles.modalButtons}>
          <button
            style={styles.btnRenew}
            onClick={() => {
              setUsuarioRenovar(usuarioSeleccionado);
              setMostrarModalRenovar(true);
            }}
          >
            Renovar
          </button>
        </div>

        {/* BOTÓN CERRAR PEQUEÑO CENTRADO */}
        <div style={styles.modalCloseContainer}>
          <button
            style={styles.btnCloseSmall}
            onClick={() => setMostrarModal(false)}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  </div>
)}

{mostrarModalRenovar && (
  <div style={styles.modalOverlay}>
    <div style={styles.renewModal}>
      
      <div style={styles.renewHeader}>
        <h3 style={styles.renewTitle}>Renovar Membresía</h3>
        <p style={styles.renewSubtitle}>
          Selecciona la duración de la nueva membresía
        </p>
      </div>

      <div style={styles.renewGrid}>
        <button
          style={styles.renewCard}
          onMouseEnter={(e) =>
            Object.assign(e.currentTarget.style, styles.renewCardHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.currentTarget.style, styles.renewCard)
          }
          onClick={() => confirmarRenovacion(1)}
        >
          <div style={styles.renewCardTitle}>1 Semana</div>
          <div style={styles.renewCardDesc}>7 días de acceso</div>
        </button>

        <button
          style={styles.renewCard}
          onMouseEnter={(e) =>
            Object.assign(e.currentTarget.style, styles.renewCardHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.currentTarget.style, styles.renewCard)
          }
          onClick={() => confirmarRenovacion(2)}
        >
          <div style={styles.renewCardTitle}>1 Mes</div>
          <div style={styles.renewCardDesc}>30 días de acceso</div>
        </button>

        <button
          style={styles.renewCard}
          onMouseEnter={(e) =>
            Object.assign(e.currentTarget.style, styles.renewCardHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.currentTarget.style, styles.renewCard)
          }
          onClick={() => confirmarRenovacion(3)}
        >
          <div style={styles.renewCardTitle}>1 Año</div>
          <div style={styles.renewCardDesc}>365 días de acceso</div>
        </button>
      </div>

      {/* BOTONES FINALES */}
      <div style={{ marginTop: "25px", textAlign: "center" }}>
      
        <div style={{ marginTop: "12px" }}>
          <button
            style={styles.btnCloseSmall}
            onClick={() => setMostrarModalRenovar(false)}
          >
            Cerrar
          </button>
        </div>

      </div>

    </div>
  </div>
)}

      </main>
    </>
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
  modalCloseContainer: {
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
},

btnCloseSmall: {
  backgroundColor: "transparent",
  color: "#6b7280",
  border: "none",
  fontSize: "13px",
  cursor: "pointer",
  padding: "4px 8px",
  transition: "all 0.2s ease",
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
    tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    border: "1px solid #f1f5f9",
  },

  FilersRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "14px",
    flexWrap: "nowrap",
    alignItems: "flex-end", // 👈 ESTA LÍNEA
  },

  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f3f4f6",
  },

   topbar: {
  height: "40px",
  backgroundColor: "#e5e7eb",
  display: "flex",
  alignItems: "center",          // 🔥 centra verticalmente
  justifyContent: "space-between",
  padding: "0 24px",             // solo horizontal
  borderBottom: "1px solid #d1d5db",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
  backdropFilter: "blur(2px)",
  },

  topTitle: {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  margin: 0,                     // 🔥 elimina margen default
  lineHeight: "1",               // 🔥 evita que estire altura
  display: "flex",
  alignItems: "center",
  },

  topRight: {
  display: "flex",
  alignItems: "center",          // 🔥 centra verticalmente
  gap: "16px",
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
    backgroundColor: "#991b1b", // rojo más elegante
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
  backgroundColor: "#1f2937",
  color: "#ffffff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s ease",
},

btnDelete: {
  backgroundColor: "#7f1d1d",
  color: "#ffffff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s ease",
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
btnRenew: {
  backgroundColor: "#16a34a",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "30px", // 🔥 separación real del texto
  fontWeight: "600",
  display: "block",
},

btnOption: {
  backgroundColor: "#16a34a",
  color: "white",
  border: "none",
  padding: "10px",
  marginTop: "10px",
  width: "100%",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
},

btnCancel: {
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  padding: "10px",
  marginTop: "10px",
  width: "100%",
  borderRadius: "6px",
  cursor: "pointer"
},
renewModal: {
  background: "#ffffff",
  padding: "35px",
  borderRadius: "18px",
  width: "480px",
  maxWidth: "90vw",
  boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
  textAlign: "center",
},

renewHeader: {
  marginBottom: "25px",
},

renewTitle: {
  fontSize: "20px",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "6px",
},

renewSubtitle: {
  fontSize: "14px",
  color: "#6b7280",
},

renewGrid: {
  display: "grid",
  gap: "14px",
  marginBottom: "20px",
},

renewCard: {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  cursor: "pointer",
  textAlign: "left",
  transition: "all 0.2s ease",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
},
renewCardHover: {
  border: "1px solid #9ca3af", // gris más visible
  backgroundColor: "#f3f4f6",  // fondo ligeramente gris
  boxShadow: "0 8px 20px rgba(0,0,0,0.12)", // sombra más marcada
  transform: "translateY(-3px)", // efecto elevación
},

renewCardTitle: {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
},
modalContent: {
  padding: "20px",
},

profileHeader: {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "25px",
},

profileImage: {
  width: "110px",
  height: "110px",
  objectFit: "cover",
  borderRadius: "50%",
  border: "4px solid #991b1b",
},

profileName: {
  margin: 0,
  fontSize: "22px",
  fontWeight: "600",
},

profileEmail: {
  margin: "5px 0 0 0",
  color: "#6b7280",
  fontSize: "14px",
},

profileGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
},

label: {
  fontSize: "11px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
},

value: {
  margin: "4px 0 0 0",
  fontWeight: "500",
},

modalButtons: {
  marginTop: "30px",
  display: "flex",
  gap: "10px",
  justifyContent: "flex-start", 
},

renewCardDesc: {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "4px",
},

btnCancelRenew: {
  marginTop: "10px",
  padding: "12px",
  width: "100%",
  backgroundColor: "#1f2937",
  border: "none",
  borderRadius: "10px",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
},

dateGroup: {
  display: "flex",
  flexDirection: "column",
  fontSize: "12px",
},

dateLabel: {
  marginBottom: "4px",
  color: "#6b7280",
  fontWeight: "500",
},
estadoActivo: {
  color: "#166534",
  backgroundColor: "#dcfce7",
  padding: "4px 10px",
  borderRadius: "20px",
  fontWeight: "600",
  fontSize: "12px",
  display: "inline-block",
},

estadoInactivo: {
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  padding: "4px 10px",
  borderRadius: "20px",
  fontWeight: "600",
  fontSize: "12px",
  display: "inline-block",
},



};

export default Users;
