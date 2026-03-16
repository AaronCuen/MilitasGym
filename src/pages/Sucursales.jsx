import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import {
  getStoredUser,
  markSessionExpired,
  clearSession,
  notifySucursalesUpdated,
} from "../utils/storage";

function Sucursales() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.rol === "admin";
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    activo: true,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/home", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return { Authorization: `Bearer ${token}` };
  };

  const handleUnauthorized = (status) => {
    if (status !== 401 && status !== 403) return false;
    markSessionExpired();
    clearSession();
    navigate("/", { replace: true });
    return true;
  };

  const cargarSucursales = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/sucursales`, {
        headers: authHeaders(),
      });
      setSucursales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const status = err.response?.status;
      if (handleUnauthorized(status)) return;
      setMensaje(err.response?.data?.message || "No se pudieron cargar sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const resetForm = () => {
    setForm({ nombre: "", direccion: "", telefono: "", activo: true });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === "telefono") {
      setForm((prev) => ({ ...prev, telefono: value.replace(/[^\d+()\-\s]/g, "").slice(0, 30) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    const nombre = form.nombre.trim();
    if (!nombre) {
      setMensaje("El nombre es obligatorio");
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/sucursales/${editingId}`,
          {
            nombre,
            direccion: form.direccion.trim(),
            telefono: form.telefono.trim(),
            activo: form.activo,
          },
          { headers: authHeaders() }
        );
        setMensaje("Sucursal actualizada correctamente");
      } else {
        await axios.post(
          `${API_BASE_URL}/sucursales`,
          {
            nombre,
            direccion: form.direccion.trim(),
            telefono: form.telefono.trim(),
            activo: form.activo ? 1 : 0,
          },
          { headers: authHeaders() }
        );
        setMensaje("Sucursal creada correctamente");
      }

      resetForm();
      await cargarSucursales();
      notifySucursalesUpdated();
    } catch (err) {
      const status = err.response?.status;
      if (handleUnauthorized(status)) return;
      setMensaje(err.response?.data?.message || "No se pudo guardar la sucursal");
    }
  };

  const handleEdit = (sucursal) => {
    setEditingId(sucursal.id);
    setForm({
      nombre: sucursal.nombre || "",
      direccion: sucursal.direccion || "",
      telefono: sucursal.telefono || "",
      activo: Boolean(sucursal.activo),
    });
  };

  const toggleActivo = async (sucursal) => {
    try {
      await axios.put(
        `${API_BASE_URL}/sucursales/${sucursal.id}`,
        { activo: sucursal.activo ? 0 : 1 },
        { headers: authHeaders() }
      );
      await cargarSucursales();
      notifySucursalesUpdated();
    } catch (err) {
      const status = err.response?.status;
      if (handleUnauthorized(status)) return;
      setMensaje(err.response?.data?.message || "No se pudo actualizar la sucursal");
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
        <span style={topTitleStyle}>Gestion de sucursales</span>
        <div style={avatarStyle}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}</div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={styles.title}>{editingId ? "Editar sucursal" : "Nueva sucursal"}</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre de sucursal"
              value={form.nombre}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <input
              type="text"
              name="direccion"
              placeholder="Direccion"
              value={form.direccion}
              onChange={handleChange}
              style={inputStyle}
            />
            <input
              type="text"
              name="telefono"
              placeholder="Telefono"
              value={form.telefono}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
              />
              <span>Activa</span>
            </label>

            <div style={styles.actionsRow}>
              <button type="submit" style={styles.button}>
                {editingId ? "Guardar cambios" : "Crear sucursal"}
              </button>
              {editingId && (
                <button type="button" style={styles.secondaryButton} onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {mensaje && (
            <p style={{ ...styles.message, color: mensaje.includes("correctamente") ? "#15803d" : "#b91c1c" }}>
              {mensaje}
            </p>
          )}
        </div>

        <div style={styles.listCard}>
          <h3 style={styles.subtitle}>Sucursales registradas</h3>
          {loading ? (
            <p>Cargando sucursales...</p>
          ) : sucursales.length === 0 ? (
            <p>No hay sucursales registradas.</p>
          ) : (
            <div style={styles.table}>
              {sucursales.map((sucursal) => (
                <div key={sucursal.id} style={styles.row}>
                  <div style={styles.rowMain}>
                    <strong>{sucursal.nombre}</strong>
                    <span style={styles.rowMeta}>
                      {sucursal.direccion || "-"} - {sucursal.telefono || "-"}
                    </span>
                  </div>
                  <div style={styles.rowActions}>
                    <span style={{ ...styles.badge, ...(sucursal.activo ? styles.badgeActive : styles.badgeInactive) }}>
                      {sucursal.activo ? "Activa" : "Inactiva"}
                    </span>
                    <button type="button" style={styles.linkButton} onClick={() => handleEdit(sucursal)}>
                      Editar
                    </button>
                    <button type="button" style={styles.linkButton} onClick={() => toggleActivo(sucursal)}>
                      {sucursal.activo ? "Desactivar" : "Activar"}
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
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#1f2937",
    fontSize: "14px",
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
  badge: {
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeActive: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeInactive: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
};

export default Sucursales;
