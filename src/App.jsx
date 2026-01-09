import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Users from "./pages/Users.jsx";
import RegisterUser from "./pages/RegisterUser";
import BuscarUsuario from "./pages/BuscarUsuario";



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/usuarios" element={<Users />} />
      <Route path="/registrar" element={<RegisterUser />} />
      <Route path="/buscar-usuario" element={<BuscarUsuario />} />


    </Routes>
  );
}

export default App;
