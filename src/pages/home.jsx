import React from "react";

function Home() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      <header style={styles.topbar}>
        <span style={styles.topTitle}>
          Sistema de control de usuarios y control de accesos.
        </span>

        <div style={styles.topRight}>
          <div style={styles.avatar}>
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}
          </div>
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>Bienvenido al sistema</h2>
          <p style={styles.welcomeText}>
            Desde aquí puedes gestionar usuarios, membresías y controlar accesos.
          </p>
        </div>
      </main>
    </>
  );
}

const styles = {
  /* TOPBAR */
  topbar: {
  height: "40px",
  backgroundColor: "#e5e7eb",
  display: "flex",
  alignItems: "center",          // 🔥 centra verticalmente
  justifyContent: "space-between",
  padding: "0 24px",             // solo horizontal
  borderBottom: "1px solid #d1d5db",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
  backdropFilter: "blur(2px)",
  },

  topTitle: {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  margin: 0,                     // 🔥 elimina margen default
  lineHeight: "1",               // 🔥 evita que estire altura
  display: "flex",
  alignItems: "center",
  },

  topRight: {
  display: "flex",
  alignItems: "center",          // 🔥 centra verticalmente
  gap: "16px",
  },

  avatar: {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  backgroundColor: "#a31211",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",          // 🔥 centra letra vertical
  justifyContent: "center",
  fontWeight: "600",
  fontSize: "14px",
  },

  /* CONTENT */
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
