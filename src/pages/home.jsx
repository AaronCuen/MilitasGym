import { Link } from "react-router-dom";


function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1> Sistema del Gimnasio</h1>
      <p>Bienvenido al sistema de control de usuarios y accesos.</p>

      <ul>
        <Link to="/registrar">Registrar usuario</Link>
        <li>Inscripciones</li>
        <Link to="/buscar-usuario">Validar Acceso</Link>

        <li>Panel para recepcionistas</li>
        <Link to="/usuarios">Ver usuarios registrados</Link>
        
      </ul>
    </div>
  );
}

export default Home;
