import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getStoredUser } from "../utils/storage";

function RegistrarRecepcionista() {
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const rol = localStorage.getItem("rol");

  useEffect(() => {
    if (rol !== "admin") {
      navigate("/usuarios", { replace: true });
    }
  }, [navigate, rol]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    password: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const user = getStoredUser();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const usuario = form.usuario.trim();
    const password = form.password;

    if (!nombre) {
      setMensaje("El nombre es obligatorio");
      return;
    }

    if (!usuario) {
      setMensaje("El usuario es obligatorio");
      return;
    }

    if (password.length < 6) {
      setMensaje("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_BASE_URL}/recepcionistas`,
        {
          nombre,
          usuario,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMensaje("Recepcionista registrada correctamente");
      setForm({ nombre: "", usuario: "", password: "" });
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar");
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
        <span style={topTitleStyle}>Registro de recepcionistas</span>
        <div style={avatarStyle}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}</div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={styles.title}>Registrar recepcionista</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input type="text" name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} required maxLength={60} style={inputStyle} />
            <input type="text" name="usuario" placeholder="Usuario" value={form.usuario} onChange={handleChange} required maxLength={30} style={inputStyle} />

            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contrasena"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
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

            <button type="submit" style={styles.button}>
              Registrar recepcionista
            </button>
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
