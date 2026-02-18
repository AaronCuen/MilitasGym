import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Users from "./pages/Users.jsx";
import RegisterUser from "./pages/RegisterUser.jsx";
import BuscarUsuario from "./pages/BuscarUsuario.jsx";
import Login from "./pages/Login.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import RegistrarRecepcionista from "./pages/RegistrarRecepcionista";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Login />} />

      {/* Rutas privadas */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/registrar" element={<RegisterUser />} />
          <Route path="/buscar-usuario" element={<BuscarUsuario />} />
          <Route path="/registrar-recepcionista" element={<RegistrarRecepcionista />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
