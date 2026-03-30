import React, { useEffect, useState } from "react";
import api from "../Api";
import {
  Button, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle
} from "@mui/material";

const STATUS_COLORS = {
  PENDING:   { bg: "#faeeda", color: "#854f0b" },
  CONFIRMED: { bg: "#e6f1fb", color: "#185fa5" },
  SHIPPED:   { bg: "#e1f5ee", color: "#0f6e56" },
  DELIVERED: { bg: "#eaf3de", color: "#3b6d11" },
  CANCELLED: { bg: "#fcebeb", color: "#a32d2d" },
};

const ArtisanDashboard = ({ user, onBack }) => {
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product dialog state
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: "", description: "", price: "", artisanName: user?.name || "", imageUrl: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        api.get("/api/products"),
        api.get(`/api/orders/user/${user.id}`),
      ]);
      // Only show this artisan's own products
      const myProducts = prodRes.data.filter(
        (p) => p.artisanName?.toLowerCase() === user.name?.toLowerCase()
      );
      setProducts(myProducts);
      setOrders(ordRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalRevenue = orders
    .filter((o) => o.status === "CONFIRMED" || o.status === "DELIVERED" || o.status === "SHIPPED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageName = currentProduct.imageUrl || "";
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const res = await api.post("/api/products/upload", formData);
        imageName = res.data;
      }
      const payload = { ...currentProduct, imageUrl: imageName, artisanName: user.name };
      if (editMode) {
        await api.put(`/api/products/${currentProduct.id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      setOpen(false);
      setCurrentProduct({ name: "", description: "", price: "", artisanName: user.name, imageUrl: "" });
      setEditMode(false);
      setSelectedFile(null);
      fetchAll();
    } catch (err) {
      alert("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/products/${id}`);
    setDeleteConfirm(null);
    fetchAll();
  };

  const handleUpdateStatus = async (orderId, status) => {
    await api.put(`/api/orders/${orderId}/status?status=${status}`);
    fetchAll();
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setEditMode(true);
    } else {
      setCurrentProduct({ name: "", description: "", price: "", artisanName: user.name, imageUrl: "" });
      setEditMode(false);
    }
    setSelectedFile(null);
    setOpen(true);
  };

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logoMark}>✦</div>
          <div style={s.brandName}>Artisan<br />Dashboard</div>
        </div>

        <div style={s.artisanCard}>
          <div style={s.avatar}>
            {(user.name || "A").charAt(0).toUpperCase()}
          </div>
          <div style={s.artisanName}>{user.name}</div>
          <div style={s.artisanRole}>Artisan</div>
        </div>

        <nav style={s.nav}>
          {[
            { id: "overview", label: "Overview",  icon: "◈" },
            { id: "products", label: "My Products", icon: "◉" },
            { id: "orders",   label: "Orders",     icon: "◎" },
          ].map((item) => (
            <button
              key={item.id}
              style={tab === item.id ? { ...s.navBtn, ...s.navBtnActive } : s.navBtn}
              onClick={() => setTab(item.id)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button style={s.backBtn} onClick={onBack}>
          ← Back to marketplace
        </button>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.loadingDots}>
              <span style={{ ...s.dot, animationDelay: "0s" }} />
              <span style={{ ...s.dot, animationDelay: "0.2s" }} />
              <span style={{ ...s.dot, animationDelay: "0.4s" }} />
            </div>
            <p style={s.loadingText}>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>Overview</h2>
                  <p style={s.sectionSub}>Your craft business at a glance</p>
                </div>

                <div style={s.statsGrid}>
                  <div style={s.statCard}>
                    <div style={s.statLabel}>Total products</div>
                    <div style={s.statValue}>{products.length}</div>
                    <div style={s.statFooter}>listed on marketplace</div>
                  </div>
                  <div style={s.statCard}>
                    <div style={s.statLabel}>Total orders</div>
                    <div style={s.statValue}>{orders.length}</div>
                    <div style={s.statFooter}>all time</div>
                  </div>
                  <div style={s.statCard}>
                    <div style={s.statLabel}>Pending orders</div>
                    <div style={{ ...s.statValue, color: "#854f0b" }}>{pendingOrders}</div>
                    <div style={s.statFooter}>awaiting action</div>
                  </div>
                  <div style={{ ...s.statCard, ...s.statCardHighlight }}>
                    <div style={{ ...s.statLabel, color: "#5c3310" }}>Total revenue</div>
                    <div style={{ ...s.statValue, color: "#5c3310" }}>
                      ₹{Number(totalRevenue).toLocaleString("en-IN")}
                    </div>
                    <div style={{ ...s.statFooter, color: "#a0622a" }}>confirmed + delivered</div>
                  </div>
                </div>

                {/* Recent orders preview */}
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>Recent orders</h3>
                    <button style={s.linkBtn} onClick={() => setTab("orders")}>View all →</button>
                  </div>
                  {orders.length === 0 ? (
                    <p style={s.emptyText}>No orders yet. Once customers buy your products, they'll appear here.</p>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <div key={order.id} style={s.orderRow}>
                        <div>
                          <div style={s.orderId}>Order #{order.id}</div>
                          <div style={s.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        <div style={s.orderAmount}>₹{Number(order.totalAmount).toLocaleString("en-IN")}</div>
                        <span style={{ ...s.statusBadge, ...STATUS_COLORS[order.status] }}>
                          {order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Products preview */}
                <div style={s.card}>
                  <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>Your products</h3>
                    <button style={s.linkBtn} onClick={() => setTab("products")}>Manage all →</button>
                  </div>
                  {products.length === 0 ? (
                    <p style={s.emptyText}>You haven't listed any products yet.</p>
                  ) : (
                    <div style={s.productsMini}>
                      {products.slice(0, 4).map((p) => (
                        <div key={p.id} style={s.productMiniCard}>
                          <img
                            src={p.imageUrl ? `http://localhost:8080/uploads/${p.imageUrl}` : "https://via.placeholder.com/80/f5ead8/a0622a?text=✦"}
                            alt={p.name}
                            style={s.productMiniImg}
                          />
                          <div style={s.productMiniName}>{p.name}</div>
                          <div style={s.productMiniPrice}>₹{Number(p.price).toLocaleString("en-IN")}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <div>
                    <h2 style={s.sectionTitle}>My products</h2>
                    <p style={s.sectionSub}>{products.length} products listed</p>
                  </div>
                  <button style={s.primaryBtn} onClick={() => handleOpenDialog()}>+ Add product</button>
                </div>

                {products.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏺</div>
                    <p style={s.emptyStateText}>You haven't listed any products yet.</p>
                    <button style={s.primaryBtn} onClick={() => handleOpenDialog()}>Add your first product</button>
                  </div>
                ) : (
                  <div style={s.productsGrid}>
                    {products.map((p) => (
                      <div key={p.id} style={s.productCard}>
                        <img
                          src={p.imageUrl ? `http://localhost:8080/uploads/${p.imageUrl}` : "https://via.placeholder.com/300x180/f5ead8/a0622a?text=✦"}
                          alt={p.name}
                          style={s.productCardImg}
                        />
                        <div style={s.productCardBody}>
                          <div style={s.productCardName}>{p.name}</div>
                          <div style={s.productCardDesc}>{p.description}</div>
                          <div style={s.productCardFooter}>
                            <span style={s.productCardPrice}>₹{Number(p.price).toLocaleString("en-IN")}</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button style={s.editBtn} onClick={() => handleOpenDialog(p)}>Edit</button>
                              <button style={s.deleteBtn} onClick={() => setDeleteConfirm(p.id)}>Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <div>
                    <h2 style={s.sectionTitle}>Orders</h2>
                    <p style={s.sectionSub}>{orders.length} total orders</p>
                  </div>
                  <div style={s.orderStats}>
                    <span style={{ ...s.statusBadge, ...STATUS_COLORS.PENDING }}>{pendingOrders} pending</span>
                    <span style={{ ...s.statusBadge, ...STATUS_COLORS.DELIVERED }}>{deliveredOrders} delivered</span>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
                    <p style={s.emptyStateText}>No orders yet. Orders from customers will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {orders.map((order) => (
                      <div key={order.id} style={s.orderCard}>
                        <div style={s.orderCardTop}>
                          <div>
                            <div style={s.orderCardId}>Order #{order.id}</div>
                            <div style={s.orderCardDate}>
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={s.orderCardAmount}>₹{Number(order.totalAmount).toLocaleString("en-IN")}</div>
                            <span style={{ ...s.statusBadge, ...STATUS_COLORS[order.status] }}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {order.shippingAddress && (
                          <div style={s.orderCardAddress}>
                            📍 {order.shippingAddress}
                          </div>
                        )}

                        {order.items && order.items.length > 0 && (
                          <div style={s.orderItems}>
                            {order.items.map((item, i) => (
                              <div key={i} style={s.orderItemRow}>
                                <span style={s.orderItemName}>{item.productName}</span>
                                <span style={s.orderItemQty}>× {item.quantity}</span>
                                <span style={s.orderItemPrice}>₹{Number(item.price * item.quantity).toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Status update actions */}
                        <div style={s.orderActions}>
                          <span style={s.orderActionsLabel}>Update status:</span>
                          {["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
                            <button
                              key={st}
                              disabled={order.status === st}
                              style={order.status === st ? { ...s.statusBtn, opacity: 0.4, cursor: "not-allowed" } : s.statusBtn}
                              onClick={() => handleUpdateStatus(order.id, st)}
                            >
                              {st.charAt(0) + st.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        PaperProps={{ style: { borderRadius: "16px", fontFamily: "'Georgia', serif", padding: "8px" } }}>
        <DialogTitle style={{ fontFamily: "'Georgia', serif", color: "#2c1a0e" }}>Delete product?</DialogTitle>
        <DialogContent>
          <p style={{ fontFamily: "'Trebuchet MS', sans-serif", fontSize: "14px", color: "#6b4c35" }}>
            This cannot be undone. The product will be removed from the marketplace.
          </p>
        </DialogContent>
        <DialogActions style={{ padding: "16px" }}>
          <Button onClick={() => setDeleteConfirm(null)}
            style={{ fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={() => handleDelete(deleteConfirm)} variant="contained"
            style={{ background: "#c0392b", fontFamily: "'Trebuchet MS', sans-serif", textTransform: "none", borderRadius: "8px" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit product dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ style: { borderRadius: "16px", fontFamily: "'Georgia', serif" } }}>
        <DialogTitle style={{ fontFamily: "'Georgia', serif", fontSize: "22px", color: "#2c1a0e", paddingBottom: "4px" }}>
          {editMode ? "Edit product" : "Add new product"}
        </DialogTitle>
        <DialogContent style={{ paddingTop: "16px" }}>
          {[
            { label: "Product name", key: "name", placeholder: "e.g. Handwoven Silk Scarf" },
            { label: "Description", key: "description", placeholder: "Describe this handcraft...", multiline: true },
            { label: "Price (₹)", key: "price", placeholder: "e.g. 1499", type: "number" },
          ].map((field) => (
            <TextField key={field.key} label={field.label} fullWidth margin="dense"
              type={field.type || "text"} multiline={field.multiline} rows={field.multiline ? 3 : 1}
              placeholder={field.placeholder} value={currentProduct[field.key] || ""}
              onChange={(e) => setCurrentProduct({ ...currentProduct, [field.key]: e.target.value })}
              sx={{ mb: 1,
                "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "'Georgia', serif",
                  "& fieldset": { borderColor: "#d9c9b0" },
                  "&:hover fieldset": { borderColor: "#a0622a" },
                  "&.Mui-focused fieldset": { borderColor: "#7c4a1e" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#7c4a1e" },
              }}
            />
          ))}
          <TextField label="Image URL (optional)" fullWidth margin="dense"
            value={currentProduct.imageUrl || ""}
            onChange={(e) => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
            sx={{ mb: 1,
              "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "'Georgia', serif",
                "& fieldset": { borderColor: "#d9c9b0" },
                "&:hover fieldset": { borderColor: "#a0622a" },
                "&.Mui-focused fieldset": { borderColor: "#7c4a1e" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#7c4a1e" },
            }}
          />
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ display: "inline-block", padding: "9px 18px", fontSize: "13px",
              fontFamily: "'Trebuchet MS', sans-serif", background: "#fdefd8", color: "#7c4a1e",
              border: "1px dashed #a0622a", borderRadius: "8px", cursor: "pointer" }}>
              Upload image
              <input type="file" accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ display: "none" }} />
            </label>
            {selectedFile && (
              <span style={{ fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" }}>
                {selectedFile.name}
              </span>
            )}
          </div>
        </DialogContent>
        <DialogActions style={{ padding: "16px 24px" }}>
          <Button onClick={() => setOpen(false)}
            style={{ fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained"
            style={{ background: "#7c4a1e", fontFamily: "'Trebuchet MS', sans-serif", textTransform: "none", borderRadius: "10px", padding: "8px 24px" }}>
            {saving ? "Saving..." : editMode ? "Update" : "Add product"}
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const s = {
  page: { display: "flex", minHeight: "100vh", background: "#fdf8f2", fontFamily: "'Georgia', serif" },

  // Sidebar
  sidebar: { width: "240px", background: "#2c1a0e", display: "flex", flexDirection: "column", padding: "32px 20px", flexShrink: 0 },
  sidebarTop: { marginBottom: "28px" },
  logoMark: { fontSize: "24px", color: "#f5d9a8", marginBottom: "8px" },
  brandName: { fontSize: "20px", color: "#fff", lineHeight: "1.2", fontWeight: "400" },
  artisanCard: { background: "rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "28px", textAlign: "center" },
  avatar: { width: "48px", height: "48px", borderRadius: "50%", background: "#a0622a", color: "#fff", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontFamily: "'Trebuchet MS', sans-serif" },
  artisanName: { fontSize: "15px", color: "#fff", marginBottom: "4px" },
  artisanRole: { fontSize: "11px", color: "#f5d9a8", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "2px", textTransform: "uppercase" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "8px", border: "none", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", textAlign: "left", transition: "all 0.15s" },
  navBtnActive: { background: "rgba(255,255,255,0.12)", color: "#fff" },
  navIcon: { fontSize: "16px", width: "20px", textAlign: "center" },
  backBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: "8px", padding: "10px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", marginTop: "12px" },

  // Main
  main: { flex: 1, padding: "40px", overflowY: "auto" },
  section: { maxWidth: "900px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" },
  sectionTitle: { fontSize: "28px", fontWeight: "400", color: "#2c1a0e", marginBottom: "4px" },
  sectionSub: { fontSize: "14px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif" },

  // Stats
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" },
  statCard: { background: "#fff", borderRadius: "14px", padding: "20px", border: "1px solid #e8d9c6" },
  statCardHighlight: { background: "#fdefd8", border: "1px solid #d9c9b0" },
  statLabel: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", textTransform: "uppercase", color: "#8a6a52", marginBottom: "8px" },
  statValue: { fontSize: "32px", fontWeight: "400", color: "#2c1a0e", lineHeight: "1", marginBottom: "8px" },
  statFooter: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", color: "#a08060" },

  // Cards
  card: { background: "#fff", borderRadius: "14px", padding: "24px", border: "1px solid #e8d9c6", marginBottom: "20px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
  cardTitle: { fontSize: "17px", fontWeight: "400", color: "#2c1a0e" },
  linkBtn: { background: "none", border: "none", color: "#a0622a", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", padding: 0 },

  // Order rows (overview)
  orderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0e4d0" },
  orderId: { fontSize: "14px", color: "#2c1a0e", marginBottom: "2px" },
  orderDate: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  orderAmount: { fontSize: "15px", fontWeight: "600", color: "#5c3310", minWidth: "80px", textAlign: "center" },
  statusBadge: { fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", padding: "4px 10px", borderRadius: "20px", fontWeight: "500", letterSpacing: "0.5px" },

  // Mini products (overview)
  productsMini: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" },
  productMiniCard: { textAlign: "center" },
  productMiniImg: { width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "6px" },
  productMiniName: { fontSize: "12px", color: "#2c1a0e", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  productMiniPrice: { fontSize: "12px", color: "#a0622a", fontFamily: "'Trebuchet MS', sans-serif" },

  // Products grid
  productsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  productCard: { background: "#fff", borderRadius: "14px", overflow: "hidden", border: "1px solid #e8d9c6" },
  productCardImg: { width: "100%", height: "160px", objectFit: "cover" },
  productCardBody: { padding: "16px" },
  productCardName: { fontSize: "16px", color: "#2c1a0e", marginBottom: "6px" },
  productCardDesc: { fontSize: "13px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", lineHeight: "1.5", marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  productCardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0e4d0", paddingTop: "12px" },
  productCardPrice: { fontSize: "18px", fontWeight: "600", color: "#5c3310" },
  editBtn: { padding: "6px 14px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#7c4a1e", border: "1px solid #d9c9b0", borderRadius: "8px", cursor: "pointer" },
  deleteBtn: { padding: "6px 14px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#c0392b", border: "1px solid #f5a5a5", borderRadius: "8px", cursor: "pointer" },

  // Order cards (orders tab)
  orderCard: { background: "#fff", borderRadius: "14px", padding: "20px 24px", border: "1px solid #e8d9c6" },
  orderCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  orderCardId: { fontSize: "16px", color: "#2c1a0e", marginBottom: "4px" },
  orderCardDate: { fontSize: "13px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  orderCardAmount: { fontSize: "20px", fontWeight: "600", color: "#5c3310", marginBottom: "6px" },
  orderCardAddress: { fontSize: "13px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "14px", lineHeight: "1.5" },
  orderItems: { background: "#fdf8f2", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" },
  orderItemRow: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif" },
  orderItemName: { color: "#2c1a0e", flex: 1 },
  orderItemQty: { color: "#a08060", margin: "0 16px" },
  orderItemPrice: { color: "#5c3310", fontWeight: "600" },
  orderActions: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  orderActionsLabel: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  statusBtn: { padding: "5px 12px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fff", color: "#6b4c35", border: "1px solid #d9c9b0", borderRadius: "20px", cursor: "pointer" },
  orderStats: { display: "flex", gap: "8px" },

  // Empty states
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "14px", border: "1px solid #e8d9c6" },
  emptyStateText: { fontSize: "15px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "20px" },
  emptyText: { fontSize: "14px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif", textAlign: "center", padding: "20px 0" },

  // Buttons
  primaryBtn: { padding: "12px 22px", fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", background: "#7c4a1e", color: "#fdf8f2", border: "none", borderRadius: "10px", cursor: "pointer" },

  // Loading
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" },
  loadingDots: { display: "flex", gap: "8px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", background: "#a0622a", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out" },
  loadingText: { fontSize: "14px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
};

export default ArtisanDashboard;