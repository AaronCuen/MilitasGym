import { useCallback, useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  clearActiveSucursalId,
  clearSession,
  getActiveSucursalId,
  getStoredUser,
  isTokenValid,
  markSessionExpired,
  onSucursalChange,
  setActiveSucursalId,
} from "../utils/storage";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalError, setSucursalError] = useState("");
  const [activeSucursalId, setActiveSucursalIdState] = useState(
    () => String(getActiveSucursalId() || "")
  );

  const user = getStoredUser();
  const rol = user?.rol;
  const isAdmin = rol === "admin";

  const isActive = (path) => location.pathname === path;
  const isMobile = viewportWidth < 1200;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onSucursalChange(() => {
      setActiveSucursalIdState(String(getActiveSucursalId() || ""));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadSucursales = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setSucursalError("");
      try {
        const res = await fetch(`${API_BASE_URL}/sucursales`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setSucursalError(data?.message || "No se pudo cargar sucursales");
          return;
        }

        const lista = Array.isArray(data) ? data : [];
        setSucursales(lista);

        if (isAdmin) {
          const stored = getActiveSucursalId();
          if (stored && !lista.some((s) => Number(s.id) === Number(stored))) {
            clearActiveSucursalId();
            setActiveSucursalIdState("");
          }
        } else {
          const fijo = user?.sucursal_id ? Number(user.sucursal_id) : null;
          if (fijo) {
            setActiveSucursalId(fijo);
            setActiveSucursalIdState(String(fijo));
          } else {
            clearActiveSucursalId();
            setActiveSucursalIdState("");
          }
        }
      } catch {
        setSucursalError("No se pudo cargar sucursales");
      }
    };

    loadSucursales();
  }, [isAdmin, user?.sucursal_id]);

  const handleLogout = useCallback(() => {
    clearSession();
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const validateSession = () => {
      const token = localStorage.getItem("token");
      if (!isTokenValid(token)) {
        markSessionExpired();
        clearSession();
        navigate("/", { replace: true });
        return false;
      }
      return true;
    };

    validateSession();

    const intervalId = window.setInterval(validateSession, 30000);
    const onFocus = () => validateSession();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        validateSession();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [navigate]);
  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const sucursalSeleccionada = sucursales.find(
    (s) => String(s.id) === String(activeSucursalId)
  );
  const sucursalLabel = isAdmin
    ? activeSucursalId
      ? sucursalSeleccionada?.nombre || `Sucursal ${activeSucursalId}`
      : "Todas las sucursales"
    : sucursalSeleccionada?.nombre || (user?.sucursal_id ? `Sucursal ${user.sucursal_id}` : "-");

  return (
    <div style={styles.app}>
      {isMobile && sidebarOpen && (
        <div style={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {isMobile && (
        <button
          type="button"
          style={styles.sidebarFloatingToggle}
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {sidebarOpen ? "Cerrar" : "Menu"}
        </button>
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                zIndex: 1100,
                transform: sidebarOpen ? "translateX(0)" : "translateX(calc(-100% + 18px))",
                transition: "transform 0.25s ease",
              }
            : {
                position: "sticky",
                top: 0,
                alignSelf: "flex-start",
                height: "100vh",
                transform: "translateX(0)",
              }),
        }}
      >
        {isMobile && (
          <button
            style={styles.sidebarPeekButton}
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {sidebarOpen ? "<" : ">"}
          </button>
        )}

        <div style={styles.logo}>
          Militas<span style={{ color: "#a31211" }}>GYM</span>
        </div>

        <div style={styles.sucursalBox}>
          <div style={styles.sectionLabel}>Sucursal</div>
          {isAdmin ? (
            <select
              value={activeSucursalId}
              onChange={(e) => {
                const value = e.target.value;
                setActiveSucursalIdState(value);
                if (value) {
                  setActiveSucursalId(Number(value));
                } else {
                  clearActiveSucursalId();
                }
              }}
              style={styles.sucursalSelect}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                  {sucursal.activo ? "" : " (inactiva)"}
                </option>
              ))}
            </select>
          ) : (
            <div style={styles.sucursalValue}>{sucursalLabel}</div>
          )}
          {sucursalError && <div style={styles.sucursalError}>{sucursalError}</div>}
        </div>

        <nav style={styles.nav}>
          <Link to="/home" onClick={handleNavClick} style={{ ...styles.link, ...(isActive("/home") && styles.active) }}>
            Pagina principal
          </Link>

          <div style={styles.sectionLabel}>- USUARIOS</div>

          <Link
            to="/registrar"
            onClick={handleNavClick}
            style={{ ...styles.link, ...(isActive("/registrar") && styles.active) }}
          >
            Registrar usuarios
          </Link>

          <Link
            to="/buscar-usuario"
            onClick={handleNavClick}
            style={{ ...styles.link, ...(isActive("/buscar-usuario") && styles.active) }}
          >
            Registrar asistencia
          </Link>

          <Link
            to="/usuarios"
            onClick={handleNavClick}
            style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}
          >
            Lista de usuarios
          </Link>

          {isAdmin && (
            <Link
              to="/registrar-recepcionista"
              onClick={handleNavClick}
              style={{
                ...styles.link,
                ...(isActive("/registrar-recepcionista") && styles.active),
              }}
            >
              Gestion de recepcionistas
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/sucursales"
              onClick={handleNavClick}
              style={{
                ...styles.link,
                ...(isActive("/sucursales") && styles.active),
              }}
            >
              Gestion de sucursales
            </Link>
          )}
        </nav>

        <div style={styles.logoutContainer}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div
        style={{
          ...styles.right,
          ...(isMobile ? { padding: "12px" } : { padding: "24px" }),
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Segoe UI, Arial, sans-serif",
    overflowX: "hidden",
  },

  sidebar: {
    width: "260px",
    backgroundColor: "#111827",
    color: "#d1d5db",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0,0,0,0.4)",
    overflowY: "hidden",
    overflowX: "visible",
  },

  logo: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: "20px",
    paddingRight: "12px",
    fontSize: "18px",
    fontWeight: "600",
    borderBottom: "1px solid #1f2937",
    color: "#ffffff",
  },
  sucursalBox: {
    padding: "12px 16px 6px",
    borderBottom: "1px solid #1f2937",
  },
  sucursalSelect: {
    width: "100%",
    marginTop: "8px",
    padding: "8px",
    borderRadius: "6px",
    backgroundColor: "#0f172a",
    color: "#e5e7eb",
    border: "1px solid #1f2937",
    fontSize: "13px",
  },
  sucursalValue: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#f9fafb",
    fontWeight: "500",
  },
  sucursalError: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#f87171",
  },

  nav: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },

  sectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: "#94a3b8",
    marginTop: "20px",
    marginBottom: "10px",
    paddingLeft: "10px",
  },

  link: {
    textDecoration: "none",
    color: "#9ca3af",
    padding: "12px 14px",
    borderRadius: "6px",
    fontSize: "14px",
  },

  active: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
  },

  logoutContainer: {
    padding: "16px",
    borderTop: "1px solid #1f2937",
    marginTop: "auto",
    backgroundColor: "#111827",
    position: "sticky",
    bottom: 0,
    zIndex: 1,
  },

  logoutButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#7f1d1d",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  right: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: "24px",
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
  },

  mobileOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1050,
  },

  sidebarPeekButton: {
    position: "absolute",
    top: "50%",
    right: "-14px",
    transform: "translateY(-50%)",
    width: "18px",
    height: "54px",
    borderRadius: "0 8px 8px 0",
    border: "1px solid #1f2937",
    backgroundColor: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1",
    padding: 0,
    zIndex: 1200,
  },

  sidebarFloatingToggle: {
    position: "fixed",
    left: "8px",
    top: "76px",
    zIndex: 1300,
    border: "1px solid #1f2937",
    borderRadius: "8px",
    backgroundColor: "#111827",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 10px",
    cursor: "pointer",
  },
};

export default Layout;
