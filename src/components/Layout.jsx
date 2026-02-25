import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const rol = user?.rol;
  const isAdmin = rol === "admin";

  const isActive = (path) => location.pathname === path;
  const isMobile = viewportWidth < 1024;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.app}>
      {isMobile && sidebarOpen && (
        <div style={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
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

        <nav style={styles.nav}>
          <Link to="/" style={{ ...styles.link, ...(isActive("/") && styles.active) }}>
            Pagina principal
          </Link>

          <div style={styles.sectionLabel}>- USUARIOS</div>

          <Link
            to="/registrar"
            style={{ ...styles.link, ...(isActive("/registrar") && styles.active) }}
          >
            Registrar usuarios
          </Link>

          <Link
            to="/buscar-usuario"
            style={{ ...styles.link, ...(isActive("/buscar-usuario") && styles.active) }}
          >
            Registrar asistencia
          </Link>

          <Link
            to="/usuarios"
            style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}
          >
            Lista de usuarios
          </Link>

          {isAdmin && (
            <Link
              to="/registrar-recepcionista"
              style={{
                ...styles.link,
                ...(isActive("/registrar-recepcionista") && styles.active),
              }}
            >
              Registrar recepcionista
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
    overflow: "hidden",
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
  },
};

export default Layout;
