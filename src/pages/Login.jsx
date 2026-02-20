import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gymImage from "../assets/Background.png";
import blurredback from "../assets/blurredbackground.png";
import logo from "../assets/Logo.png";


function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Si ya hay sesión, manda directo al home
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "El usuario es obligatorio";
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (password.length < 6) {
      newErrors.password = "Debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setServerError("");

  if (!validate()) return;

  try {
    setLoading(true);

    const res = await fetch("http://p008kcwgw0084c4wkkwck088.31.97.209.55.sslip.io/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario: username,
        password: password,
      }),
    });

    const data = await res.json();
    console.log("RESPUESTA DEL BACKEND:", data);

    if (!res.ok) {
      setServerError(data.message || "Error al iniciar sesión");
      return;
    }

    // 🔐 Guardar JWT real
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("rol", data.user.rol);
    navigate("/home", { replace: true });

  } catch (error) {
    setServerError("No se pudo conectar con el servidor");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.imageSection}></div>

        <div style={styles.formSection}>
          <div style={styles.formContainer}>

            <img src={logo} alt="MG Logo" style={styles.logo} />
            <h2 style={styles.title}>¡Hola! Estás de vuelta.</h2>

            <h3 style={styles.Subttile}>Usuario</h3>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                borderBottom:
                  errors.username
                    ? "2px solid #b00020"
                    : focusedField === "username"
                    ? "2px solid #8b0000"
                    : "1px solid #c7c7c7",
              }}
            />
            <span style={{ ...styles.error, opacity: errors.username ? 1 : 0 }}>
              {errors.username || " "}
            </span>

            <h3 style={styles.Subttile}>Contraseña</h3>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...styles.input,
                  paddingRight: "40px",
                  borderBottom:
                    errors.password
                      ? "2px solid #b00020"
                      : focusedField === "password"
                      ? "2px solid #8b0000"
                      : "1px solid #c7c7c7",
                }}
              />
              <span
                style={styles.eye}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
            <span style={{ ...styles.error, opacity: errors.password ? 1 : 0 }}>
              {errors.password || " "}
            </span>

            {serverError && (
              <span style={{ ...styles.error, opacity: 1, textAlign: "center" }}>
                {serverError}
              </span>
            )}

            <button
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

const styles = {
  wrapper: {
    width: "100vw",
    height: "100vh",
    backgroundImage: `url(${blurredback})`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundSize: "cover",
  },
  card: {
    width: "900px",
    height: "520px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  imageSection: {
    width: "50%",
    backgroundImage: `url(${gymImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  formSection: {
    width: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "75%",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#000",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  eye: {
    position: "absolute",
    right: "10px",
    cursor: "pointer",
    fontSize: "16px",
    userSelect: "none",
  },
  input: {
    width: "100%",
    padding: "10px 5px",
    border: "none",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "transparent",
    transition: "border-bottom 0.25s ease",
    color: "#000",
  },
  error: {
    minHeight: "16px",
    fontSize: "12px",
    color: "#b00020",
    marginBottom: "10px",
    transition: "opacity 0.2s ease",
  },
  button: {
    padding: "14px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(to right, #580c0cff, #6e0101ff)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
  Subttile: {
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "#444",
    marginBottom: "6px",
  },
  logo: {
    width: "200px",
    display: "block",
    margin: "0 auto 0px auto",
  },
};