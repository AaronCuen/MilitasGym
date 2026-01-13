import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function RegistrarRecepcionista() {
  const location = useLocation();
  const navigate = useNavigate();

  const rol = localStorage.getItem("rol");
  const isAdmin = rol === "admin";

  useEffect(() => {
    if (rol !== "admin") {
      navigate("/usuarios", { replace: true });
    }
  }, []);

  const isActive = (path) => location.pathname === path;

  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    password: ""
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:4000/recepcionistas", form);
      setMensaje("Recepcionista registrada correctamente");
      setForm({ nombre: "", usuario: "", password: "" });
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar");
    }
  };

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          Militas<span style={{ color: "#a31211" }}>GYM</span>
        </div>

        <nav style={styles.nav}>
          <div style={styles.sectionLabel}>- USUARIOS</div>

          <Link to="/registrar" style={{ ...styles.link, ...(isActive("/registrar") && styles.active) }}>
            Registrar usuarios
          </Link>

          <Link to="/buscar-usuario" style={{ ...styles.link, ...(isActive("/buscar-usuario") && styles.active) }}>
            Registrar asistencia
          </Link>

          <Link to="/usuarios" style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}>
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

        <div style={styles.logoutContainer}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div style={styles.right}>
        <header style={styles.topbar}>
          <span style={styles.topTitle}>Registro de recepcionistas</span>
          <div style={styles.avatar}>H</div>
        </header>

        <main style={styles.content}>
          <div style={styles.card}>
            <h2 style={styles.title}>Registrar recepcionista</h2>

            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                type="text"
                name="usuario"
                placeholder="Usuario"
                value={form.usuario}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <button type="submit" style={styles.button}>
                Registrar recepcionista
              </button>
            </form>

            {mensaje && (
              <p
                style={{
                  ...styles.message,
                  color: mensaje.includes("correctamente") ? "#15803d" : "#b91c1c"
                }}
              >
                {mensaje}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ====================== ESTILOS ====================== */

const styles = {
  app: { display: "flex", width: "100vw", height: "100vh", fontFamily: "Segoe UI, Arial, sans-serif", overflow: "hidden" },
  sidebar: { width: "260px", backgroundColor: "#111827", color: "#d1d5db", display: "flex", flexDirection: "column", boxShadow: "2px 0 10px rgba(0,0,0,0.4)" },
  logo: { height: "64px", display: "flex", alignItems: "center", paddingLeft: "20px", fontSize: "18px", fontWeight: "600", borderBottom: "1px solid #1f2937", color: "#ffffff" },
  nav: { padding: "16px", display: "flex", flexDirection: "column", gap: "6px" },
  link: { textDecoration: "none", color: "#9ca3af", padding: "12px 14px", borderRadius: "6px", fontSize: "14px" },
  active: { backgroundColor: "#1f2937", color: "#ffffff" },
  logoutContainer: { marginTop: "auto", padding: "16px", borderTop: "1px solid #1f2937" },
  logoutButton: { width: "100%", padding: "12px", backgroundColor: "#7f1d1d", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "600", cursor: "pointer" },
  right: { flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f3f4f6" },
  topbar: { height: "64px", backgroundColor: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #d1d5db", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)" },
  topTitle: { fontSize: "16px", fontWeight: "600", color: "#111827" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#a31211", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600" },
  content: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center" },
  card: { width: "100%", maxWidth: "480px", backgroundColor: "#ffffff", padding: "28px", borderRadius: "14px", boxShadow: "0 -10px 30px rgba(0,0,0,0.25), 0 14px 40px rgba(0,0,0,0.25)" },
  title: { marginBottom: "20px", fontSize: "18px", fontWeight: "600", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px", color: "#000" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  input: { width: "100%", padding: "12px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#f9fafb", color: "#000", outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)" },
  button: { padding: "14px", borderRadius: "25px", border: "none", background: "linear-gradient(to right, #580c0c, #6e0101)", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  message: { marginTop: "18px", textAlign: "center", fontWeight: "500" },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: "#94a3b8",
    marginTop: "20px",
    marginBottom: "10px",
    paddingLeft: "10px",
  }
};

export default RegistrarRecepcionista;
