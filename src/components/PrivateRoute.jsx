import { Navigate, Outlet } from "react-router-dom";
import { clearSession, isTokenValid, markSessionExpired } from "../utils/storage";

function PrivateRoute() {
  const token = localStorage.getItem("token");

  if (!isTokenValid(token)) {
    markSessionExpired();
    clearSession();
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
