import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear();               
    navigate("/", { replace: true });
  };

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          Mlitas<span style={{ color: "#a31211" }}>GYM</span>
        </div>

        {/* LINKS */}
        <nav style={styles.nav}>
        <div style={styles.sectionLabel}>- USUARIOS</div>
          <Link
            to="/registrar"
            style={{
              ...styles.link,
              ...(isActive("/registrar") && styles.active),
            }}
          >
            Registrar usuarios
          </Link>

          <Link
            to="/buscar-usuario"
            style={{
              ...styles.link,
              ...(isActive("/buscar-usuario") && styles.active),
            }}
          >
            Registrar asistencia
          </Link>

          <Link
            to="/usuarios"
            style={{
              ...styles.link,
              ...(isActive("/usuarios") && styles.active),
            }}
          >
            Lista de usuarios
          </Link>
        </nav>

        {/* 🔴 LOGOUT ABAJO */}
        <div style={styles.logoutContainer}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* AREA DERECHA */}
      <div style={styles.right}>
        {/* TOPBAR */}
        <header style={styles.topbar}>
          <span style={styles.topTitle}>
            Sistema de control de usuarios y control de accesos.
          </span>

          <div style={styles.topRight}>
            <div style={styles.avatar}>H</div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    fontFamily: "Segoe UI, Arial, sans-serif",
    overflow: "hidden",
  },

  /* SIDEBAR */
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
    flex: 1,               // 🔥 Esto empuja el logout hacia abajo
  },

  link: {
    textDecoration: "none",
    color: "#9ca3af",
    padding: "12px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "all 0.2s ease",
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

  active: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
  },

  /* LOGOUT */
  logoutContainer: {
    padding: "16px",
    borderTop: "1px solid #1f2937",
  },

  logoutBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#a31211",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  /* RIGHT */
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f3f4f6",
  },

  /* TOPBAR */
  topbar: {
      height: "64px",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: "1px solid #d1d5db",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
    backdropFilter: "blur(2px)",
  },

  topTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  },

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#a31211",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
  },

  /* CONTENT */
  content: {
    flex: 1,
    padding: "24px",
    backgroundColor: "#f9fafb",
    overflowY: "auto",
  },
};

export default Home;