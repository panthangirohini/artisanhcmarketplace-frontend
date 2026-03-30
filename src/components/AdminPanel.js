import React, { useEffect, useState } from "react";
import api from "../Api";

const STATUS_STYLES = {
  PENDING:   { bg: "#faeeda", color: "#854f0b" },
  CONFIRMED: { bg: "#e6f1fb", color: "#185fa5" },
  SHIPPED:   { bg: "#e1f5ee", color: "#0f6e56" },
  DELIVERED: { bg: "#eaf3de", color: "#3b6d11" },
  CANCELLED: { bg: "#fcebeb", color: "#a32d2d" },
};

const AdminPanel = ({ user, onBack }) => {
  const [tab, setTab]         = useState("overview");
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, productsRes, ordersRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
        api.get("/api/admin/products"),
        api.get("/api/admin/orders"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/api/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateUserRole = async (id, role) => {
    await api.put(`/api/admin/users/${id}/role?role=${role}`);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/api/admin/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
    fetchAll(); // refresh stats
  };

  const updateOrderStatus = async (id, status) => {
    await api.put(`/api/admin/orders/${id}/status?status=${status}`);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const fmtPrice = n => "₹" + Number(n).toLocaleString("en-IN");
  const fmtDate  = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const filteredUsers    = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders   = orders.filter(o => String(o.id).includes(search));

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logoMark}>⬡</div>
          <div style={s.brandName}>Admin<br />Panel</div>
        </div>
        <div style={s.adminCard}>
          <div style={s.avatar}>{(user.name || "A").charAt(0).toUpperCase()}</div>
          <div style={s.adminName}>{user.name}</div>
          <div style={s.adminRole}>Administrator</div>
        </div>
        <nav style={s.nav}>
          {[
            { id: "overview", label: "Overview",  icon: "◈" },
            { id: "users",    label: "Users",     icon: "◉" },
            { id: "products", label: "Products",  icon: "◎" },
            { id: "orders",   label: "Orders",    icon: "◇" },
          ].map(item => (
            <button key={item.id}
              style={tab === item.id ? { ...s.navBtn, ...s.navBtnActive } : s.navBtn}
              onClick={() => { setTab(item.id); setSearch(""); }}>
              <span style={s.navIcon}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <button style={s.backBtn} onClick={onBack}>← Back to marketplace</button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {loading ? (
          <div style={s.loadingWrap}><p style={s.loadingText}>Loading admin data...</p></div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === "overview" && stats && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <div><h2 style={s.sectionTitle}>Overview</h2><p style={s.sectionSub}>Platform at a glance</p></div>
                </div>
                <div style={s.statsGrid}>
                  {[
                    { label: "Total users",    value: stats.totalUsers,    highlight: false },
                    { label: "Artisans",        value: stats.totalArtisans, highlight: false },
                    { label: "Products",        value: stats.totalProducts, highlight: false },
                    { label: "Total orders",    value: stats.totalOrders,   highlight: false },
                    { label: "Total revenue",   value: fmtPrice(stats.totalRevenue), highlight: true },
                  ].map(card => (
                    <div key={card.label} style={card.highlight ? { ...s.statCard, ...s.statHighlight } : s.statCard}>
                      <div style={s.statLabel}>{card.label}</div>
                      <div style={{ ...s.statValue, color: card.highlight ? "#5c3310" : "#2c1a0e" }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {/* Recent orders */}
                <div style={s.card}>
                  <div style={s.cardHeader}><h3 style={s.cardTitle}>Recent orders</h3><button style={s.linkBtn} onClick={() => setTab("orders")}>View all →</button></div>
                  {orders.slice(0, 6).map(o => (
                    <div key={o.id} style={s.tableRow}>
                      <span style={s.tableCell}>#{o.id}</span>
                      <span style={s.tableCell}>{fmtDate(o.createdAt)}</span>
                      <span style={s.tableCell}>{fmtPrice(o.totalAmount)}</span>
                      <span style={{ ...s.statusBadge, ...STATUS_STYLES[o.status] }}>{o.status}</span>
                    </div>
                  ))}
                </div>

                {/* Recent users */}
                <div style={s.card}>
                  <div style={s.cardHeader}><h3 style={s.cardTitle}>Recent users</h3><button style={s.linkBtn} onClick={() => setTab("users")}>View all →</button></div>
                  {users.slice(0, 6).map(u => (
                    <div key={u.id} style={s.tableRow}>
                      <div style={s.userAvatar}>{(u.name || "?").charAt(0).toUpperCase()}</div>
                      <span style={{ ...s.tableCell, flex: 2 }}>{u.name}</span>
                      <span style={{ ...s.tableCell, flex: 3 }}>{u.email}</span>
                      <span style={{ ...s.roleBadge, ...(u.role === "ARTISAN" ? s.roleArtisan : u.role === "ADMIN" ? s.roleAdmin : s.roleCustomer) }}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <div><h2 style={s.sectionTitle}>Users</h2><p style={s.sectionSub}>{users.length} registered</p></div>
                </div>
                <input style={s.searchInput} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                <div style={s.tableHead}>
                  <span style={{ flex: 2 }}>Name</span><span style={{ flex: 3 }}>Email</span>
                  <span style={{ flex: 1 }}>Role</span><span style={{ flex: 2 }}>Actions</span>
                </div>
                {filteredUsers.map(u => (
                  <div key={u.id} style={s.tableRow}>
                    <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={s.userAvatar}>{(u.name || "?").charAt(0).toUpperCase()}</div>
                      <span style={s.tableText}>{u.name}</span>
                    </div>
                    <span style={{ flex: 3, ...s.tableText, color: "#6b4c35" }}>{u.email}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ ...s.roleBadge, ...(u.role === "ARTISAN" ? s.roleArtisan : u.role === "ADMIN" ? s.roleAdmin : s.roleCustomer) }}>{u.role}</span>
                    </div>
                    <div style={{ flex: 2, display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {u.role !== "ADMIN" && (
                        <select style={s.roleSelect} value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}>
                          <option value="CUSTOMER">Customer</option>
                          <option value="ARTISAN">Artisan</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                      {u.id !== user.id && (
                        <button style={s.deleteBtn} onClick={() => deleteUser(u.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <div><h2 style={s.sectionTitle}>Products</h2><p style={s.sectionSub}>{products.length} listed</p></div>
                </div>
                <input style={s.searchInput} placeholder="Search by product name..." value={search} onChange={e => setSearch(e.target.value)} />
                <div style={s.productsGrid}>
                  {filteredProducts.map(p => (
                    <div key={p.id} style={s.productCard}>
                      <img src={p.imageUrl ? `http://localhost:8080/uploads/${p.imageUrl}` : "https://via.placeholder.com/280x160/f5ead8/a0622a?text=✦"} alt={p.name} style={s.productImg} />
                      <div style={s.productBody}>
                        <div style={s.productName}>{p.name}</div>
                        <div style={s.productArtisan}>by {p.artisanName}</div>
                        <div style={s.productFooter}>
                          <span style={s.productPrice}>{fmtPrice(p.price)}</span>
                          <button style={s.deleteBtn} onClick={() => deleteProduct(p.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <div><h2 style={s.sectionTitle}>Orders</h2><p style={s.sectionSub}>{orders.length} total</p></div>
                </div>
                <input style={s.searchInput} placeholder="Search by order ID..." value={search} onChange={e => setSearch(e.target.value)} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredOrders.map(o => (
                    <div key={o.id} style={s.orderCard}>
                      <div style={s.orderTop}>
                        <div>
                          <div style={s.orderId}>Order #{o.id}</div>
                          <div style={s.orderDate}>{fmtDate(o.createdAt)}</div>
                          {o.shippingAddress && <div style={s.orderAddress}>📍 {o.shippingAddress}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={s.orderAmount}>{fmtPrice(o.totalAmount)}</div>
                          <span style={{ ...s.statusBadge, ...STATUS_STYLES[o.status] }}>{o.status}</span>
                          {o.paymentId && <div style={s.paymentId}>Payment: {o.paymentId.slice(0, 16)}...</div>}
                        </div>
                      </div>
                      {o.items && o.items.length > 0 && (
                        <div style={s.orderItems}>
                          {o.items.map((item, i) => (
                            <div key={i} style={s.orderItemRow}>
                              <span>{item.productName} × {item.quantity}</span>
                              <span style={{ color: "#5c3310" }}>{fmtPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={s.orderActions}>
                        <span style={s.actionLabel}>Update:</span>
                        {["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map(st => (
                          <button key={st}
                            disabled={o.status === st}
                            style={o.status === st ? { ...s.statusBtn, opacity: 0.4 } : s.statusBtn}
                            onClick={() => updateOrderStatus(o.id, st)}>
                            {st.charAt(0) + st.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const s = {
  page: { display: "flex", minHeight: "100vh", background: "#fdf8f2", fontFamily: "'Georgia', serif" },
  sidebar: { width: "240px", background: "#1a1410", display: "flex", flexDirection: "column", padding: "32px 20px", flexShrink: 0 },
  sidebarTop: { marginBottom: "24px" },
  logoMark: { fontSize: "28px", color: "#f5d9a8", marginBottom: "8px" },
  brandName: { fontSize: "20px", color: "#fff", lineHeight: "1.2", fontWeight: "400" },
  adminCard: { background: "rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "24px", textAlign: "center" },
  avatar: { width: "48px", height: "48px", borderRadius: "50%", background: "#7c4a1e", color: "#fff", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontFamily: "'Trebuchet MS', sans-serif" },
  adminName: { fontSize: "15px", color: "#fff", marginBottom: "4px" },
  adminRole: { fontSize: "11px", color: "#f5d9a8", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "2px", textTransform: "uppercase" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "8px", border: "none", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", textAlign: "left" },
  navBtnActive: { background: "rgba(255,255,255,0.1)", color: "#fff" },
  navIcon: { fontSize: "14px", width: "20px", textAlign: "center" },
  backBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)", borderRadius: "8px", padding: "10px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", marginTop: "12px" },
  main: { flex: 1, padding: "40px", overflowY: "auto" },
  section: { maxWidth: "900px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  sectionTitle: { fontSize: "28px", fontWeight: "400", color: "#2c1a0e", marginBottom: "4px" },
  sectionSub: { fontSize: "14px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" },
  statCard: { background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e8d9c6" },
  statHighlight: { background: "#fdefd8", border: "1px solid #d9c9b0" },
  statLabel: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", textTransform: "uppercase", letterSpacing: "1px", color: "#8a6a52", marginBottom: "8px" },
  statValue: { fontSize: "28px", fontWeight: "400" },
  card: { background: "#fff", borderRadius: "14px", padding: "20px", border: "1px solid #e8d9c6", marginBottom: "20px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  cardTitle: { fontSize: "16px", fontWeight: "400", color: "#2c1a0e" },
  linkBtn: { background: "none", border: "none", color: "#a0622a", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", padding: 0 },
  tableHead: { display: "flex", gap: "12px", padding: "8px 12px", fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", textTransform: "uppercase", color: "#a08060", marginBottom: "4px" },
  tableRow: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#fff", borderRadius: "10px", border: "1px solid #e8d9c6", marginBottom: "8px" },
  tableCell: { flex: 1, fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#2c1a0e" },
  tableText: { fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#2c1a0e" },
  userAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#fdefd8", color: "#7c4a1e", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Trebuchet MS', sans-serif" },
  roleBadge: { fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", padding: "3px 10px", borderRadius: "12px" },
  roleCustomer: { background: "#e6f1fb", color: "#185fa5" },
  roleArtisan:  { background: "#faeeda", color: "#854f0b" },
  roleAdmin:    { background: "#fcebeb", color: "#a32d2d" },
  roleSelect: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fff", border: "1px solid #d9c9b0", borderRadius: "6px", padding: "4px 8px", color: "#6b4c35", cursor: "pointer" },
  statusBadge: { fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", padding: "3px 10px", borderRadius: "12px" },
  deleteBtn: { padding: "5px 12px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#c0392b", border: "1px solid #f5a5a5", borderRadius: "6px", cursor: "pointer" },
  searchInput: { width: "100%", maxWidth: "360px", padding: "10px 14px", fontSize: "14px", fontFamily: "'Georgia', serif", border: "1.5px solid #d9c9b0", borderRadius: "10px", background: "#fff", color: "#2c1a0e", outline: "none", marginBottom: "16px", boxSizing: "border-box" },
  productsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" },
  productCard: { background: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #e8d9c6" },
  productImg: { width: "100%", height: "150px", objectFit: "cover" },
  productBody: { padding: "14px" },
  productName: { fontSize: "15px", color: "#2c1a0e", marginBottom: "4px" },
  productArtisan: { fontSize: "12px", color: "#a0622a", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "12px" },
  productFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  productPrice: { fontSize: "16px", fontWeight: "600", color: "#5c3310" },
  orderCard: { background: "#fff", borderRadius: "12px", padding: "18px 20px", border: "1px solid #e8d9c6" },
  orderTop: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  orderId: { fontSize: "16px", color: "#2c1a0e", marginBottom: "3px" },
  orderDate: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "4px" },
  orderAddress: { fontSize: "12px", color: "#6b4c35", fontFamily: "'Trebuchet MS', sans-serif" },
  orderAmount: { fontSize: "18px", fontWeight: "600", color: "#5c3310", marginBottom: "6px" },
  paymentId: { fontSize: "11px", color: "#a08060", fontFamily: "monospace", marginTop: "4px" },
  orderItems: { background: "#fdf8f2", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" },
  orderItemRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", padding: "3px 0" },
  orderActions: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  actionLabel: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  statusBtn: { padding: "5px 12px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fff", color: "#6b4c35", border: "1px solid #d9c9b0", borderRadius: "20px", cursor: "pointer" },
  loadingWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" },
  loadingText: { fontSize: "14px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
};

export default AdminPanel;