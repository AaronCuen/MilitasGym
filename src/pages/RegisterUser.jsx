import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function RegisterUser() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const [imagen, setImagen] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "", 
    membresia_id: "",
    fecha_inicio: "",
    fecha_fin: ""
  });

  const [mensaje, setMensaje] = useState("");

  // 🔹 Detecta si es manual (ID 4 = Otro)
  const esManual = form.membresia_id === "4";

  const subirImagen = async () => {
    if (!imagen) return null;

    const formData = new FormData();
    formData.append("file", imagen);
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, telefono: soloNumeros });
      return;
    }

    if (name === "nombre" || name === "apellido") {
      const soloLetras = value
        .replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, "")
        .slice(0, 40);
      setForm({ ...form, [name]: soloLetras });
      return;
    }

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.membresia_id) {
      setMensaje("Selecciona una membresía");
      return;
    }

    // 🔹 Validación solo si es manual
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

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMensaje("Sesión expirada");
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
        foto: fotoUrl
      };

      // 🔹 Si NO es manual, eliminamos fechas
      if (!esManual) {
        delete bodyData.fecha_inicio;
        delete bodyData.fecha_fin;
      }

      const res = await fetch(
        "http://p008kcwgw0084c4wkkwck088.31.97.209.55.sslip.io/registrar_usuario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.message || "Error al registrar");
        return;
      }

      setMensaje(
        `Usuario registrado correctamente. ID asignado: ${data.usuario_id}`
      );

      setForm({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        fecha_nacimiento: "", 
        membresia_id: "",
        fecha_inicio: "",
        fecha_fin: ""
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

  return (
    <>
      <header style={styles.topbar}>
        <span style={styles.topTitle}>Registro de nuevos usuarios.</span>
        <div style={styles.avatar}>
          {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.title}>Registrar usuario</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />

            <label>Fecha de nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              style={styles.input}
            />

            <select
              name="membresia_id"
              value={form.membresia_id}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Selecciona una membresía</option>
              <option value="1">Día</option>
              <option value="2">Semana</option>
              <option value="3">Mes</option>
              <option value="4">Otro</option>
            </select>

            {/* 🔹 Campos manuales solo si selecciona "Otro" */}
            {esManual && (
              <>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={form.fecha_inicio}
                  onChange={handleChange}
                  style={styles.input}
                />

                <input
                  type="date"
                  name="fecha_fin"
                  value={form.fecha_fin}
                  onChange={handleChange}
                  style={styles.input}
                />
              </>
            )}

            {imagen && (
              <img
                src={URL.createObjectURL(imagen)}
                alt="Preview"
                style={styles.preview}
              />
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={styles.photoButton}
            >
              Seleccionar foto
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setImagen(e.target.files[0])}
              style={{ display: "none" }}
            />

            <button type="submit" style={styles.button}>
              Registrar
            </button>
          </form>

          {mensaje && (
            <p
              style={{
                ...styles.message,
                color: mensaje.includes("correctamente")
                  ? "#15803d"
                  : "#b91c1c"
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
    fontWeight: "600"
  },

  content: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#f3f4f6"
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
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: "600",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "8px",
    color: "#000"
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
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)"
  },

  preview: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid #a31211",
    alignSelf: "center"
  },

  button: {
    padding: "14px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(to right, #580c0c, #6e0101)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  photoButton: {
    padding: "14px",
    borderRadius: "25px",
    border: "none",
    background: "#1f2937",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  message: {
    marginTop: "18px",
    textAlign: "center",
    fontWeight: "500"
  }
};

export default RegisterUser;

