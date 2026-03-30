import React, { useState } from "react";
import axios from "axios";

const Login = ({ setUser, onGoToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    axios
      .post("http://localhost:8080/api/users/login", { email, password })
      .then((res) => {
        if (res.data) {
          setUser(res.data);
        } else {
          setError("Invalid credentials. Please try again.");
        }
      })
      .catch(() => setError("Invalid credentials. Please try again."))
      .finally(() => setLoading(false));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.page}>
      {/* Left decorative panel */}
      <div style={styles.leftPanel}>
        <div style={styles.patternOverlay} />
        <div style={styles.leftContent}>
          <div style={styles.logoMark}>✦</div>
          <h1 style={styles.brandName}>Artisan<br />Handcraft</h1>
          <p style={styles.brandTagline}>
            Handmade with love,<br />crafted for you.
          </p>
          <div style={styles.decorDots}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ ...styles.dot, opacity: 0.3 + (i % 3) * 0.2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <span style={styles.formBadge}>Welcome back</span>
            <h2 style={styles.formTitle}>Sign in to your account</h2>
            <p style={styles.formSubtitle}>Access your marketplace dashboard</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={loading ? { ...styles.btn, opacity: 0.7, cursor: "not-allowed" } : styles.btn}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, styles.btnHover)}
            onMouseLeave={(e) => !loading && Object.assign(e.target.style, { background: "#7c4a1e", transform: "none" })}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>New here?</span>
            <span style={styles.dividerLine} />
          </div>

          <button
            onClick={onGoToRegister}
            style={styles.secondaryBtn}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.secondaryBtnHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { background: "transparent", color: "#7c4a1e" })}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Georgia', serif",
    background: "#fdf8f2",
  },
  leftPanel: {
    width: "42%",
    background: "linear-gradient(160deg, #7c4a1e 0%, #a0622a 50%, #5c3310 100%)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  patternOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 1px, transparent 1px),
      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    color: "#fdf8f2",
    padding: "40px",
  },
  logoMark: {
    fontSize: "36px",
    marginBottom: "20px",
    display: "block",
    color: "#f5d9a8",
    letterSpacing: "4px",
  },
  brandName: {
    fontSize: "52px",
    fontWeight: "400",
    lineHeight: "1.1",
    marginBottom: "20px",
    color: "#fff",
    letterSpacing: "1px",
  },
  brandTagline: {
    fontSize: "16px",
    color: "#f5d9a8",
    lineHeight: "1.8",
    fontStyle: "italic",
    marginBottom: "40px",
  },
  decorDots: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    width: "80px",
    margin: "0 auto",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#f5d9a8",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  formCard: {
    width: "100%",
    maxWidth: "420px",
  },
  formHeader: {
    marginBottom: "36px",
  },
  formBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontFamily: "'Trebuchet MS', sans-serif",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#a0622a",
    background: "#fdefd8",
    padding: "5px 12px",
    borderRadius: "20px",
    marginBottom: "16px",
  },
  formTitle: {
    fontSize: "30px",
    fontWeight: "400",
    color: "#2c1a0e",
    marginBottom: "8px",
    lineHeight: "1.2",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#8a6a52",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  errorBox: {
    background: "#fde8e8",
    border: "1px solid #f5a5a5",
    color: "#b91c1c",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontFamily: "'Trebuchet MS', sans-serif",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#6b4c35",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    border: "1.5px solid #d9c9b0",
    borderRadius: "10px",
    background: "#fff",
    color: "#2c1a0e",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  inputFocus: {
    borderColor: "#a0622a",
    boxShadow: "0 0 0 3px rgba(160,98,42,0.12)",
  },
  btn: {
    width: "100%",
    padding: "15px",
    fontSize: "15px",
    fontFamily: "'Trebuchet MS', sans-serif",
    letterSpacing: "1px",
    background: "#7c4a1e",
    color: "#fdf8f2",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "8px",
    marginBottom: "24px",
    transition: "background 0.2s, transform 0.15s",
  },
  btnHover: {
    background: "#a0622a",
    transform: "translateY(-1px)",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e8d9c6",
    display: "block",
  },
  dividerText: {
    fontSize: "12px",
    color: "#a08060",
    fontFamily: "'Trebuchet MS', sans-serif",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    width: "100%",
    padding: "14px",
    fontSize: "14px",
    fontFamily: "'Trebuchet MS', sans-serif",
    background: "transparent",
    color: "#7c4a1e",
    border: "1.5px solid #d9c9b0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
  },
  secondaryBtnHover: {
    background: "#fdefd8",
    color: "#5c3310",
  },
};

export default Login;