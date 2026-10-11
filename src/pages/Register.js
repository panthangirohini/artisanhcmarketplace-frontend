import React, { useState } from "react";
import api from "../Api";
import AuthLayout from "../components/AuthLayout";
import { Alert, Field, Icon, Spinner, errorMessage } from "../components/ui";

const ROLES = [
  { id: "CUSTOMER", icon: "bag", title: "I want to shop", sub: "Discover handmade goods" },
  { id: "ARTISAN", icon: "hand", title: "I'm an artisan", sub: "Sell my craft" },
];

const Register = ({ onGoToLogin }) => {
  const [user, setUser] = useState({ name: "", email: "", password: "", role: "CUSTOMER" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setUser({ ...user, [key]: e.target.value });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!user.name.trim() || !user.email.trim() || !user.password) {
      setError("Please fill in your name, email and password.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(user.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (user.password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }
    setLoading(true);
    setError("");
    api
      .post("/api/users/register", { ...user, name: user.name.trim(), email: user.email.trim() })
      .then(() => {
        setSuccess(true);
        setTimeout(() => onGoToLogin && onGoToLogin(), 1600);
      })
      .catch((err) => setError(errorMessage(err, "Registration failed. Please try again.")))
      .finally(() => setLoading(false));
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Create your account</h2>
      <p className="auth-sub">Join a community of makers and collectors.</p>

      {error && <Alert>{error}</Alert>}
      {success && <Alert type="success">Account created! Taking you to sign in…</Alert>}

      <form onSubmit={handleRegister} noValidate>
        <div className="field">
          <span className="field-label">How will you use Artisan Handcraft?</span>
          <div className="role-cards" role="radiogroup">
            {ROLES.map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={user.role === r.id}
                className={"role-card" + (user.role === r.id ? " selected" : "")}
                onClick={() => setUser({ ...user, role: r.id })}>
                <Icon name={r.icon} size={20} />
                <strong>{r.title}</strong>
                <small>{r.sub}</small>
              </button>
            ))}
          </div>
        </div>

        <Field label={user.role === "ARTISAN" ? "Your name or studio name" : "Full name"}
          hint={user.role === "ARTISAN" ? "Shown on your products as the maker." : undefined}>
          <div className="input-icon">
            <Icon name="user" />
            <input className="input" autoComplete="name" placeholder="Your name" value={user.name} onChange={set("name")} autoFocus />
          </div>
        </Field>

        <Field label="Email">
          <div className="input-icon">
            <Icon name="mail" />
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com" value={user.email} onChange={set("email")} />
          </div>
        </Field>

        <Field label="Password" hint="At least 6 characters.">
          <div className="input-icon">
            <Icon name="lock" />
            <input className="input" type={showPassword ? "text" : "password"} autoComplete="new-password"
              placeholder="Create a password" value={user.password} onChange={set("password")} />
            <button type="button" className="input-suffix" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || success} style={{ marginTop: 8 }}>
          {loading ? <><Spinner small /> Creating account…</> : success ? <><Icon name="check" /> Done</> : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" className="link" onClick={onGoToLogin}>Sign in</button>
      </p>
    </AuthLayout>
  );
};

export default Register;
