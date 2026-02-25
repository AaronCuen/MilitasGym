import { useEffect, useState } from "react";
import { getStoredUser } from "../utils/storage";

function Home() {
  const user = getStoredUser();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  const topbarStyle = {
    ...styles.topbar,
    ...(isMobile ? { padding: "0 12px", height: "48px" } : {}),
  };
  const topTitleStyle = {
    ...styles.topTitle,
    ...(isMobile ? { fontSize: "14px" } : {}),
  };
  const avatarStyle = {
    ...styles.avatar,
    ...(isMobile ? { width: "30px", height: "30px", fontSize: "13px" } : {}),
  };
  const contentStyle = {
    ...styles.content,
    ...(isMobile ? { padding: "12px" } : isTablet ? { padding: "16px" } : {}),
  };
  const cardStyle = {
    ...styles.welcomeCard,
    ...(isMobile ? { padding: "18px" } : {}),
  };
  const titleStyle = {
    ...styles.welcomeTitle,
    ...(isMobile ? { fontSize: "18px" } : {}),
  };
  const textStyle = {
    ...styles.welcomeText,
    ...(isMobile ? { fontSize: "13px" } : {}),
  };

  return (
    <>
      <header style={topbarStyle}>
        <span style={topTitleStyle}>
          Sistema de control de usuarios y control de accesos.
        </span>

        <div style={styles.topRight}>
          <div style={avatarStyle}>
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
          </div>
        </div>
      </header>

      <main style={contentStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Bienvenido al sistema</h2>
          <p style={textStyle}>
            Desde aqui puedes gestionar usuarios, membresias y controlar accesos.
          </p>
        </div>
      </main>
    </>
  );
}

const styles = {
  topbar: {
    height: "40px",
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
    margin: 0,
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
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
    fontSize: "14px",
  },

  content: {
    padding: "24px",
    backgroundColor: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  welcomeCard: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    maxWidth: "600px",
    width: "100%",
  },

  welcomeTitle: {
    fontSize: "22px",
    marginBottom: "10px",
    color: "#111827",
  },

  welcomeText: {
    fontSize: "14px",
    color: "#4b5563",
  },
};

export default Home;
