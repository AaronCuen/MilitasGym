import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function RegistrarRecepcionista() {
  const navigate = useNavigate();

  const rol = localStorage.getItem("rol");

  useEffect(() => {
    if (rol !== "admin") {
      navigate("/usuarios", { replace: true });
    }
  }, []);

  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    password: "",
  });

  const [mensaje, setMensaje] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:4000/recepcionistas",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMensaje("Recepcionista registrada correctamente");
      setForm({ nombre: "", usuario: "", password: "" });

    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar");
    }
  };


  return (
    <>
      <header style={styles.topbar}>
        <span style={styles.topTitle}>Registro de recepcionistas</span>
        <div style={styles.avatar}>
          {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
        </div>
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
                color: mensaje.includes("correctamente")
                  ? "#15803d"
                  : "#b91c1c",
              }}
            >
              {mensaje}
            </p>
          )}
        </div>
      </main>
    </>
  );
}

/* ====================== ESTILOS ====================== */

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
    display: "flex",
    padding: "32px",
    marginTop: "32px", // 👈 ESTA ES LA CLAVE
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    padding: "28px",
    borderRadius: "14px",
    boxShadow:
      "0 -10px 30px rgba(0,0,0,0.25), 0 14px 40px rgba(0,0,0,0.25)",
  },

  title: {
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: "600",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "8px",
    color: "#000",
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
    backgroundColor: "#f9fafb",
    color: "#000",
    outline: "none",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
  },

  button: {
    padding: "14px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(to right, #580c0c, #6e0101)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    marginTop: "18px",
    textAlign: "center",
    fontWeight: "500",
  },
};

export default RegistrarRecepcionista;
