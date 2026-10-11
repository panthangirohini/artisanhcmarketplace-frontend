import React, { useCallback, useEffect, useMemo, useState } from "react";
import api, { imageSrc } from "../Api";
import {
  Alert, Avatar, ConfirmDialog, EmptyState, Icon, Loading, RoleBadge, StatusBadge,
  errorMessage, fmtDate, fmtPrice, titleCase, useToast,
} from "./ui";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const ROLES = ["CUSTOMER", "ARTISAN", "ADMIN"];

const AdminPanel = ({ user }) => {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null); // { kind: "user" | "product", item }
  const [toast, showToast] = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, usersRes, productsRes, ordersRes, catRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
        api.get("/api/admin/products"),
        api.get("/api/admin/orders"),
        api.get("/api/categories"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setOrders([...ordersRes.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setCategories(catRes.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't load admin data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const q = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  const filteredProducts = products.filter((p) => !q || p.name?.toLowerCase().includes(q) || p.artisanName?.toLowerCase().includes(q));
  const filteredOrders = orders.filter((o) => !q || String(o.id).includes(q) || userById[o.userId]?.name?.toLowerCase().includes(q));

  const updateUserRole = async (id, role) => {
    try {
      await api.put(`/api/admin/users/${id}/role`, null, { params: { role } });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      showToast(`Role changed to ${titleCase(role)}`);
    } catch (err) {
      showToast(errorMessage(err, "Couldn't change the role."), { error: true });
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/api/admin/orders/${id}/status`, null, { params: { status } });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      showToast(`Order #${id} marked ${titleCase(status).toLowerCase()}`);
    } catch (err) {
      showToast(errorMessage(err, "Couldn't update the order."), { error: true });
    }
  };

  const handleDelete = async () => {
    const { kind, item } = confirm;
    try {
      await api.delete(`/api/admin/${kind === "user" ? "users" : "products"}/${item.id}`);
      showToast(kind === "user" ? "User deleted" : "Product deleted");
      fetchAll();
    } catch (err) {
      showToast(errorMessage(err, "Couldn't delete."), { error: true });
    }
    setConfirm(null);
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users", count: users.length },
    { id: "products", label: "Products", count: products.length },
    { id: "orders", label: "Orders", count: orders.length },
  ];

  const statCards = stats ? [
    { label: "Revenue", value: fmtPrice(stats.totalRevenue), foot: "confirmed, shipped & delivered", icon: "rupee", tone: "green" },
    { label: "Orders", value: stats.totalOrders, foot: `${orders.filter((o) => o.status === "PENDING").length} pending`, icon: "package", tone: "blue" },
    { label: "Products", value: stats.totalProducts, foot: `${categories.length} categories`, icon: "vase", tone: "brand" },
    { label: "Users", value: stats.totalUsers, foot: `${stats.totalArtisans} artisans`, icon: "users", tone: "amber" },
  ] : [];

  const renderOrdersTable = (rows, editable) => (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Items</th><th className="text-right">Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const customer = userById[o.userId];
            return (
              <tr key={o.id}>
                <td>
                  <div className="cell-title">#{o.id}</div>
                  <div className="cell-sub">{fmtDate(o.createdAt)}</div>
                </td>
                <td>
                  <div className="cell-title">{customer?.name || `User ${o.userId ?? "—"}`}</div>
                  <div className="cell-sub" title={o.shippingAddress}>{o.shippingAddress || customer?.email}</div>
                </td>
                <td>
                  <div className="cell-sub" style={{ color: "var(--ink-2)" }}>
                    {(o.items || []).map((i) => `${i.productName} × ${i.quantity}`).join(", ") || "—"}
                  </div>
                </td>
                <td className="text-right nowrap"><strong>{fmtPrice(o.totalAmount)}</strong></td>
                <td>
                  {editable ? (
                    <select className="input input-sm" style={{ width: 140 }} value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)} aria-label={`Status for order ${o.id}`}>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                    </select>
                  ) : <StatusBadge status={o.status} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const searchBox = (placeholder) => (
    <div className="search-box input-icon">
      <Icon name="search" />
      <input className="input" type="search" placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );

  return (
    <div className="container page">
      <div className="dash-hero dash-hero-admin">
        <div className="dash-hero-inner">
          <div>
            <span className="eyebrow">Admin console</span>
            <h1>Marketplace overview</h1>
            <p>Manage people, products and orders across Artisan Handcraft.</p>
          </div>
          <button className="btn btn-light" onClick={() => { setLoading(true); fetchAll(); }}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={"tab" + (tab === t.id ? " active" : "")}
            onClick={() => { setTab(t.id); setSearch(""); }}>
            {t.label}{t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? <Loading label="Loading admin data…" /> : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              <div className="stat-grid">
                {statCards.map((c) => (
                  <div key={c.label} className="card stat-card">
                    <span className={`stat-icon ${c.tone}`}><Icon name={c.icon} size={20} /></span>
                    <span className="stat-label">{c.label}</span>
                    <span className="stat-value">{c.value}</span>
                    <span className="stat-foot">{c.foot}</span>
                  </div>
                ))}
              </div>

              <div className="split">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Latest orders</h3>
                    {orders.length > 0 && <button className="link" onClick={() => setTab("orders")}>Manage orders</button>}
                  </div>
                  {orders.length === 0
                    ? <EmptyState icon="package" title="No orders yet" />
                    : orders.slice(0, 6).map((o) => (
                      <div key={o.id} className="list-row">
                        <div className="list-row-main">
                          <div className="cell-title">#{o.id} · {userById[o.userId]?.name || "Customer"}</div>
                          <div className="cell-sub">{fmtDate(o.createdAt)}</div>
                        </div>
                        <StatusBadge status={o.status} />
                        <span className="order-amount nowrap">{fmtPrice(o.totalAmount)}</span>
                      </div>
                    ))}
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Newest members</h3>
                    <button className="link" onClick={() => setTab("users")}>All users</button>
                  </div>
                  {[...users].reverse().slice(0, 6).map((u) => (
                    <div key={u.id} className="list-row">
                      <Avatar name={u.name} />
                      <div className="list-row-main">
                        <div className="cell-title">{u.name}</div>
                        <div className="cell-sub">{u.email}</div>
                      </div>
                      <RoleBadge role={u.role} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <>
              <div className="toolbar">{searchBox("Search by name or email…")}</div>
              <div className="card">
                {filteredUsers.length === 0 ? <EmptyState icon="users" title="No users found" /> : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th /></tr></thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const isSelf = u.id === user.id;
                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="cell-user">
                                  <Avatar name={u.name} />
                                  <span className="cell-title">{u.name}{isSelf && <span className="muted" style={{ fontWeight: 400 }}> (you)</span>}</span>
                                </div>
                              </td>
                              <td className="muted">{u.email}</td>
                              <td>
                                {isSelf ? <RoleBadge role={u.role} /> : (
                                  <select className="input input-sm" style={{ width: 130 }} value={u.role}
                                    onChange={(e) => updateUserRole(u.id, e.target.value)} aria-label={`Role for ${u.name}`}>
                                    {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
                                  </select>
                                )}
                              </td>
                              <td>
                                <div className="cell-actions">
                                  {!isSelf && (
                                    <button className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => setConfirm({ kind: "user", item: u })}
                                      aria-label={`Delete ${u.name}`}><Icon name="trash" size={16} /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── PRODUCTS ── */}
          {tab === "products" && (
            <>
              <div className="toolbar">{searchBox("Search by product or artisan…")}</div>
              <div className="card">
                {filteredProducts.length === 0 ? <EmptyState icon="vase" title="No products found" /> : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Product</th><th>Artisan</th><th>Category</th><th className="text-right">Price</th><th /></tr></thead>
                      <tbody>
                        {filteredProducts.map((p) => {
                          const cat = catById[p.categoryId];
                          return (
                            <tr key={p.id}>
                              <td>
                                <div className="cell-user">
                                  <img className="cell-thumb" src={imageSrc(p.imageUrl, cat?.icon)} alt="" />
                                  <span className="cell-title">{p.name}</span>
                                </div>
                              </td>
                              <td>{p.artisanName}</td>
                              <td className="nowrap">{cat ? `${cat.icon} ${cat.name}` : <span className="muted">—</span>}</td>
                              <td className="text-right nowrap"><strong>{fmtPrice(p.price)}</strong></td>
                              <td>
                                <div className="cell-actions">
                                  <button className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => setConfirm({ kind: "product", item: p })}
                                    aria-label={`Delete ${p.name}`}><Icon name="trash" size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <>
              <div className="toolbar">{searchBox("Search by order # or customer…")}</div>
              <div className="card">
                {filteredOrders.length === 0 ? <EmptyState icon="package" title="No orders found" /> : renderOrdersTable(filteredOrders, true)}
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.kind === "user" ? "Delete this user?" : "Delete this product?"}
        message={confirm ? `“${confirm.item.name}” will be permanently removed. This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />

      {toast}
    </div>
  );
};

export default AdminPanel;
