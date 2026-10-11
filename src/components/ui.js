// Shared UI building blocks: icons, layout chrome, modals, toasts, form helpers.
import React, { useEffect, useRef, useState } from "react";
import api, { API_URL, imageSrc } from "../Api";

/* ---------- Formatting & errors ---------- */

export const fmtPrice = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const fmtDate = (d, long = false) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: long ? "long" : "short", year: "numeric" }) : "";

export const titleCase = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "");

export const firstName = (name) => (name || "").trim().split(/\s+/)[0] || "there";

// Turn an axios error into a message a person can act on
export const errorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err?.response) return `Can't reach the server at ${API_URL}. Is the backend running?`;
  const data = err.response.data;
  if (typeof data === "string" && data.trim() && data.length < 200) return data;
  if (err.response.status === 403) return "You don't have permission to do that.";
  return data?.message || data?.error || fallback;
};

/* ---------- Icons (24px stroke icons) ---------- */

const ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bag: <><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.8 6.5-5.8s6.5 2.3 6.5 5.8" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.6c2.2.6 3.5 2.6 3.5 5.4" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  package: <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /><path d="m7.5 5.5 9 5" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  arrowLeft: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3.5V16h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  pin: <><path d="M12 21s7-6 7-11.5A7 7 0 0 0 5 9.5C5 15 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  store: <><path d="M4 9.5V20h16V9.5" /><path d="M3 4h18l-1.5 5.5a2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5 0Z" /><path d="M10 20v-5h4v5" /></>,
  shield: <><path d="M12 21s8-3.5 8-10V5l-8-3-8 3v6c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  sparkle: <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9 12 3.5Z" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />,
  upload: <><path d="M12 15V4" /><path d="m7 9 5-5 5 5" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 4 4 2.5-2.5L20 19" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  card: <><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19" /><path d="M6.5 15h3" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18h2" /></>,
  cash: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v5M18 9.5v5" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  rupee: <><path d="M6 4h12M6 8.5h12" /><path d="M9 4c4.5 0 6 2 6 4.5S13.5 13 9 13H6l8 7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 3.5V8h4.5" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20.5V16h-4.5" /></>,
  hand: <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10V4a1.5 1.5 0 0 1 3 0v6" /><path d="M14 10V5.5a1.5 1.5 0 0 1 3 0V13" /><path d="M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15a1.5 1.5 0 0 1 2.3-2L8 15" /></>,
  vase: <><path d="M9 3h6" /><path d="M10 3v2.5C7.2 7 5.5 9.6 5.5 13c0 4.4 2.9 8 6.5 8s6.5-3.6 6.5-8c0-3.4-1.7-6-4.5-7.5V3" /><path d="M6 12.5h12" /></>,
};

export const Icon = ({ name, size = 18, strokeWidth = 1.8, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style} aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- Brand & chrome ---------- */

export const Logo = ({ light = false }) => (
  <span className={"logo" + (light ? " logo-light" : "")}>
    <span className="logo-mark"><Icon name="vase" size={20} strokeWidth={1.9} /></span>
    <span className="logo-text">
      <strong>Artisan Handcraft</strong>
      <small>Handmade marketplace</small>
    </span>
  </span>
);

export const Avatar = ({ name, size }) => (
  <span className={"avatar" + (size ? ` avatar-${size}` : "")}>{(name || "?").trim().charAt(0).toUpperCase()}</span>
);

export const Navbar = ({ user, page, cartCount, onNavigate, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { id: "products", label: "Shop", icon: "store" },
    { id: "orders", label: "My orders", icon: "package" },
    user.role === "ARTISAN" && { id: "dashboard", label: "Studio", icon: "grid" },
    user.role === "ADMIN" && { id: "admin", label: "Admin", icon: "shield" },
  ].filter(Boolean);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <button className="brand" onClick={() => onNavigate("products")} aria-label="Artisan Handcraft home">
          <Logo />
        </button>
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <button key={l.id} className={"nav-link" + (page === l.id ? " active" : "")}
              onClick={() => onNavigate(l.id)} aria-current={page === l.id ? "page" : undefined} title={l.label}>
              <Icon name={l.icon} size={17} /><span>{l.label}</span>
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="icon-btn cart-btn" onClick={() => onNavigate("cart")} aria-label={`Shopping bag, ${cartCount} items`}>
            <Icon name="bag" size={21} />
            {cartCount > 0 && <span className="cart-count">{cartCount > 99 ? "99+" : cartCount}</span>}
          </button>
          <div className="user-menu">
            <button className="avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
              <Avatar name={user.name} />
              <Icon name="chevronDown" size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
                <div className="menu" role="menu">
                  <div className="menu-header">
                    <div className="menu-name">{user.name}</div>
                    <div className="menu-email">{user.email}</div>
                    <RoleBadge role={user.role} />
                  </div>
                  <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onNavigate("orders"); }}>
                    <Icon name="package" /> My orders
                  </button>
                  <button className="menu-item" role="menuitem" onClick={onLogout}>
                    <Icon name="logout" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <Logo />
      <span>Handmade with care across India · © {new Date().getFullYear()} Artisan Handcraft</span>
    </div>
  </footer>
);

/* ---------- Badges ---------- */

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-dot badge-${(status || "").toLowerCase()}`}>{titleCase(status)}</span>
);

export const RoleBadge = ({ role }) => (
  <span className={`badge badge-${(role || "customer").toLowerCase()}`}>{titleCase(role)}</span>
);

/* ---------- Feedback ---------- */

export const Spinner = ({ small }) => <span className={"spinner" + (small ? " spinner-sm" : "")} aria-hidden="true" />;

export const Loading = ({ label = "Loading…" }) => (
  <div className="loading" role="status"><Spinner />{label}</div>
);

export const EmptyState = ({ icon = "package", title, text, action }) => (
  <div className="empty">
    <div className="empty-icon"><Icon name={icon} size={30} strokeWidth={1.6} /></div>
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action}
  </div>
);

export const Alert = ({ type = "error", children }) => (
  <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
    <Icon name={type === "success" ? "check" : type === "info" ? "info" : "alert"} size={18} />
    <div>{children}</div>
  </div>
);

// Small toast for quick confirmations: const [toastNode, showToast] = useToast();
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (message, { action, error } = {}) => {
    clearTimeout(timer.current);
    setToast({ message, action, error, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3200);
  };
  const node = toast && (
    <div key={toast.key} className={"toast" + (toast.error ? " toast-error" : "")} role="status">
      <Icon name={toast.error ? "alert" : "check"} size={17} />
      <span>{toast.message}</span>
      {toast.action && (
        <button className="toast-action" onClick={() => { setToast(null); toast.action.onClick(); }}>
          {toast.action.label}
        </button>
      )}
    </div>
  );
  return [node, show];
};

/* ---------- Modal ---------- */

export const Modal = ({ open, onClose, title, size = "md", children }) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        {title ? (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
          </div>
        ) : (
          <button className="icon-btn icon-btn-glass modal-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        )}
        {children}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) => {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="modal-body"><p className="modal-text">{message}</p></div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={confirm} disabled={busy}>
          {busy && <Spinner small />}{confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

/* ---------- Forms ---------- */

export const Field = ({ label, required, error, hint, children }) => (
  <label className="field">
    {label && <span className="field-label">{label}{required && <span className="req">*</span>}</span>}
    {children}
    {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
  </label>
);

export const QtyStepper = ({ value, onChange, min = 1, small }) => (
  <div className={"qty" + (small ? " qty-sm" : "")}>
    <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
      <Icon name="minus" size={15} />
    </button>
    <span aria-live="polite">{value}</span>
    <button type="button" onClick={() => onChange(value + 1)} aria-label="Increase quantity">
      <Icon name="plus" size={15} />
    </button>
  </div>
);

/* ---------- Product add / edit (shared by Shop and Studio) ---------- */

const EMPTY_PRODUCT = { name: "", description: "", price: "", imageUrl: "", categoryId: "" };

export const ProductFormModal = ({ open, product, categories, user, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(product?.id);

  useEffect(() => {
    if (!open) return;
    setForm(product?.id
      ? { name: product.name || "", description: product.description || "", price: product.price ?? "", imageUrl: product.imageUrl || "", categoryId: product.categoryId ?? "" }
      : EMPTY_PRODUCT);
    setFile(null);
    setError("");
  }, [open, product]);

  useEffect(() => {
    if (!file) { setPreview(""); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const isRemoteUrl = /^https?:/.test(form.imageUrl);
  const shownImage = preview || (form.imageUrl ? imageSrc(form.imageUrl) : "");

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Give your product a name.");
    if (!(Number(form.price) > 0)) return setError("Enter a price greater than zero.");
    setSaving(true);
    setError("");
    try {
      let imageUrl = form.imageUrl || "";
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        imageUrl = (await api.post("/api/products/upload", fd)).data;
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        imageUrl,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        artisanName: product?.artisanName || user.name,
      };
      if (isEdit) await api.put(`/api/products/${product.id}`, payload);
      else await api.post("/api/products", payload);
      onSaved?.(isEdit ? "Product updated" : "Product published");
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not save the product."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit product" : "List a new product"} size="md">
      <form onSubmit={save} noValidate>
        <div className="modal-body">
          {error && <Alert>{error}</Alert>}
          <div className="product-form">
            <div>
              <label className="dropzone">
                {shownImage ? (
                  <>
                    <img src={shownImage} alt="Product preview" />
                    <span className="dropzone-change"><Icon name="upload" size={14} />Change photo</span>
                  </>
                ) : (
                  <>
                    <Icon name="image" size={30} strokeWidth={1.5} />
                    <strong>Upload a photo</strong>
                    <span>JPG or PNG, up to 5 MB</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} />
              </label>
            </div>
            <div>
              <Field label="Product name" required>
                <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Hand-painted blue pottery vase" autoFocus />
              </Field>
              <div className="form-grid">
                <Field label="Price (₹)" required>
                  <input className="input" type="number" min="1" step="1" value={form.price} onChange={set("price")} placeholder="1499" />
                </Field>
                <Field label="Category">
                  <select className="input" value={form.categoryId} onChange={set("categoryId")}>
                    <option value="">Uncategorised</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description" hint="Materials, technique, size — what makes it special.">
                <textarea className="input" rows={4} value={form.description} onChange={set("description")}
                  placeholder="Wheel-thrown by hand and glazed in natural cobalt…" />
              </Field>
              <Field label="…or paste an image URL" hint={file ? "The uploaded photo will be used." : undefined}>
                <input className="input" value={isRemoteUrl ? form.imageUrl : ""} disabled={Boolean(file)}
                  onChange={set("imageUrl")} placeholder="https://" />
              </Field>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner small />}{isEdit ? "Save changes" : "Publish product"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
