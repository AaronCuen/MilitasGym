import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getStoredUser } from "../utils/storage";

function RegisterUser() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = getStoredUser();
  const [imagen, setImagen] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    membresia_id: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [mensaje, setMensaje] = useState("");

  const esManual = form.membresia_id === "4";
  const fechaHoyISO = () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (esManual && !form.fecha_fin) {
      setForm((prev) => ({ ...prev, fecha_fin: fechaHoyISO() }));
    }
  }, [esManual, form.fecha_fin]);

  const previewImagen = useMemo(() => {
    if (!imagen) return "";
    return URL.createObjectURL(imagen);
  }, [imagen]);

  useEffect(() => {
    return () => {
      if (previewImagen) {
        URL.revokeObjectURL(previewImagen);
      }
    };
  }, [previewImagen]);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  const subirImagen = async () => {
    if (!imagen) return null;

    const formData = new FormData();
    formData.append("file", imagen);
    formData.append("upload_preset", "ml_default");

    const res = await fetch("https://api.cloudinary.com/v1_1/dqrdrnznk/image/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.secure_url;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, telefono: soloNumeros });
      return;
    }

    if (name === "nombre" || name === "apellido") {
      const soloLetras = value
        .replace(/[^a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00ed\u00f3\u00fa\u00d1\u00f1\s]/g, "")
        .slice(0, 40);
      setForm({ ...form, [name]: soloLetras });
      return;
    }

    if (name === "email") {
      const emailRecortado = value.slice(0, 40);
      setForm({ ...form, email: emailRecortado });
      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.membresia_id) {
      setMensaje("Selecciona una membresia");
      return;
    }

    if (esManual) {
      if (!form.fecha_inicio || !form.fecha_fin) {
        setMensaje("Debes seleccionar ambas fechas");
        return;
      }

      if (form.fecha_fin <= form.fecha_inicio) {
        setMensaje("La fecha de vencimiento debe ser mayor a la fecha de inicio");
        return;
      }
    }

    if (form.telefono && !/^\d{1,10}$/.test(form.telefono)) {
      setMensaje("El telefono solo debe contener numeros y maximo 10 digitos");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMensaje("El correo no tiene un formato valido");
      return;
    }

    if (form.fecha_nacimiento) {
      const hoy = new Date();
      const fechaNacimiento = new Date(`${form.fecha_nacimiento}T00:00:00`);
      const fechaMinima = new Date(
        hoy.getFullYear() - 100,
        hoy.getMonth(),
        hoy.getDate()
      );

      if (fechaNacimiento > hoy) {
        setMensaje("La fecha de nacimiento no puede ser futura");
        return;
      }

      if (fechaNacimiento < fechaMinima) {
        setMensaje("La fecha de nacimiento no puede superar los 100 anos");
        return;
      }
    }

    if (!form.fecha_nacimiento || !imagen) {
      const faltantes = [];
      if (!form.fecha_nacimiento) faltantes.push("fecha de nacimiento");
      if (!imagen) faltantes.push("foto");
      alert(`Aviso: no se agrego ${faltantes.join(" y ")}.`);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMensaje("Sesion expirada");
        navigate("/");
        return;
      }

      let fotoUrl = null;
      if (imagen) {
        fotoUrl = await subirImagen();
      }

      const bodyData = {
        ...form,
        membresia_id: Number(form.membresia_id),
        foto: fotoUrl,
      };

      if (!esManual) {
        delete bodyData.fecha_inicio;
        delete bodyData.fecha_fin;
      }

      const res = await fetch(`${API_BASE_URL}/registrar_usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.message || "Error al registrar");
        return;
      }

      setMensaje(`Usuario registrado correctamente. ID asignado: ${data.usuario_id}`);

      setForm({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        fecha_nacimiento: "",
        membresia_id: "",
        fecha_inicio: "",
        fecha_fin: "",
      });

      setImagen(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de servidor");
    }
  };

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
        <span style={topTitleStyle}>Registro de nuevos usuarios.</span>
        <div style={avatarStyle}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}</div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={styles.title}>Registrar usuario</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required style={inputStyle} />
            <input type="text" name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required style={inputStyle} />
            <input type="tel" name="telefono" placeholder="Telefono" value={form.telefono} onChange={handleChange} maxLength={10} style={inputStyle} />
            <input type="email" name="email" placeholder="Correo" value={form.email} onChange={handleChange} maxLength={40} style={inputStyle} />

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Fecha de nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} style={inputStyle} />
            </div>

            <select name="membresia_id" value={form.membresia_id} onChange={handleChange} style={inputStyle}>
              <option value="">Selecciona una membresia</option>
              <option value="1">Dia</option>
              <option value="2">Semana</option>
              <option value="3">Mes</option>
              <option value="4">Otro</option>
            </select>

            {esManual && (
              <>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Fecha de inicio</label>
                  <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} style={inputStyle} />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Fecha de vencimiento</label>
                  <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} style={inputStyle} />
                </div>
              </>
            )}

            {previewImagen && <img src={previewImagen} alt="Preview" style={styles.preview} />}

            <button type="button" onClick={() => fileInputRef.current.click()} style={styles.photoButton}>
              Seleccionar foto
            </button>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => setImagen(e.target.files[0])} style={{ display: "none" }} />

            <button type="submit" style={styles.button}>
              Registrar
            </button>
          </form>

          {mensaje && (
            <p style={{ ...styles.message, color: mensaje.includes("correctamente") ? "#15803d" : "#b91c1c" }}>
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

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
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

  form: { display: "flex", flexDirection: "column", gap: "18px" },

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

  preview: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid #a31211",
    alignSelf: "center",
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

  photoButton: {
    padding: "14px",
    borderRadius: "25px",
    border: "none",
    background: "#1f2937",
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

export default RegisterUser;
