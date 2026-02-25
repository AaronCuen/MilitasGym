import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PrivateRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;
  }

  let isTokenValid = false;

  try {
    const decoded = jwtDecode(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    isTokenValid = !decoded?.exp || decoded.exp > nowInSeconds;
  } catch {
    isTokenValid = false;
  }

  if (!isTokenValid) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default PrivateRoute;
