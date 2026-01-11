import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function BuscarUsuario() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [id, setId] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const buscarUsuario = async () => {
    if (!id) {
      setMensaje("Ingresa un ID");
      setUsuario(null);
      return;
    }

    try {
      // 1️⃣ Buscar usuario
      const res = await fetch(`http://localhost:4000/usuarios/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setMensaje("Usuario no encontrado");
        setUsuario(null);
        return;
      }

      setUsuario(data);

      // 2️⃣ Buscar inscripción
      const insRes = await fetch(`http://localhost:4000/inscripcion/${id}`);
      const insData = await insRes.json();

      let estado = "Sin membresía";

      // Validar si hay inscripción y fecha_fin
      if (insRes.ok && insData && insData.fecha_fin) {
        const hoy = new Date();
        const fechaFin = new Date(insData.fecha_fin);

        // Determinar estado activo o vencido
        estado = fechaFin >= hoy ? "ACTIVA" : "VENCIDA";
      } else if (insData && insData.message === "Sin membresía") {
        estado = "Sin membresía";
      }

      // 3️⃣ Registrar asistencia solo si está activa
      if (estado === "ACTIVA") {
        const asisRes = await fetch(`http://localhost:4000/asistencia/${id}`, { method: "POST" });
        const asisData = await asisRes.json();

        if (!asisRes.ok) {
          setMensaje(asisData.message || "No se pudo registrar asistencia");
          return;
        }

        setMensaje(`Estado de membresía: ${estado}. ${asisData.message || "Asistencia registrada"}`);
      } else {
        setMensaje(`Estado de membresía: ${estado}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de servidor");
      setUsuario(null);
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
          <Link to="/registrar" style={{ ...styles.link, ...(isActive("/registrar") && styles.active) }}>
            Registrar usuarios
          </Link>

          <Link to="/buscar-usuario" style={{ ...styles.link, ...(isActive("/buscar-usuario") && styles.active) }}>
            Buscar usuario
          </Link>

          <Link to="/usuarios" style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}>
            Usuarios
          </Link>
        </nav>
      </aside>

      {/* AREA DERECHA */}
      <div style={styles.right}>
        <header style={styles.topbar}>
          <span style={styles.topTitle}>Búsqueda de usuarios por ID</span>
          <div style={styles.avatar}>H</div>
        </header>

        <main style={styles.content}>
          <div style={styles.card}>
            <h2 style={styles.title}>Buscar usuario</h2>

            <div style={styles.form}>
              <input
                type="number"
                placeholder="ID del usuario"
                value={id}
                onChange={(e) => setId(e.target.value)}
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#a31211")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />

              <button onClick={buscarUsuario} style={styles.button}>
                Buscar
              </button>
            </div>

            {mensaje && (
              <p style={{ ...styles.message, color: mensaje.includes("registrada") ? "#15803d" : "#b91c1c" }}>
                {mensaje}
              </p>
            )}

            {usuario && (
              <div style={styles.result}>
                <ResultRow label="ID" value={usuario.id} />
                <ResultRow label="Nombre" value={usuario.nombre} />
                <ResultRow label="Apellido" value={usuario.apellido} />
                <ResultRow label="Teléfono" value={usuario.telefono} />
                <ResultRow label="Email" value={usuario.email} />
                <ResultRow
                  label="Estado de membresía"
                  value={
                    mensaje.includes("ACTIVA") ? "ACTIVA ✔️" :
                    mensaje.includes("VENCIDA") ? "VENCIDA ❌" :
                    "SIN MEMBRESÍA"
                  }
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const ResultRow = ({ label, value, color }) => (
  <div style={styles.resultRow}>
    <span style={styles.label}>{label}</span>
    <span style={{ ...styles.value, color: color || "#000000" }}>
      {value}
    </span>
  </div>
);

const styles = {
  app: { display: "flex", width: "100vw", height: "100vh", fontFamily: "Segoe UI, Arial, sans-serif", overflow: "hidden" },
  sidebar: { width: "260px", backgroundColor: "#111827", color: "#d1d5db", display: "flex", flexDirection: "column", boxShadow: "2px 0 10px rgba(0,0,0,0.4)" },
  logo: { height: "64px", display: "flex", alignItems: "center", paddingLeft: "20px", fontSize: "18px", fontWeight: "600", borderBottom: "1px solid #1f2937", color: "#ffffff" },
  nav: { padding: "16px", display: "flex", flexDirection: "column", gap: "6px" },
  link: { textDecoration: "none", color: "#9ca3af", padding: "12px 14px", borderRadius: "6px", fontSize: "14px" },
  active: { backgroundColor: "#1f2937", color: "#ffffff" },
  right: { flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f3f4f6" },
  topbar: { height: "64px", backgroundColor: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #d1d5db", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
  topTitle: { fontSize: "16px", fontWeight: "600", color: "#111827" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#a31211", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600" },
  content: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center" },
  card: { width: "100%", maxWidth: "480px", backgroundColor: "#ffffff", padding: "28px", borderRadius: "14px", boxShadow: "0 14px 40px rgba(0,0,0,0.25)" },
  title: { marginBottom: "20px", fontSize: "18px", fontWeight: "600", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  input: { width: "100%", padding: "12px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#ffffff", color: "#000000", outline: "none" },
  button: { padding: "14px", borderRadius: "25px", border: "none", background: "linear-gradient(to right, #580c0c, #6e0101)", color: "#ffffff", fontWeight: "bold", cursor: "pointer" },
  message: { marginTop: "16px", textAlign: "center", fontWeight: "500" },
  result: { marginTop: "28px", padding: "20px", backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "14px" },
  resultRow: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" },
  label: { fontSize: "13px", color: "#6b7280", fontWeight: "500" },
  value: { fontSize: "14px", fontWeight: "500", color: "#000000" },
};

export default BuscarUsuario;
