import React, { useState } from "react";
import axios from "axios";

const Register = ({ onGoToLogin }) => {
  const [user, setUser] = useState({ name: "", email: "", password: "", role: "CUSTOMER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = () => {
    if (!user.name || !user.email || !user.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    axios
      .post("http://localhost:8080/api/users/register", user)
      .then(() => {
        setSuccess(true);
        setTimeout(() => onGoToLogin && onGoToLogin(), 1800);
      })
      .catch(() => setError("Registration failed. Please try again."))
      .finally(() => setLoading(false));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.patternOverlay} />
        <div style={styles.leftContent}>
          <div style={styles.logoMark}>✦</div>
          <h1 style={styles.brandName}>Artisan<br />Handcraft</h1>
          <p style={styles.brandTagline}>
            Join a community of<br />creators & collectors.
          </p>
          <div style={styles.features}>
            {["Browse unique handmade items", "Support local artisans", "Secure & easy checkout"].map((f, i) => (
              <div key={i} style={styles.featureRow}>
                <span style={styles.featureIcon}>◆</span>
                <span style={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <span style={styles.formBadge}>New account</span>
            <h2 style={styles.formTitle}>Create your account</h2>
            <p style={styles.formSubtitle}>Start your handcraft journey today</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && (
            <div style={styles.successBox}>
              Registration successful! Redirecting to login...
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full name</label>
            <input
              type="text"
              placeholder="Your name"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              onKeyDown={handleKeyDown}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
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
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              onKeyDown={handleKeyDown}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>I am a</label>
            <div style={styles.roleRow}>
              {["CUSTOMER", "ARTISAN"].map((r) => (
                <button
                  key={r}
                  onClick={() => setUser({ ...user, role: r })}
                  style={user.role === r ? { ...styles.roleBtn, ...styles.roleBtnActive } : styles.roleBtn}
                >
                  {r === "CUSTOMER" ? "🛍 Customer" : "🎨 Artisan"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || success}
            style={loading || success ? { ...styles.btn, opacity: 0.7, cursor: "not-allowed" } : styles.btn}
            onMouseEnter={(e) => !(loading || success) && Object.assign(e.target.style, styles.btnHover)}
            onMouseLeave={(e) => !(loading || success) && Object.assign(e.target.style, { background: "#7c4a1e", transform: "none" })}
          >
            {loading ? "Creating account..." : success ? "Done!" : "Create Account"}
          </button>

          <p style={styles.loginLink}>
            Already have an account?{" "}
            <span style={styles.link} onClick={onGoToLogin}>
              Sign in
            </span>
          </p>
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
    background: "linear-gradient(160deg, #5c3310 0%, #7c4a1e 50%, #a0622a 100%)",
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
    fontSize: "48px",
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
    marginBottom: "36px",
  },
  features: {
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  featureIcon: {
    color: "#f5d9a8",
    fontSize: "10px",
    flexShrink: 0,
  },
  featureText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Trebuchet MS', sans-serif",
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
    marginBottom: "32px",
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
  successBox: {
    background: "#e8f5e9",
    border: "1px solid #a5d6a7",
    color: "#2e7d32",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  fieldGroup: {
    marginBottom: "18px",
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
  roleRow: {
    display: "flex",
    gap: "12px",
  },
  roleBtn: {
    flex: 1,
    padding: "12px",
    fontSize: "14px",
    fontFamily: "'Trebuchet MS', sans-serif",
    background: "#fff",
    color: "#6b4c35",
    border: "1.5px solid #d9c9b0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  roleBtnActive: {
    background: "#fdefd8",
    borderColor: "#a0622a",
    color: "#5c3310",
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
    marginBottom: "20px",
    transition: "background 0.2s, transform 0.15s",
  },
  btnHover: {
    background: "#a0622a",
    transform: "translateY(-1px)",
  },
  loginLink: {
    textAlign: "center",
    fontSize: "14px",
    color: "#8a6a52",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  link: {
    color: "#7c4a1e",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default Register;