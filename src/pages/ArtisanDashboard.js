import React, { useCallback, useEffect, useMemo, useState } from "react";
import api, { imageSrc } from "../Api";
import {
  Alert, ConfirmDialog, EmptyState, Icon, Loading, ProductFormModal, StatusBadge,
  errorMessage, firstName, fmtDate, fmtPrice, titleCase, useToast,
} from "../components/ui";
import { OrderTracker } from "./OrderHistory";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const EARNING = ["CONFIRMED", "SHIPPED", "DELIVERED"];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const ArtisanDashboard = ({ user }) => {
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, showToast] = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const [prodRes, ordRes, catRes] = await Promise.all([
        api.get("/api/products"),
        api.get("/api/orders/artisan"),
        api.get("/api/categories"),
      ]);
      // Only this artisan's own products
      setProducts(prodRes.data.filter((p) => p.artisanName?.toLowerCase() === user.name?.toLowerCase()));
      setOrders(ordRes.data || []);
      setCategories(catRes.data || []);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't load your studio."));
    } finally {
      setLoading(false);
    }
  }, [user.name]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const revenue = orders.filter((o) => EARNING.includes(o.status)).reduce((s, o) => s + o.totalAmount, 0);
  const toFulfil = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
  const unitsSold = orders.filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, null, { params: { status } });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      showToast(`Order #${orderId} marked ${titleCase(status).toLowerCase()}`);
    } catch (err) {
      showToast(errorMessage(err, "Couldn't update the order."), { error: true });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/products/${deleting.id}`);
      showToast("Product removed");
      fetchAll();
    } catch (err) {
      showToast(errorMessage(err, "Couldn't delete the product."), { error: true });
    }
    setDeleting(null);
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products", count: products.length },
    { id: "orders", label: "Orders", count: orders.length },
  ];

  return (
    <div className="container page">
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div>
            <span className="eyebrow">Your studio</span>
            <h1>{greeting()}, {firstName(user.name)}</h1>
            <p>
              {toFulfil > 0
                ? `You have ${toFulfil} ${toFulfil === 1 ? "order" : "orders"} waiting to be fulfilled.`
                : "You're all caught up. Time to make something new?"}
            </p>
          </div>
          <button className="btn btn-light btn-lg" onClick={() => setEditing({})}><Icon name="plus" size={17} /> List a product</button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={"tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            {t.label}{t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? <Loading label="Loading your studio…" /> : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              <div className="stat-grid">
                <div className="card stat-card">
                  <span className="stat-icon green"><Icon name="rupee" size={20} /></span>
                  <span className="stat-label">Earnings</span>
                  <span className="stat-value">{fmtPrice(revenue)}</span>
                  <span className="stat-foot">from confirmed orders</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-icon amber"><Icon name="clock" size={20} /></span>
                  <span className="stat-label">To fulfil</span>
                  <span className="stat-value">{toFulfil}</span>
                  <span className="stat-foot">pending or confirmed</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-icon blue"><Icon name="package" size={20} /></span>
                  <span className="stat-label">Units sold</span>
                  <span className="stat-value">{unitsSold}</span>
                  <span className="stat-foot">across {orders.length} {orders.length === 1 ? "order" : "orders"}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-icon brand"><Icon name="vase" size={20} /></span>
                  <span className="stat-label">Products listed</span>
                  <span className="stat-value">{products.length}</span>
                  <span className="stat-foot">live on the marketplace</span>
                </div>
              </div>

              <div className="split">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Recent orders</h3>
                    {orders.length > 0 && <button className="link" onClick={() => setTab("orders")}>View all</button>}
                  </div>
                  {orders.length === 0 ? (
                    <EmptyState icon="package" title="No orders yet" text="When customers buy your pieces, their orders show up here." />
                  ) : orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="list-row">
                      <div className="list-row-main">
                        <div className="cell-title">Order #{o.id}</div>
                        <div className="cell-sub">{fmtDate(o.createdAt)} · {o.items.map((i) => i.productName).join(", ")}</div>
                      </div>
                      <StatusBadge status={o.status} />
                      <span className="order-amount nowrap">{fmtPrice(o.totalAmount)}</span>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Your products</h3>
                    {products.length > 0 && <button className="link" onClick={() => setTab("products")}>Manage</button>}
                  </div>
                  {products.length === 0 ? (
                    <EmptyState icon="vase" title="Nothing listed yet" text="Add your first handmade piece to start selling."
                      action={<button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Add product</button>} />
                  ) : (
                    <div className="mini-products">
                      {products.slice(0, 4).map((p) => (
                        <button key={p.id} className="mini-product" style={{ border: 0, background: "none", padding: 0, textAlign: "left" }} onClick={() => setEditing(p)}>
                          <img src={imageSrc(p.imageUrl, catById[p.categoryId]?.icon)} alt="" />
                          <div className="mini-product-name">{p.name}</div>
                          <div className="mini-product-price">{fmtPrice(p.price)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCTS ── */}
          {tab === "products" && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Your products</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Icon name="plus" size={15} /> Add product</button>
              </div>
              {products.length === 0 ? (
                <EmptyState icon="vase" title="Nothing listed yet"
                  text={`Products are matched to you by your name, “${user.name}”. Add your first piece to get started.`} />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Product</th><th>Category</th><th className="text-right">Price</th><th /></tr></thead>
                    <tbody>
                      {products.map((p) => {
                        const cat = catById[p.categoryId];
                        return (
                          <tr key={p.id}>
                            <td>
                              <div className="cell-user">
                                <img className="cell-thumb" src={imageSrc(p.imageUrl, cat?.icon)} alt="" />
                                <div style={{ minWidth: 0 }}>
                                  <div className="cell-title">{p.name}</div>
                                  <div className="cell-sub">{p.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="nowrap">{cat ? `${cat.icon} ${cat.name}` : <span className="muted">—</span>}</td>
                            <td className="text-right nowrap"><strong>{fmtPrice(p.price)}</strong></td>
                            <td>
                              <div className="cell-actions">
                                <button className="icon-btn icon-btn-sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Icon name="edit" size={16} /></button>
                                <button className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}><Icon name="trash" size={16} /></button>
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
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            orders.length === 0 ? (
              <div className="card"><EmptyState icon="package" title="No orders yet" text="Orders for your products will appear here." /></div>
            ) : (
              <div className="order-list">
                {orders.map((o) => (
                  <div key={o.id} className="card order-card">
                    <div className="order-head" style={{ cursor: "default" }}>
                      <span className="order-thumb"><Icon name="package" size={22} /></span>
                      <span className="order-meta">
                        <div className="order-id">Order #{o.id}</div>
                        <div className="order-sub">{fmtDate(o.createdAt, true)}</div>
                      </span>
                      <StatusBadge status={o.status} />
                      <span className="order-amount">{fmtPrice(o.totalAmount)}</span>
                    </div>
                    {o.status !== "CANCELLED" && <OrderTracker status={o.status} />}
                    <div className="order-details">
                      <div className="detail-grid">
                        <div className="detail-block">
                          <h4>Your items in this order</h4>
                          {o.items.map((item, i) => (
                            <div key={i} className="item-row">
                              <span>{item.productName}<span className="qty-x">× {item.quantity}</span></span>
                              <span>{fmtPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          {o.shippingAddress && (
                            <div className="detail-block"><h4>Ship to</h4><p>{o.shippingAddress}</p></div>
                          )}
                          <div className="detail-block">
                            <h4>Update status</h4>
                            <select className="input input-sm" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                              aria-label={`Status for order ${o.id}`}>
                              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      <ProductFormModal
        open={Boolean(editing)}
        product={editing}
        categories={categories}
        user={user}
        onClose={() => setEditing(null)}
        onSaved={(msg) => { showToast(msg); fetchAll(); }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this product?"
        message={deleting ? `“${deleting.name}” will be removed from the marketplace. This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      {toast}
    </div>
  );
};

export default ArtisanDashboard;
