import { useState } from "react";

function BuscarUsuario() {
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
      const res = await fetch(`http://localhost:4000/usuarios/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setMensaje("Usuario no encontrado");
        setUsuario(null);
        return;
      }

      setUsuario(data);
      setMensaje("");

    } catch (error) {
      console.error(error);
      setMensaje("Error de servidor");
      setUsuario(null);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Buscar usuario por ID</h2>

      <input
        type="number"
        placeholder="ID del usuario"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />

      <button onClick={buscarUsuario}>
        Buscar
      </button>

      {mensaje && <p>{mensaje}</p>}

      {usuario && (
        <div style={{ marginTop: 20 }}>
          <p>ID: {usuario.id}</p>
          <p>Nombre: {usuario.nombre}</p>
          <p>Apellido: {usuario.apellido}</p>
          <p>Teléfono: {usuario.telefono}</p>
          <p>Email: {usuario.email}</p>
          <p>Estado: {usuario.estado}</p>
        </div>
      )}
    </div>
  );
}

export default BuscarUsuario;
