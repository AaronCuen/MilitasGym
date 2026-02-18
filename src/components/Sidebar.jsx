import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
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
    <aside style={styles.sidebar}>
      
      {/* LOGO */}
      <div style={styles.logo}>
        Militas<span style={{ color: "#a31211" }}>GYM</span>
      </div>

      <div style={styles.divider}></div>

      {/* NAV */}
      <nav style={styles.nav}>
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

      {/* LOGOUT */}
      <div style={styles.logoutContainer}>
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor = "#991b1b")
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor = "#b91c1c")
          }
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

const styles = {
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
    color: "#ffffff",
  },

  divider: {
    height: "1px",
    background:
      "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
    margin: "10px 0 20px 0",
  },

  nav: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  link: {
    textDecoration: "none",
    color: "#9ca3af",
    padding: "12px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "0.2s ease",
  },

  active: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
  },

  logoutContainer: {
    marginTop: "auto",
    padding: "16px",
    borderTop: "1px solid #1f2937",
  },

  logoutButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#b91c1c",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.2s ease",
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
};

export default Sidebar;
