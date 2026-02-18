import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const rol = user?.rol;
  const isAdmin = rol === "admin";

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          Militas<span style={{ color: "#a31211" }}>GYM</span>
        </div>

        <nav style={styles.nav}>

            <Link
            to="/" style={{ ...styles.link, ...(isActive("/") && styles.active) }}>
            Página principal
            </Link>

          <div style={styles.sectionLabel}>- USUARIOS</div>

          <Link to="/registrar" style={{ ...styles.link, ...(isActive("/registrar") && styles.active) }}>
            Registrar usuarios
          </Link>

          <Link to="/buscar-usuario" style={{ ...styles.link, ...(isActive("/buscar-usuario") && styles.active) }}>
            Registrar asistencia
          </Link>

          <Link to="/usuarios" style={{ ...styles.link, ...(isActive("/usuarios") && styles.active) }}>
            Lista de usuarios
          </Link>

          {isAdmin && (
            <Link
              to="/registrar-recepcionista"
              style={{ ...styles.link, ...(isActive("/registrar-recepcionista") && styles.active) }}
            >
              Registrar recepcionista
            </Link>
          )}
        </nav>

        <div style={styles.logoutContainer}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div style={styles.right}>
        {/* 🔥 AQUÍ SE RENDERIZAN LAS PÁGINAS */}
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
  },

  sidebar: {
    width: "260px",
    backgroundColor: "#111827",
    color: "#d1d5db",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0,0,0,0.4)",
  },

  logo: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    paddingLeft: "20px",
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
    padding: "40px",
    overflowY: "auto",
  },
};



export default Layout;
