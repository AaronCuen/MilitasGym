import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PrivateRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;
  }

  try {
    jwtDecode(token); // valida estructura y expiración
    return <Outlet />;
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/" />;
  }
}

export default PrivateRoute;
