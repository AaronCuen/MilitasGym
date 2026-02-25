import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getStoredUser } from "../utils/storage";

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
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const fileInputRef = useRef(null);
  const [imagenEditar, setImagenEditar] = useState(null);
  const [previewImagenEditar, setPreviewImagenEditar] = useState("");

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
  const [filtrosResetKey, setFiltrosResetKey] = useState(0);


  const [filtros, setFiltros] = useState(INITIAL_FILTROS);

  const user = getStoredUser();

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const withAuth = useCallback(() => ({ headers: authHeaders() }), [authHeaders]);

  const cargarUsuarios = useCallback(async () => {
    const res = await axios.get(
      `${API_BASE_URL}/usuarios-con-membresia`,
      withAuth()
    );
    setUsuarios(res.data);
  }, [withAuth]);

  const onButtonHoverIn = (e) => {
    e.currentTarget.style.opacity = "0.85";
  };

  const onButtonHoverOut = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  const actualizarUsuarioEditando = (campo) => (e) => {
    const { value } = e.target;
    let valorNormalizado = value;

    if (campo === "telefono") {
      valorNormalizado = value.replace(/\D/g, "").slice(0, 10);
    }

    if (campo === "nombre" || campo === "apellido") {
      valorNormalizado = value
        .replace(/[^a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00ed\u00f3\u00fa\u00d1\u00f1\s]/g, "")
        .slice(0, 40);
    }

    setUsuarioEditando((prev) => ({
      ...prev,
      [campo]: valorNormalizado,
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
    if (!fecha) return "-";
    const valor = usarSplit ? fecha.split("T")[0] : fecha;
    return new Date(`${valor}T00:00:00`).toLocaleDateString("es-MX");
  };

  const fechaLocalISO = () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const normalizarFechaInput = (fecha) => {
    if (!fecha) return "";
    return fecha.includes("T") ? fecha.split("T")[0] : fecha;
  };

  const abrirModalRenovar = (usuario) => {
    const fechaVencimiento = normalizarFechaInput(usuario?.fecha_fin);
    const fechaPorDefecto = fechaVencimiento || fechaLocalISO();

    setUsuarioRenovar(usuario);
    setFechaInicioManual("");
    setFechaFinManual(fechaPorDefecto);
    setModoManual(false);
    setMostrarModalRenovar(true);
  };
const confirmarRenovacion = async (membresia_id) => {
  try {
    if (!usuarioRenovar?.id) {
      alert("No hay usuario seleccionado para renovar");
      return;
    }

    const data = {
      usuario_id: usuarioRenovar.id,
      membresia_id
    };

    if (membresia_id === 4) {
      if (!fechaFinManual) {
        alert("Debes seleccionar la fecha fin");
        return;
      }

      const fechaInicio = fechaInicioManual || fechaLocalISO();
      if (fechaFinManual <= fechaInicio) {
        alert("La fecha fin debe ser mayor a la fecha inicio");
        return;
      }

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
    try {
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
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Error al filtrar usuarios");
    } finally {
      setLoading(false);
    }
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

    } catch {
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
    const nombre = (usuarioEditando?.nombre || "").trim();
    const apellido = (usuarioEditando?.apellido || "").trim();
    const telefono = (usuarioEditando?.telefono || "").trim();
    const email = (usuarioEditando?.email || "").trim();

    if (!nombre) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!apellido) {
      alert("El apellido es obligatorio");
      return;
    }

    if (telefono && !/^\d{1,10}$/.test(telefono)) {
      alert("El telefono solo debe contener numeros (maximo 10)");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("El correo no tiene un formato valido");
      return;
    }

    let fotoUrl = usuarioEditando.foto;

    if (imagenEditar) {
      fotoUrl = await subirImagenCloudinary();
    }

    await axios.put(
      `${API_BASE_URL}/usuarios/${usuarioEditando.id}`,
      {
        ...usuarioEditando,
        nombre,
        apellido,
        telefono,
        email,
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
    setFiltros({ ...INITIAL_FILTROS });
    setFiltrosResetKey((prev) => prev + 1);
    await cargarUsuarios();
  };

  const buscarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/usuarios/filtrar-con-membresia`,
        {
          params: filtros,
          ...withAuth(),
        }
      );

      setUsuarios(res.data);
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Error al buscar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios()
      .then(() => setLoading(false))
      .catch(() => {
        setLoading(false);
      });
  }, [cargarUsuarios]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!imagenEditar) {
      setPreviewImagenEditar("");
      return;
    }

    const objectUrl = URL.createObjectURL(imagenEditar);
    setPreviewImagenEditar(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imagenEditar]);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isCompactFilters = viewportWidth < 1300;

  const topbarStyle = {
    ...styles.topbar,
    ...(isMobile ? { padding: "0 12px", height: "48px" } : {}),
  };
  const topTitleStyle = {
    ...styles.topTitle,
    ...(isMobile ? { fontSize: "14px" } : {}),
  };
  const avatarStyle = {
    ...styles.avatar,
    ...(isMobile ? { width: "30px", height: "30px", fontSize: "13px" } : {}),
  };
  const contentStyle = {
    ...styles.content,
    ...(isMobile ? { padding: "12px" } : isTablet ? { padding: "16px" } : {}),
  };
  const cardStyle = {
    ...styles.card,
    maxWidth: isMobile ? "100%" : isTablet ? "980px" : "1120px",
    ...(isMobile ? { padding: "14px" } : isTablet ? { padding: "20px" } : {}),
  };
  const filtersRowStyle = {
    ...styles.FilersRow,
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "stretch",
    width: "100%",
    rowGap: "10px",
  };
  const filterInputsGroupStyle = {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    flexWrap: isMobile ? "wrap" : "nowrap",
    flex: "0 0 auto",
    minWidth: 0,
    width: "100%",
  };
  const filterButtonsGroupStyle = {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: isMobile ? "wrap" : "nowrap",
    flex: "0 0 auto",
    width: "100%",
  };
  const filterTextInputStyle = {
    ...styles.InputFilters,
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    height: "42px",
    padding: "10px 12px",
    flex: isMobile ? "1 1 100%" : "0 0 150px",
    maxWidth: isMobile ? "100%" : "150px",
  };
  const filterDateInputStyle = {
    ...styles.InputFilters,
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    height: "42px",
    padding: "10px 12px",
  };
  const dateGroupStyle = {
    ...styles.dateGroup,
    flex: isMobile ? "1 1 100%" : "0 0 190px",
    minWidth: 0,
    maxWidth: isMobile ? "100%" : "190px",
  };
  const actionBtnStyle = {
    flex: isMobile ? "1 1 100%" : "0 0 auto",
    width: isMobile ? "100%" : "120px",
    height: "42px",
    padding: "0 12px",
    justifyContent: "center",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
  };
  const btnActivosStyle = {
    ...styles.filterBtnBase,
    ...styles.filterBtnActivo,
    ...(filtros.estado === "activo" ? styles.filterBtnActivoOn : styles.filterBtnActivoOff),
    ...actionBtnStyle,
  };
  const btnInactivosStyle = {
    ...styles.filterBtnBase,
    ...styles.filterBtnInactivo,
    ...(filtros.estado === "inactivo" ? styles.filterBtnInactivoOn : styles.filterBtnInactivoOff),
    ...actionBtnStyle,
  };
  const btnBuscarStyle = {
    ...styles.filterBtnBase,
    ...styles.filterBtnBuscar,
    ...actionBtnStyle,
  };
  const btnLimpiarStyle = {
    ...styles.filterBtnBase,
    ...styles.filterBtnLimpiar,
    ...actionBtnStyle,
  };
  const tableContainerStyle = {
    ...styles.tableContainer,
    overflowX: isMobile ? "auto" : "hidden",
  };
  const tableStyle = {
    ...styles.table,
    ...(isMobile ? { minWidth: "880px" } : {}),
  };
  const thStyle = {
    ...styles.th,
    ...(isMobile ? { padding: "10px", fontSize: "12px" } : {}),
  };
  const tdStyle = {
    ...styles.td,
    wordBreak: isMobile ? "break-word" : "normal",
    ...(isMobile ? { padding: "10px", fontSize: "12px" } : {}),
  };
  const actionThStyle = {
    ...thStyle,
    textAlign: "center",
    width: isMobile ? "160px" : "230px",
  };
  const actionTdStyle = {
    ...tdStyle,
    textAlign: "center",
    width: isMobile ? "160px" : "230px",
  };
  const rowActionsStyle = {
    ...styles.actions,
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: "8px",
  };
  const rowEditBtnStyle = {
    ...styles.btnEdit,
    ...(isCompactFilters ? { padding: "6px 10px" } : {}),
  };
  const rowViewBtnStyle = {
    ...styles.btnView,
    ...(isCompactFilters ? { padding: "6px 10px" } : {}),
  };
  const rowDeleteBtnStyle = {
    ...styles.btnDelete,
    ...(isCompactFilters ? { padding: "6px 10px" } : {}),
  };
  const modalStyle = {
    ...styles.editModal,
    ...(isMobile ? { width: "95vw", padding: "14px" } : isTablet ? { width: "86vw" } : {}),
  };
  const modalGridStyle = {
    ...styles.viewInfoGrid,
    ...(isMobile ? { gridTemplateColumns: "1fr" } : {}),
  };
  const modalFormGridStyle = {
    ...styles.editFormGrid,
    ...(isMobile ? { gap: "10px" } : {}),
  };
  const modalActionsStyle = {
    ...styles.editActions,
    ...(isMobile ? { flexDirection: "column", alignItems: "stretch" } : {}),
  };
  const modalPrimaryBtnStyle = {
    ...styles.editBtnPrimary,
    ...(isMobile ? { width: "100%" } : {}),
  };
  const modalSecondaryBtnStyle = {
    ...styles.editBtnSecondary,
    ...(isMobile ? { width: "100%" } : {}),
  };
  const photoModalStyle = {
    ...styles.photoModal,
    ...(isMobile ? { width: "95vw", padding: "12px" } : {}),
  };

  return (
    <>
      <header style={topbarStyle}>
        <span style={topTitleStyle}>
          Usuarios registrados en el sistema.
        </span>
        <div style={avatarStyle}>
          {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
        </div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={styles.title}>Lista de usuarios registrados</h2>

          <div style={filtersRowStyle}>
            <div style={filterInputsGroupStyle}>
              <input
                style={filterTextInputStyle}
                placeholder="ID"
                value={filtros.id}
                onChange={actualizarFiltro("id")}
              />

              <input
                style={filterTextInputStyle}
                placeholder="Nombre"
                value={filtros.nombre}
                onChange={actualizarFiltro("nombre")}
              />

              <div style={dateGroupStyle}>
                <label style={styles.dateLabel}>Fecha de registro</label>
                <input
                  key={`fecha_inicio_${filtrosResetKey}`}
                  type="date"
                  style={filterDateInputStyle}
                  value={filtros.fecha_inicio || ""}
                  onChange={actualizarFiltro("fecha_inicio")}
                />
              </div>

              <div style={dateGroupStyle}>
                <label style={styles.dateLabel}>Fecha de vencimiento</label>
                <input
                  key={`fecha_fin_${filtrosResetKey}`}
                  type="date"
                  style={filterDateInputStyle}
                  value={filtros.fecha_fin || ""}
                  onChange={actualizarFiltro("fecha_fin")}
                />
              </div>
            </div>

            <div style={filterButtonsGroupStyle}>
              <button
                style={btnActivosStyle}
                onMouseEnter={onButtonHoverIn}
                onMouseLeave={onButtonHoverOut}
                onClick={() => filtrarPorEstado("activo")}
              >
                Activos
              </button>

              <button
                style={btnInactivosStyle}
                onMouseEnter={onButtonHoverIn}
                onMouseLeave={onButtonHoverOut}
                onClick={() => filtrarPorEstado("inactivo")}
              >
                Inactivos
              </button>

              <button
                style={btnBuscarStyle}
                onMouseEnter={onButtonHoverIn}
                onMouseLeave={onButtonHoverOut}
                onClick={buscarUsuarios}
              >
                Buscar
              </button>
              <button
                style={btnLimpiarStyle}
                onMouseEnter={onButtonHoverIn}
                onMouseLeave={onButtonHoverOut}
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>
          </div>

          {loading ? (
            <p>Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            
            <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Apellido</th>
                  <th style={thStyle}>Teléfono</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Vence</th>
                  <th style={actionThStyle}>
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
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.nombre}</td>
                    <td style={tdStyle}>{u.apellido}</td>
                    <td style={tdStyle}>{u.telefono}</td>
                    <td style={tdStyle}>{u.email}</td>

                    <td style={tdStyle}>
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

                    <td style={tdStyle}>
                      {formatearFecha(u.fecha_fin, true)}
                    </td>

                    <td style={actionTdStyle}>
                      <div style={rowActionsStyle}>

                        <button
                          style={rowEditBtnStyle}
                          onMouseEnter={onButtonHoverIn}
                          onMouseLeave={onButtonHoverOut}
                          onClick={() => abrirModalEditar(u)}
                        >
                          Editar
                        </button>

                        <button
                          style={rowViewBtnStyle}
                          onMouseEnter={onButtonHoverIn}
                          onMouseLeave={onButtonHoverOut}
                          onClick={() => verUsuario(u.id)}
                        >
                          Ver
                        </button>
                        <button
                          style={rowDeleteBtnStyle}
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
    <div style={modalStyle}>
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

      <div style={modalGridStyle}>
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
            {usuarioSeleccionado.fecha_nacimiento
              ? formatearFecha(usuarioSeleccionado.fecha_nacimiento)
              : "No registrada"}
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

      <div style={modalActionsStyle}>
        <button
          style={modalPrimaryBtnStyle}
          onMouseEnter={onButtonHoverIn}
          onMouseLeave={onButtonHoverOut}
          onClick={() => abrirModalRenovar(usuarioSeleccionado)}
        >
          Renovar
        </button>

        <button
          style={modalSecondaryBtnStyle}
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
    <div style={photoModalStyle}>
      <img
        src={usuarioSeleccionado.foto}
        alt="Foto ampliada"
        style={styles.photoModalImage}
      />
      <div style={modalActionsStyle}>
        <button
          style={modalSecondaryBtnStyle}
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
    <div style={modalStyle}>
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
        <div style={modalFormGridStyle}>
          <div style={styles.editField}>
            <label style={styles.editLabel}>
              Fecha Inicio (vacio = hoy)
            </label>
            <input
              type="date"
              value={fechaInicioManual}
              onChange={(e) => setFechaInicioManual(e.target.value)}
              style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
            />
          </div>

          <div style={styles.editField}>
            <label style={styles.editLabel}>Fecha Fin</label>
            <input
              type="date"
              value={fechaFinManual}
              onChange={(e) => setFechaFinManual(e.target.value)}
              style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
            />
          </div>

          <div style={modalActionsStyle}>
            <button
              style={modalPrimaryBtnStyle}
              onMouseEnter={onButtonHoverIn}
              onMouseLeave={onButtonHoverOut}
              onClick={() => confirmarRenovacion(4)}
            >
              Confirmar
            </button>

            <button
              style={modalSecondaryBtnStyle}
              onClick={() => setModoManual(false)}
            >
              Volver
            </button>

            <button
              style={modalSecondaryBtnStyle}
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
        <div style={modalActionsStyle}>
          <button
            style={modalSecondaryBtnStyle}
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
    <div style={modalStyle}>
      <div style={styles.editHeader}>
        <h3 style={styles.editTitle}>Editar Usuario</h3>
        <p style={styles.editSubtitle}>Actualiza la información del perfil.</p>
      </div>

      <div style={styles.editAvatarWrap}>
        {(imagenEditar || usuarioEditando?.foto) && (
          <img
            src={
              previewImagenEditar
                ? previewImagenEditar
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

      <div style={modalFormGridStyle}>
        <div style={styles.editField}>
          <label style={styles.editLabel}>Nombre</label>
          <input
            type="text"
            value={usuarioEditando.nombre || ""}
            onChange={actualizarUsuarioEditando("nombre")}
            style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Apellido</label>
          <input
            type="text"
            value={usuarioEditando.apellido || ""}
            onChange={actualizarUsuarioEditando("apellido")}
            style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Teléfono</label>
          <input
            type="tel"
            value={usuarioEditando.telefono || ""}
            onChange={actualizarUsuarioEditando("telefono")}
            style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Correo</label>
          <input
            type="email"
            value={usuarioEditando.email || ""}
            onChange={actualizarUsuarioEditando("email")}
            style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.editLabel}>Fecha de Nacimiento</label>
          <input
            type="date"
            value={usuarioEditando.fecha_nacimiento || ""}
            onChange={actualizarUsuarioEditando("fecha_nacimiento")}
            style={{ ...styles.editInput, ...(isMobile ? { minWidth: "100%" } : {}) }}
          />
        </div>
      </div>

      <div style={modalActionsStyle}>
        <button
          style={modalPrimaryBtnStyle}
          onMouseEnter={onButtonHoverIn}
          onMouseLeave={onButtonHoverOut}
          onClick={guardarCambiosUsuario}
        >
          Guardar Cambios
        </button>

        <button
          style={modalSecondaryBtnStyle}
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
  filterBtnBase: {
  padding: "8px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  color: "#0f172a",
  fontWeight: "600",
  fontSize: "13px",
  letterSpacing: "0.2px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
  transition: "all 0.2s ease",
  },
  filterBtnActivo: {
  borderColor: "#cbd5e1",
  },
  filterBtnActivoOn: {
  backgroundColor: "#e2e8f0",
  color: "#0f172a",
  },
  filterBtnActivoOff: {
  backgroundColor: "#f8fafc",
  color: "#334155",
  },
  filterBtnInactivo: {
  borderColor: "#cbd5e1",
  },
  filterBtnInactivoOn: {
  backgroundColor: "#e2e8f0",
  color: "#0f172a",
  },
  filterBtnInactivoOff: {
  backgroundColor: "#f8fafc",
  color: "#334155",
  },
  filterBtnBuscar: {
  backgroundColor: "#1e293b",
  borderColor: "#1e293b",
  color: "#f8fafc",
  },
  filterBtnLimpiar: {
  backgroundColor: "#475569",
  borderColor: "#475569",
  color: "#f8fafc",
  },

  InputFilters: {
    width: "100%",
    boxSizing: "border-box",
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
  whiteSpace: "nowrap",
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
  whiteSpace: "nowrap",
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
  whiteSpace: "nowrap",
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
