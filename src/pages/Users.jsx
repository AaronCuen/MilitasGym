import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "http://p008kcwgw0084c4wkkwck088.31.97.209.55.sslip.io";
const INITIAL_FILTROS = {
  id: "",
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado: "todos",
};

function Users() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);
  const [imagenEditar, setImagenEditar] = useState(null);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalFoto, setMostrarModalFoto] = useState(false);
  const [mostrarModalRenovar, setMostrarModalRenovar] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioRenovar, setUsuarioRenovar] = useState(null);

  const [fechaInicioManual, setFechaInicioManual] = useState("");
  const [fechaFinManual, setFechaFinManual] = useState("");
  const [modoManual, setModoManual] = useState(false);


  const [filtros, setFiltros] = useState(INITIAL_FILTROS);

  const user = JSON.parse(localStorage.getItem("user"));

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const withAuth = () => ({ headers: authHeaders() });

  const cargarUsuarios = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/usuarios-con-membresia`,
      withAuth()
    );
    setUsuarios(res.data);
  };

  const onButtonHoverIn = (e) => {
    e.currentTarget.style.opacity = "0.85";
  };

  const onButtonHoverOut = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  const onCloseHoverIn = (e) => {
    e.currentTarget.style.color = "#111827";
  };

  const onCloseHoverOut = (e) => {
    e.currentTarget.style.color = "#6b7280";
  };

  const actualizarUsuarioEditando = (campo) => (e) => {
    const { value } = e.target;
    setUsuarioEditando((prev) => ({
      ...prev,
      [campo]: value,
    }));
  };

  const actualizarFiltro = (campo) => (e) => {
    const { value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [campo]: value,
    }));
  };

  const formatearFecha = (fecha, usarSplit = false) => {
    if (!fecha) return "â€”";
    const valor = usarSplit ? fecha.split("T")[0] : fecha;
    return new Date(`${valor}T00:00:00`).toLocaleDateString("es-MX");
  };

const confirmarRenovacion = async (membresia_id) => {
  try {

    const data = {
      usuario_id: usuarioRenovar.id,
      membresia_id
    };

    if (membresia_id === 4) {
      if (!fechaFinManual) {
        alert("Debes seleccionar la fecha fin");
        return;
      }

      const hoy = new Date().toISOString().split("T")[0];
      const fechaInicio = fechaInicioManual || hoy;

      data.fecha_inicio_manual = fechaInicio;
      data.fecha_fin_manual = fechaFinManual;

      if (!fechaInicioManual) {
        setFechaInicioManual(fechaInicio);
      }
    }

    await axios.post(
      `${API_BASE_URL}/inscripciones/renovar`,
      data,
      withAuth()
    );

    alert("Membresía renovada correctamente");

    setMostrarModalRenovar(false);
    setMostrarModal(false);
    setModoManual(false);
    setFechaInicioManual("");
    setFechaFinManual("");

    await cargarUsuarios();

  }catch (error) {
  console.log("ERROR REAL:", error.response?.data);
  console.log("STATUS:", error.response?.status);
  alert("Error al renovar membresía");
}
};
  
  const filtrarPorEstado = async (estado) => {
    const nuevosFiltros = { ...filtros, estado };
    setFiltros(nuevosFiltros);

    setLoading(true);

    const res = await axios.get(
      `${API_BASE_URL}/usuarios/filtrar-con-membresia`,
      {
        params: nuevosFiltros,
        ...withAuth(),
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

  const subirImagenCloudinary = async () => {
  if (!imagenEditar) return usuarioEditando.foto || null;

  const formData = new FormData();
  formData.append("file", imagenEditar);
  formData.append("upload_preset", "ml_default");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dqrdrnznk/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();
  return data.secure_url;
};
  const verUsuario = async (id) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/usuarios/${id}`,
        withAuth()
      );
      setUsuarioSeleccionado(res.data);
      setMostrarModalFoto(false);
      setMostrarModal(true);
    } catch {
      alert("Error al obtener información del usuario");
    }
  };

  const abrirModalEditar = async (usuario) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/usuarios/${usuario.id}`,
        withAuth()
      );

      console.log("Usuario completo:", res.data); // opcional para debug

      setUsuarioEditando(res.data);
      setImagenEditar(null);
      setMostrarModalEditar(true);

    } catch (error) {
      alert("Error al cargar datos del usuario");
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/usuarios/${id}`,
        withAuth()
      );
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Error al eliminar usuario");
    }
  };

  const guardarCambiosUsuario = async () => {
  try {

    let fotoUrl = usuarioEditando.foto;

    if (imagenEditar) {
      fotoUrl = await subirImagenCloudinary();
    }

    await axios.put(
      `${API_BASE_URL}/usuarios/${usuarioEditando.id}`,
      {
        ...usuarioEditando,
        foto: fotoUrl
      },
      withAuth()
    );

    alert("Usuario actualizado correctamente");

    setMostrarModalEditar(false);
    setImagenEditar(null);

    await cargarUsuarios();

  } catch (error) {
    console.log(error.response?.data);
    alert("Error al actualizar usuario");
  }
};

  const limpiarFiltros = async () => {
    setFiltros(INITIAL_FILTROS);
    await cargarUsuarios();
  };

  const buscarUsuarios = async () => {
    setLoading(true);

    const res = await axios.get(
      `${API_BASE_URL}/usuarios/filtrar-con-membresia`,
      {
        params: filtros,
        ...withAuth(),
      }
    );

    setUsuarios(res.data);
    setLoading(false);
  };

  useEffect(() => {
    cargarUsuarios()
      .then(() => setLoading(false))
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
              onChange={actualizarFiltro("id")}
            />

            <input
              style={styles.InputFilters}
              placeholder="Nombre"
              value={filtros.nombre}
              onChange={actualizarFiltro("nombre")}
            />

            <div style={styles.dateGroup}>
              <label style={styles.dateLabel}>Fecha de registro</label>
              <input
                type="date"
                style={styles.InputFilters}
                onChange={actualizarFiltro("fecha_inicio")}
              />
            </div>

            <div style={styles.dateGroup}>
              <label style={styles.dateLabel}>Fecha de vencimiento</label>
              <input
                type="date"
                style={styles.InputFilters}
                onChange={actualizarFiltro("fecha_fin")}
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
                      {formatearFecha(u.fecha_fin, true)}
                    </td>

                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <div style={styles.actions}>

                        <button
                          style={styles.btnEdit}
                          onMouseEnter={onButtonHoverIn}
                          onMouseLeave={onButtonHoverOut}
                          onClick={() => abrirModalEditar(u)}
                        >
                          Editar
                        </button>

                        <button
                          style={styles.btnView}
                          onMouseEnter={onButtonHoverIn}
                          onMouseLeave={onButtonHoverOut}
                          onClick={() => verUsuario(u.id)}
                        >
                          Ver
                        </button>
                        <button
                          style={styles.btnDelete}
                          onMouseEnter={onButtonHoverIn}
                          onMouseLeave={onButtonHoverOut}
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
    <div style={styles.editModal}>
      <div style={styles.editHeader}>
        <h3 style={styles.editTitle}>Detalle de Usuario</h3>
        <p style={styles.editSubtitle}>Informacion del perfil y membresia.</p>
      </div>

      <div style={styles.editAvatarWrap}>
        {usuarioSeleccionado.foto && (
          <div style={styles.viewPhotoRow}>
            <img
              src={usuarioSeleccionado.foto}
              alt="Foto del usuario"
              style={styles.editAvatar}
            />
            <button
              type="button"
              style={styles.editBtnSecondary}
              onMouseEnter={onButtonHoverIn}
              onMouseLeave={onButtonHoverOut}
              onClick={() => setMostrarModalFoto(true)}
            >
              Ver foto
            </button>
          </div>
        )}
        <h2 style={styles.profileName}>
          {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
        </h2>
        <p style={styles.profileEmail}>{usuarioSeleccionado.email}</p>
      </div>

      <div style={styles.viewInfoGrid}>
        <div style={styles.viewInfoItem}>
          <span style={styles.editLabel}>ID</span>
          <p style={styles.viewInfoValue}>{usuarioSeleccionado.id}</p>
        </div>

        <div style={styles.viewInfoItem}>
          <span style={styles.editLabel}>Telefono</span>
          <p style={styles.viewInfoValue}>{usuarioSeleccionado.telefono}</p>
        </div>

        <div style={styles.viewInfoItem}>
          <span style={styles.editLabel}>Fecha de nacimiento</span>
          <p style={styles.viewInfoValue}>
            {usuarioSeleccionado.fecha_nacimiento || "No registrada"}
          </p>
        </div>

        <div style={styles.viewInfoItem}>
          <span style={styles.editLabel}>Fecha de registro</span>
          <p style={styles.viewInfoValue}>
            {formatearFecha(usuarioSeleccionado.fecha_registro)}
          </p>
        </div>

        <div style={styles.viewInfoItem}>
          <span style={styles.editLabel}>Fecha de vencimiento</span>
          <p style={styles.viewInfoValue}>
            {formatearFecha(usuarioSeleccionado.fecha_fin)}
          </p>
        </div>
      </div>

      <div style={styles.editActions}>
        <button
          style={styles.editBtnPrimary}
          onMouseEnter={onButtonHoverIn}
          onMouseLeave={onButtonHoverOut}
          onClick={() => {
            setUsuarioRenovar(usuarioSeleccionado);
            setMostrarModalRenovar(true);
          }}
        >
          Renovar
        </button>

        <button
          style={styles.editBtnSecondary}
          onClick={() => {
            setMostrarModal(false);
            setMostrarModalFoto(false);
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

{mostrarModalFoto && usuarioSeleccionado?.foto && (
  <div style={styles.modalOverlay}>
    <div style={styles.photoModal}>
      <img
        src={usuarioSeleccionado.foto}
        alt="Foto ampliada"
        style={styles.photoModalImage}
      />
      <div style={styles.editActions}>
        <button
          style={styles.editBtnSecondary}
          onClick={() => setMostrarModalFoto(false)}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}
{mostrarModalRenovar && (
  <div style={styles.modalOverlay}>
    <div style={styles.editModal}>
      <div style={styles.editHeader}>
        <h3 style={styles.editTitle}>Renovar Membresia</h3>
        <p style={styles.editSubtitle}>
          Selecciona la duracion de la membresia.
        </p>
      </div>

      {!modoManual && (
        <div style={styles.renewOptionsGrid}>
          <button
            style={styles.renewOptionCard}
            onMouseEnter={onButtonHoverIn}
            onMouseLeave={onButtonHoverOut}
            onClick={() => confirmarRenovacion(1)}
          >
            <span style={styles.renewOptionTitle}>1 Dia</span>
            <span style={styles.renewOptionDesc}>Acceso por 1 dia</span>
          </button>

          <button
            style={styles.renewOptionCard}
            onMouseEnter={onButtonHoverIn}
            onMouseLeave={onButtonHoverOut}
            onClick={() => confirmarRenovacion(2)}
          >
            <span style={styles.renewOptionTitle}>1 Semana</span>
            <span style={styles.renewOptionDesc}>7 dias de acceso</span>
          </button>

          <button
            style={styles.renewOptionCard}
            onMouseEnter={onButtonHoverIn}
            onMouseLeave={onButtonHoverOut}
            onClick={() => confirmarRenovacion(3)}
          >
            <span style={styles.renewOptionTitle}>1 Mes</span>
            <span style={styles.renewOptionDesc}>30 dias de acceso</span>
          </button>

          <button
            style={styles.renewOptionCard}
            onMouseEnter={onButtonHoverIn}
            onMouseLeave={onButtonHoverOut}
            onClick={() => setModoManual(true)}
          >
            <span style={styles.renewOptionTitle}>Otro</span>
            <span style={styles.renewOptionDesc}>Seleccionar fechas manualmente</span>
          </button>
        </div>
      )}

      {modoManual && (
        <div style={styles.editFormGrid}>
          <div style={styles.editField}>
            <label style={styles.editLabel}>
              Fecha Inicio (vacio = hoy)
            </label>
            <input
              type="date"
              value={fechaInicioManual}
              onChange={(e) => setFechaInicioManual(e.target.value)}
              style={styles.editInput}
            />
          </div>

          <div style={styles.editField}>
            <label style={styles.editLabel}>Fecha Fin</label>
            <input
              type="date"
              value={fechaFinManual}
              onChange={(e) => setFechaFinManual(e.target.value)}
              style={styles.editInput}
            />
          </div>

          <div style={styles.editActions}>
            <button
              style={styles.editBtnPrimary}
              onMouseEnter={onButtonHoverIn}
              onMouseLeave={onButtonHoverOut}
              onClick={() => confirmarRenovacion(4)}
            >
              Confirmar
            </button>

            <button
              style={styles.editBtnSecondary}
              onClick={() => setModoManual(false)}
            >
              Volver
            </button>

            <button
              style={styles.editBtnSecondary}
              onClick={() => {
                setMostrarModalRenovar(false);
                setModoManual(false);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {!modoManual && (
        <div style={styles.editActions}>
          <button
            style={styles.editBtnSecondary}
            onClick={() => {
              setMostrarModalRenovar(false);
              setModoManual(false);
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  </div>
)}
{mostrarModalEditar && usuarioEditando && (
  <div style={styles.modalOverlay}>
    <div style={styles.editModal}>
      <div style={styles.editHeader}>
        <h3 style={styles.editTitle}>Editar Usuario</h3>
        <p style={styles.editSubtitle}>Actualiza la información del perfil.</p>
      </div>

      <div style={styles.editAvatarWrap}>
        {(imagenEditar || usuarioEditando?.foto) && (
          <img
            src={
              imagenEditar
                ? URL.createObjectURL(imagenEditar)
                : usuarioEditando.foto
            }
            alt="Preview"
            style={styles.editAvatar}
          />
        )}

        <button
          type="button"
          style={styles.changePhotoBtn}
          onMouseEnter={onButtonHoverIn}
          onMouseLeave={onButtonHoverOut}
          onClick={() => fileInputRef.current.click()}
        >
          Cambiar Foto
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => setImagenEditar(e.target.files[0])}
          style={{ display: "none" }}
        />
      </div>

      <div style={styles.editFormGrid}>
        <div style={styles.editField}>
          <label style={styles.editLabel}>Nombre</label>
          <input
            type="text"
            value={usuarioEditando.nombre || ""}
            onChange={actualizarUsuarioEditando("nombre")}
            style={styles.editInput}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Apellido</label>
          <input
            type="text"
            value={usuarioEditando.apellido || ""}
            onChange={actualizarUsuarioEditando("apellido")}
            style={styles.editInput}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Teléfono</label>
          <input
            type="tel"
            value={usuarioEditando.telefono || ""}
            onChange={actualizarUsuarioEditando("telefono")}
            style={styles.editInput}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Correo</label>
          <input
            type="email"
            value={usuarioEditando.email || ""}
            onChange={actualizarUsuarioEditando("email")}
            style={styles.editInput}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Fecha de Nacimiento</label>
          <input
            type="date"
            value={usuarioEditando.fecha_nacimiento || ""}
            onChange={actualizarUsuarioEditando("fecha_nacimiento")}
            style={styles.editInput}
          />
        </div>
      </div>

      <div style={styles.editActions}>
        <button
          style={styles.editBtnPrimary}
          onMouseEnter={onButtonHoverIn}
          onMouseLeave={onButtonHoverOut}
          onClick={guardarCambiosUsuario}
        >
          Guardar Cambios
        </button>

        <button
          style={styles.editBtnSecondary}
          onClick={() => setMostrarModalEditar(false)}
        >
          Cancelar
        </button>
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
    backgroundColor: "transparent",
    borderRadius: 0,
    boxShadow: "none",
    border: "none",
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

editModal: {
  background: "#ffffff",
  width: "560px",
  maxWidth: "92vw",
  maxHeight: "88vh",
  overflowY: "auto",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
  padding: "24px",
  color: "#111827",
},

editHeader: {
  marginBottom: "18px",
},

editTitle: {
  margin: 0,
  fontSize: "22px",
  fontWeight: "700",
  color: "#111827",
},

editSubtitle: {
  margin: "6px 0 0 0",
  fontSize: "13px",
  color: "#6b7280",
},

editAvatarWrap: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  marginBottom: "18px",
  paddingBottom: "18px",
  borderBottom: "1px solid #e5e7eb",
},

editAvatar: {
  width: "112px",
  height: "112px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid #991b1b",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
},

changePhotoBtn: {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
},

editFormGrid: {
  display: "grid",
  gap: "12px",
},

viewPhotoRow: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
},

photoModal: {
  backgroundColor: "#ffffff",
  width: "min(92vw, 760px)",
  maxHeight: "88vh",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  padding: "16px",
  boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
  overflow: "auto",
},

photoModalImage: {
  display: "block",
  width: "100%",
  maxHeight: "72vh",
  objectFit: "contain",
  borderRadius: "10px",
  backgroundColor: "#f9fafb",
},

renewOptionsGrid: {
  display: "grid",
  gap: "10px",
},

renewOptionCard: {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  cursor: "pointer",
  transition: "all 0.2s ease",
},

renewOptionTitle: {
  fontSize: "15px",
  fontWeight: "600",
  color: "#111827",
},

renewOptionDesc: {
  fontSize: "13px",
  color: "#6b7280",
},

viewInfoGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
},

viewInfoItem: {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "10px 12px",
},

viewInfoValue: {
  margin: "4px 0 0 0",
  fontSize: "14px",
  color: "#111827",
  fontWeight: "500",
},

editField: {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
},

editLabel: {
  fontSize: "12px",
  fontWeight: "600",
  color: "#374151",
},

editInput: {
  width: "100%",
  padding: "11px 12px",
  fontSize: "14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  color: "#111827",
  outline: "none",
},

editActions: {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
  paddingTop: "16px",
  borderTop: "1px solid #e5e7eb",
},

editBtnPrimary: {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  border: "none",
  padding: "9px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
},

editBtnSecondary: {
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
  padding: "9px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
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
btnEdit: {
  backgroundColor: "#16a34a",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s ease",
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



