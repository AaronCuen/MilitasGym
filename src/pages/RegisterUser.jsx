import { useState } from "react";

function RegisterUser() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: ""
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/registrar_usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const _ = await res.json();

      if (!res.ok) {
        setMensaje("Error al registrar");
        return;
      }

      setMensaje("Usuario registrado correctamente");

      // limpiar
      setForm({
        nombre: "",
        apellido: "",
        telefono: "",
        email: ""
      });

    } catch (error) {
      console.error(error);
      setMensaje("Error de servidor");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Registrar usuario</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="apellido"
          placeholder="Apellido"
          value={form.apellido}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={form.email}
          onChange={handleChange}
        />

        <button type="submit">
          Registrar
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default RegisterUser;
