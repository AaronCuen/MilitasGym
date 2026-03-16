import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import {
  clearSession,
  getActiveSucursalId,
  getStoredUser,
  markSessionExpired,
  onSucursalChange,
  notifySucursalesUpdated,
} from "../utils/storage";

function RegistrarRecepcionista() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const rol = localStorage.getItem("rol");
  const isAdmin = rol === "admin";

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    password: "",
    sucursal_id: String(getActiveSucursalId() || ""),
  });

  const [recepcionistas, setRecepcionistas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/usuarios", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleUnauthorized = (status) => {
    if (status !== 401 && status !== 403) return false;
    markSessionExpired();
    clearSession();
    navigate("/", { replace: true });
    return true;
  };

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  const cargarSucursales = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sucursales`, {
        headers: authHeaders(),
      });
      const lista = Array.isArray(res.data) ? res.data : [];
      setSucursales(lista);
    } catch (err) {
      if (handleUnauthorized(err.response?.status)) return;
      setMensaje(err.response?.data?.message || "No se pudieron cargar sucursales");
    }
  };

  const cargarRecepcionistas = async () => {
    try {
      setLoading(true);
      const activeSucursalId = getActiveSucursalId();
      const res = await axios.get(`${API_BASE_URL}/recepcionistas`, {
        headers: authHeaders(),
        params: activeSucursalId ? { sucursal_id: activeSucursalId } : undefined,
      });
      setRecepcionistas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (handleUnauthorized(err.response?.status)) return;
      setMensaje(err.response?.data?.message || "No se pudieron cargar recepcionistas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
    cargarRecepcionistas();
  }, []);

  useEffect(() => {
    const unsubscribe = onSucursalChange(() => {
      setForm((prev) => ({
        ...prev,
        sucursal_id: String(getActiveSucursalId() || ""),
      }));
      cargarRecepcionistas();
    });
    return unsubscribe;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nombre") {
      setForm({ ...form, nombre: value.slice(0, 60) });
      return;
    }

    if (name === "usuario") {
      setForm({ ...form, usuario: value.slice(0, 30) });
      return;
    }

    if (name === "password") {
      setForm({ ...form, password: value.slice(0, 16) });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      usuario: "",
      password: "",
      sucursal_id: String(getActiveSucursalId() || ""),
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const usuario = form.usuario.trim();
    const password = form.password;
    const sucursalId = form.sucursal_id.trim();

    if (!nombre) {
      setMensaje("El nombre es obligatorio");
      return;
    }

    if (!usuario) {
      setMensaje("El usuario es obligatorio");
      return;
    }

    if (!sucursalId) {
      setMensaje("La sucursal es obligatoria");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      if (!editingId) {
        if (password.length < 6) {
          setMensaje("La contrasena debe tener al menos 6 caracteres");
          return;
        }

        await axios.post(
          `${API_BASE_URL}/recepcionistas`,
          {
            nombre,
            usuario,
            password,
            sucursal_id: Number(sucursalId),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMensaje("Recepcionista registrada correctamente");
      } else {
        const payload = {
          nombre,
          usuario,
          sucursal_id: Number(sucursalId),
        };
        if (password) {
          if (password.length < 6) {
            setMensaje("La contrasena debe tener al menos 6 caracteres");
            return;
          }
          payload.password = password;
        }

        await axios.put(`${API_BASE_URL}/recepcionistas/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMensaje("Recepcionista actualizada correctamente");
      }

      resetForm();
      await cargarRecepcionistas();
      notifySucursalesUpdated();
    } catch (err) {
      if (handleUnauthorized(err.response?.status)) return;
      setMensaje(err.response?.data?.message || "Error al registrar");
    }
  };

  const startEdit = (recep) => {
    setEditingId(recep.id);
    setForm({
      nombre: recep.nombre || "",
      usuario: recep.usuario || "",
      password: "",
      sucursal_id: String(recep.sucursal_id || ""),
    });
    setMensaje("");
  };

  const eliminarRecepcionista = async (id) => {
    if (!window.confirm("Seguro que deseas eliminar este recepcionista?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/recepcionistas/${id}`, {
        headers: authHeaders(),
      });
      setRecepcionistas((prev) => prev.filter((r) => r.id !== id));
      notifySucursalesUpdated();
    } catch (err) {
      if (handleUnauthorized(err.response?.status)) return;
      setMensaje(err.response?.data?.message || "Error al eliminar");
    }
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

  return (
    <>
      <header style={topbarStyle}>
        <span style={topTitleStyle}>Gestion de recepcionistas</span>
        <div style={avatarStyle}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}</div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={styles.title}>{editingId ? "Editar recepcionista" : "Registrar recepcionista"}</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={handleChange}
              required
              maxLength={60}
              style={inputStyle}
            />
            <input
              type="text"
              name="usuario"
              placeholder="Usuario"
              value={form.usuario}
              onChange={handleChange}
              required
              maxLength={30}
              style={inputStyle}
            />
            <select
              name="sucursal_id"
              value={form.sucursal_id}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">Selecciona sucursal</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                  {sucursal.activo ? "" : " (inactiva)"}
                </option>
              ))}
            </select>

            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={editingId ? "Contrasena (opcional)" : "Contrasena"}
                value={form.password}
                onChange={handleChange}
                required={!editingId}
                minLength={editingId ? undefined : 6}
                maxLength={16}
                style={{ ...inputStyle, paddingRight: "58px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.passwordToggle}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            <div style={styles.actionsRow}>
              <button type="submit" style={styles.button}>
                {editingId ? "Guardar cambios" : "Registrar recepcionista"}
              </button>
              {editingId && (
                <button type="button" style={styles.secondaryButton} onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {mensaje && (
            <p
              style={{
                ...styles.message,
                color: mensaje.includes("correctamente") ? "#15803d" : "#b91c1c",
              }}
            >
              {mensaje}
            </p>
          )}
        </div>

        <div style={styles.listCard}>
          <h3 style={styles.subtitle}>Recepcionistas registradas</h3>
          {loading ? (
            <p>Cargando recepcionistas...</p>
          ) : recepcionistas.length === 0 ? (
            <p>No hay recepcionistas registradas.</p>
          ) : (
            <div style={styles.table}>
              {recepcionistas.map((recep) => (
                <div key={recep.id} style={styles.row}>
                  <div style={styles.rowMain}>
                    <strong>{recep.nombre}</strong>
                    <span style={styles.rowMeta}>
                      Usuario: {recep.usuario} - {recep.sucursal_nombre || `Sucursal ${recep.sucursal_id}`}
                    </span>
                  </div>
                  <div style={styles.rowActions}>
                    <button type="button" style={styles.linkButton} onClick={() => startEdit(recep)}>
                      Editar
                    </button>
                    <button type="button" style={styles.linkButton} onClick={() => eliminarRecepcionista(recep.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

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
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
  title: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "20px",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "18px",
    color: "#0f172a",
  },
  form: {
    display: "grid",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordToggle: {
    position: "absolute",
    right: "10px",
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
  },
  actionsRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    backgroundColor: "#a31211",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
  secondaryButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    backgroundColor: "#e5e7eb",
    color: "#111827",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
  message: {
    marginTop: "12px",
    fontSize: "14px",
  },
  table: {
    display: "grid",
    gap: "12px",
  },
  row: {
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  rowMain: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  rowMeta: {
    fontSize: "13px",
    color: "#6b7280",
  },
  rowActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#a31211",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default RegistrarRecepcionista;
