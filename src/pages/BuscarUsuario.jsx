import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  clearSession,
  getActiveSucursalId,
  getStoredUser,
  markSessionExpired,
  onSucursalChange,
} from "../utils/storage";

function BuscarUsuario() {
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [id, setId] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [estadoMembresia, setEstadoMembresia] = useState("SIN MEMBRESIA");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const user = getStoredUser();

  const normalizarFechaInput = (fecha) => {
    if (!fecha) return "";
    return fecha.includes("T") ? fecha.split("T")[0] : fecha;
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "-";
    const [yyyy, mm, dd] = fechaISO.split("-");
    if (!yyyy || !mm || !dd) return fechaISO;
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleUnauthorized = (status) => {
    if (status !== 401) return false;
    markSessionExpired();
    clearSession();
    navigate("/", { replace: true });
    return true;
  };

  const calcularDiasRestantes = (fechaISO) => {
    if (!fechaISO) return null;
    const [yyyy, mm, dd] = fechaISO.split("-").map(Number);
    if (!yyyy || !mm || !dd) return null;

    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaFinLocal = new Date(yyyy, mm - 1, dd);
    const diffMs = fechaFinLocal.getTime() - hoyLocal.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onSucursalChange(() => {
      setUsuario(null);
      setMensaje("");
      setEstadoMembresia("SIN MEMBRESIA");
      setFechaVencimiento("");
    });
    return unsubscribe;
  }, []);

  const buscarUsuario = async () => {
    if (!id) {
      setMensaje("Ingresa un ID");
      setUsuario(null);
      setEstadoMembresia("SIN MEMBRESIA");
      setFechaVencimiento("");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const params = new URLSearchParams();
      if (user?.rol === "admin") {
        const activeSucursalId = getActiveSucursalId();
        if (activeSucursalId) {
          params.set("sucursal_id", String(activeSucursalId));
        }
      }
      const query = params.toString();

      const res = await fetch(`${API_BASE_URL}/usuarios/${id}${query ? `?${query}` : ""}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (handleUnauthorized(res.status)) return;
      const data = await res.json();

      if (!res.ok) {
        setMensaje("Usuario no encontrado");
        setUsuario(null);
        setEstadoMembresia("SIN MEMBRESIA");
        setFechaVencimiento("");
        return;
      }

      setUsuario(data);

      const insRes = await fetch(`${API_BASE_URL}/inscripcion/${id}${query ? `?${query}` : ""}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (handleUnauthorized(insRes.status)) return;
      const insData = await insRes.json();

      let estado = "Sin membresia";
      let fechaFinISO = "";

      if (insRes.ok && insData?.fecha_fin) {
        fechaFinISO = normalizarFechaInput(insData.fecha_fin);
        const diasRestantes = calcularDiasRestantes(fechaFinISO);
        estado = diasRestantes !== null && diasRestantes >= 0 ? "ACTIVA" : "VENCIDA";
      }

      setEstadoMembresia(estado.toUpperCase());
      setFechaVencimiento(fechaFinISO);

      if (estado === "ACTIVA") {
        const asisRes = await fetch(`${API_BASE_URL}/asistencia/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (handleUnauthorized(asisRes.status)) return;
        const asisData = await asisRes.json();

        if (!asisRes.ok) {
          setMensaje(asisData.message || "No se pudo registrar asistencia");
          return;
        }

        setMensaje(`Estado de membresia: ${estado}. ${asisData.message || "Asistencia registrada"}`);
      } else {
        setMensaje(`Estado de membresia: ${estado}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de servidor");
      setUsuario(null);
      setEstadoMembresia("SIN MEMBRESIA");
      setFechaVencimiento("");
    }
  };

  const onListo = () => {
    setUsuario(null);
    setMensaje("");
    setId("");
    setEstadoMembresia("SIN MEMBRESIA");
    setFechaVencimiento("");
  };

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

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
    ...(isMobile ? { padding: "16px" } : {}),
  };
  const inputStyle = {
    ...styles.input,
    ...(isMobile ? { fontSize: "13px", padding: "10px" } : {}),
  };
  const labelStyle = {
    ...styles.label,
    ...(isMobile ? { fontSize: "14px" } : {}),
  };
  const valueStyle = {
    ...styles.value,
    ...(isMobile ? { fontSize: "15px" } : {}),
  };
  const imageStyle = {
    ...styles.resultImage,
    ...(isMobile ? { width: "100%", height: "auto", maxHeight: "220px" } : {}),
  };

  const diasRestantes = calcularDiasRestantes(fechaVencimiento);
  const fechaVencimientoColor =
    fechaVencimiento && diasRestantes !== null && diasRestantes <= 2 ? "#b91c1c" : "#000000";
  const detalleVencimiento =
    fechaVencimiento && diasRestantes !== null && diasRestantes >= 0
      ? ` (Faltan ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"})`
      : "";

  return (
    <>
      <header style={topbarStyle}>
        <span style={topTitleStyle}>Busqueda de usuarios por ID</span>
        <div style={avatarStyle}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}</div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={styles.title}>Consultar usuario</h2>

          <form
            style={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              buscarUsuario();
            }}
          >
            <input
              type="number"
              placeholder="ID del usuario"
              value={id}
              onChange={(e) => setId(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#a31211")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />

            <button type="submit" style={styles.button}>
              Buscar
            </button>
          </form>

          {mensaje && !usuario && (
            <p style={{ ...styles.message, color: mensaje.includes("registrada") ? "#15803d" : "#b91c1c" }}>
              {mensaje}
            </p>
          )}
        </div>
      </main>

      {usuario && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Resultado de busqueda</h3>

            <div style={styles.result}>
              {usuario.foto && (
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <img src={usuario.foto} alt="Foto del usuario" style={imageStyle} />
                </div>
              )}

              <ResultRow label="ID" value={usuario.id} labelStyle={labelStyle} valueStyle={valueStyle} />
              <ResultRow label="Nombre" value={usuario.nombre} labelStyle={labelStyle} valueStyle={valueStyle} />
              <ResultRow label="Apellido" value={usuario.apellido} labelStyle={labelStyle} valueStyle={valueStyle} />
              <ResultRow label="Telefono" value={usuario.telefono} labelStyle={labelStyle} valueStyle={valueStyle} />
              <ResultRow label="Email" value={usuario.email} labelStyle={labelStyle} valueStyle={valueStyle} />
              <ResultRow
                label="Fecha de vencimiento"
                value={`${formatearFecha(fechaVencimiento)}${detalleVencimiento}`}
                color={fechaVencimientoColor}
                labelStyle={labelStyle}
                valueStyle={valueStyle}
              />
              <ResultRow
                label="Estado de membresia"
                value={estadoMembresia}
                labelStyle={labelStyle}
                valueStyle={valueStyle}
              />
            </div>

            {mensaje && (
              <p style={{ ...styles.message, marginTop: "16px", color: mensaje.includes("registrada") ? "#15803d" : "#b91c1c" }}>
                {mensaje}
              </p>
            )}

            <button onClick={onListo} style={styles.modalButton}>
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const ResultRow = ({ label, value, color, labelStyle, valueStyle }) => (
  <div style={styles.resultRow}>
    <span style={labelStyle || styles.label}>{label}</span>
    <span style={{ ...(valueStyle || styles.value), color: color || "#000000" }}>{value}</span>
  </div>
);

const styles = {
  topbar: {
    height: "40px",
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
    margin: 0,
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#f3f4f6",
    padding: "24px",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    padding: "28px",
    borderRadius: "14px",
    boxShadow: "0 -10px 30px rgba(0,0,0,0.25), 0 14px 40px rgba(0,0,0,0.25)",
  },

  title: {
    color: "#000000",
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: "600",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "8px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  input: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#000000",
    outline: "none",
  },

  button: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(to right, #580c0c, #6e0101)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    marginTop: "16px",
    textAlign: "center",
    fontWeight: "500",
  },

  result: {
    marginTop: "28px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "16px",
    boxSizing: "border-box",
  },

  modalCard: {
    width: "100%",
    maxWidth: "560px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
    padding: "22px",
  },

  modalTitle: {
    margin: 0,
    marginBottom: "14px",
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  modalButton: {
    marginTop: "16px",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  resultImage: {
    width: "30%",
    height: "30%",
    objectFit: "cover",
    borderRadius: "10px",
    border: "2px solid #a31211",
    maxHeight: "200px",
  },

  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "6px",
  },

  label: {
    fontSize: "18px",
    color: "#6b7280",
    fontWeight: "500",
  },

  value: {
    fontSize: "21px",
    fontWeight: "600",
    color: "#000000",
    textAlign: "right",
  },
};

export default BuscarUsuario;
