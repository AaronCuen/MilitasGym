import { useState } from "react";
import { useNavigate } from "react-router-dom";

function BuscarUsuario() {
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  const buscarUsuario = async () => {
    if (!id) {
      setMensaje("Ingresa un ID");
      setUsuario(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      // 🔍 1. Buscar usuario
      const res = await fetch(`http://p008kcwgw0084c4wkkwck088.31.97.209.55.sslip.io/usuarios/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje("Usuario no encontrado");
        setUsuario(null);
        return;
      }

      setUsuario(data);

      // 📄 2. Obtener inscripción
      const insRes = await fetch(`http://p008kcwgw0084c4wkkwck088.31.97.209.55.sslip.io/inscripcion/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const insData = await insRes.json();

      let estado = "Sin membresía";

      if (insRes.ok && insData?.fecha_fin) {
        const hoy = new Date();
        const fechaFin = new Date(insData.fecha_fin);
        estado = fechaFin >= hoy ? "ACTIVA" : "VENCIDA";
      }

      // ✅ 3. Registrar asistencia SOLO si está activa
      if (estado === "ACTIVA") {
        const asisRes = await fetch(
          `http://p008kcwgw0084c4wkkwck088.31.97.209.55.sslip.io/asistencia/${id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }
        );

        const asisData = await asisRes.json();

        if (!asisRes.ok) {
          setMensaje(asisData.message || "No se pudo registrar asistencia");
          return;
        }

        setMensaje(
          `Estado de membresía: ${estado}. ${asisData.message || "Asistencia registrada"}`
        );
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
    <>
      <header style={styles.topbar}>
        <span style={styles.topTitle}>Búsqueda de usuarios por ID</span>
                <div style={styles.avatar}>
          {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.title}>Consultar usuario</h2>

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
            <p
              style={{
                ...styles.message,
                color: mensaje.includes("registrada") ? "#15803d" : "#b91c1c"
              }}
            >
              {mensaje}
            </p>
          )}

          {usuario && (
            <div style={styles.result}>
              {usuario.foto && (
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <img
                    src={usuario.foto}
                    alt="Foto del usuario"
                    style={{
                      width: "30%",
                      height: "30%",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "2px solid #a31211",
                      maxHeight: "200px"
                    }}
                  />
                </div>
              )}

              <ResultRow label="ID" value={usuario.id} />
              <ResultRow label="Nombre" value={usuario.nombre} />
              <ResultRow label="Apellido" value={usuario.apellido} />
              <ResultRow label="Teléfono" value={usuario.telefono} />
              <ResultRow label="Email" value={usuario.email} />
              <ResultRow
                label="Estado de membresía"
                value={
                  mensaje.includes("ACTIVA")
                    ? "ACTIVA"
                    : mensaje.includes("VENCIDA")
                    ? "VENCIDA"
                    : "SIN MEMBRESÍA"
                }
              />
            </div>
          )}
        </div>
      </main>
    </>
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
    padding: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "#f3f4f6",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    padding: "28px",
    borderRadius: "14px",
    boxShadow: "0 -10px 30px rgba(0,0,0,0.25), 0 14px 40px rgba(0,0,0,0.25)"
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

  resultRow: {
    display: "flex",
    justifyContent: "space-between",
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
  },
};



export default BuscarUsuario;
