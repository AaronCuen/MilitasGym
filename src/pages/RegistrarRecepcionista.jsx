import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RegistrarRecepcionista() {
  const navigate = useNavigate();

  useEffect(() => {
    const rol = localStorage.getItem("rol");

    if (!rol) return;

    if (rol !== "admin") {
      navigate("/usuarios", { replace: true });
    }
  }, []);

  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    password: ""
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:4000/recepcionistas", form);
      alert("Recepcionista registrada correctamente");
      setForm({ nombre: "", usuario: "", password: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", background: "#fff", padding: 20, borderRadius: 10 }}>
      <h2>Registrar Recepcionista</h2>

      <form onSubmit={handleSubmit}>
        <input name="nombre" placeholder="Nombre" onChange={handleChange} value={form.nombre} />
        <input name="usuario" placeholder="Usuario" onChange={handleChange} value={form.usuario} />
        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} value={form.password} />

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}
