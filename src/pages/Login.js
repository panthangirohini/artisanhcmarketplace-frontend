import React, { useState } from "react";
import api from "../Api";
import AuthLayout from "../components/AuthLayout";
import { Alert, Field, Icon, Spinner, errorMessage } from "../components/ui";

// Matches the account DataSeeder creates on the backend; only shown in development
const DEMO_ADMIN = { email: "admin@artisan.com", password: "admin123" };

const Login = ({ setUser, onGoToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    api
      .post("/api/users/login", { email: email.trim(), password })
      .then((res) => setUser(res.data))
      .catch((err) =>
        setError(err.response?.status === 401 ? "That email and password don't match. Please try again." : errorMessage(err))
      )
      .finally(() => setLoading(false));
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-sub">Sign in to continue to your account.</p>

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleLogin} noValidate>
        <Field label="Email">
          <div className="input-icon">
            <Icon name="mail" />
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
        </Field>

        <Field label="Password">
          <div className="input-icon">
            <Icon name="lock" />
            <input className="input" type={showPassword ? "text" : "password"} autoComplete="current-password"
              placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="input-suffix" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <><Spinner small /> Signing in…</> : <>Sign in <Icon name="arrowRight" size={17} /></>}
        </button>
      </form>

      <p className="auth-switch">
        New to Artisan Handcraft?{" "}
        <button type="button" className="link" onClick={onGoToRegister}>Create an account</button>
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="demo-hint">
          <span>Demo admin: <strong>{DEMO_ADMIN.email}</strong> / {DEMO_ADMIN.password}</span>
          <button type="button" className="btn btn-secondary btn-sm"
            onClick={() => { setEmail(DEMO_ADMIN.email); setPassword(DEMO_ADMIN.password); }}>
            Fill in
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;
