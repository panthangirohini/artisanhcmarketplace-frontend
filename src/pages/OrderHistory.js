import React, { useEffect, useState } from "react";
import api from "../Api";

const STATUS_STYLES = {
  PENDING:   { bg: "#faeeda", color: "#854f0b" },
  CONFIRMED: { bg: "#e6f1fb", color: "#185fa5" },
  SHIPPED:   { bg: "#e1f5ee", color: "#0f6e56" },
  DELIVERED: { bg: "#eaf3de", color: "#3b6d11" },
  CANCELLED: { bg: "#fcebeb", color: "#a32d2d" },
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const OrderHistory = ({ user, onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.get(`/api/orders/user/${user.id}`)
      .then(res => setOrders(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);
  const fmtPrice = n => "₹" + Number(n).toLocaleString("en-IN");
  const fmtDate  = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backLink} onClick={onBack}>← Back to products</button>
        <h1 style={s.pageTitle}>My orders</h1>
        <p style={s.pageSub}>{orders.length} orders placed</p>
      </div>

      <div style={s.body}>
        {/* Filter tabs */}
        <div style={s.filterRow}>
          {["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map(f => (
            <button key={f} style={filter === f ? { ...s.filterBtn, ...s.filterBtnActive } : s.filterBtn}
              onClick={() => setFilter(f)}>
              {f === "ALL" ? "All orders" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading && (
          <div style={s.loadingWrap}>
            <p style={s.loadingText}>Loading your orders...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <p style={s.emptyText}>{filter === "ALL" ? "You haven't placed any orders yet." : `No ${filter.toLowerCase()} orders.`}</p>
            <button style={s.primaryBtn} onClick={onBack}>Start shopping</button>
          </div>
        )}

        <div style={s.ordersList}>
          {filtered.map(order => {
            const st = STATUS_STEPS.indexOf(order.status);
            const isExpanded = expanded === order.id;

            return (
              <div key={order.id} style={s.orderCard}>
                {/* Order header */}
                <div style={s.orderHeader} onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div style={s.orderMeta}>
                    <div style={s.orderId}>Order #{order.id}</div>
                    <div style={s.orderDate}>{fmtDate(order.createdAt)}</div>
                  </div>
                  <div style={s.orderHeaderRight}>
                    <span style={{ ...s.statusBadge, ...STATUS_STYLES[order.status] }}>{order.status}</span>
                    <div style={s.orderTotal}>{fmtPrice(order.totalAmount)}</div>
                    <span style={s.expandIcon}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Progress tracker */}
                {order.status !== "CANCELLED" && (
                  <div style={s.progressWrap}>
                    {STATUS_STEPS.map((step, i) => (
                      <React.Fragment key={step}>
                        <div style={s.progressStep}>
                          <div style={{ ...s.progressDot, ...(i <= st ? s.progressDotDone : s.progressDotPending) }}>
                            {i < st ? "✓" : i === st ? "●" : "○"}
                          </div>
                          <span style={{ ...s.progressLabel, color: i <= st ? "#7c4a1e" : "#b0a090" }}>
                            {step.charAt(0) + step.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div style={{ ...s.progressLine, background: i < st ? "#a0622a" : "#e8d9c6" }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div style={s.orderDetails}>
                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Items ordered</div>
                        {order.items.map((item, i) => (
                          <div key={i} style={s.orderItemRow}>
                            <div style={s.orderItemInfo}>
                              <span style={s.orderItemName}>{item.productName}</span>
                              <span style={s.orderItemQty}>× {item.quantity}</span>
                            </div>
                            <span style={s.orderItemPrice}>{fmtPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div style={s.orderItemTotal}>
                          <span>Total paid</span>
                          <span style={{ fontWeight: "600", color: "#5c3310" }}>{fmtPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Shipping address */}
                    {order.shippingAddress && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Shipping address</div>
                        <div style={s.detailText}>{order.shippingAddress}</div>
                      </div>
                    )}

                    {/* Payment info */}
                    {order.paymentId && (
                      <div style={s.detailSection}>
                        <div style={s.detailSectionTitle}>Payment</div>
                        <div style={s.paymentIdRow}>
                          <span style={s.detailLabel}>Payment ID</span>
                          <span style={s.paymentIdValue}>{order.paymentId}</span>
                        </div>
                        <div style={s.paymentIdRow}>
                          <span style={s.detailLabel}>Method</span>
                          <span style={s.detailText}>Razorpay</span>
                        </div>
                      </div>
                    )}

                    {/* Estimated delivery */}
                    {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                      <div style={s.deliveryNote}>
                        🚚 {order.status === "SHIPPED"
                          ? "Your order is on its way! Expected in 2–3 days."
                          : "Estimated delivery: 5–8 business days after confirmation."}
                      </div>
                    )}

                    {order.status === "DELIVERED" && (
                      <div style={{ ...s.deliveryNote, background: "#eaf3de", color: "#27500a" }}>
                        ✓ Order delivered. We hope you love your handcrafted item!
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: "100vh", background: "#fdf8f2", fontFamily: "'Georgia', serif" },
  header: { background: "#fff", borderBottom: "1px solid #e8d9c6", padding: "24px 40px" },
  backLink: { background: "none", border: "none", color: "#a0622a", fontSize: "14px", cursor: "pointer", fontFamily: "'Trebuchet MS', sans-serif", padding: 0, marginBottom: "12px", display: "block" },
  pageTitle: { fontSize: "28px", fontWeight: "400", color: "#2c1a0e", marginBottom: "4px" },
  pageSub: { fontSize: "14px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif" },
  body: { padding: "28px 40px 60px", maxWidth: "860px" },
  filterRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" },
  filterBtn: { padding: "7px 16px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fff", color: "#6b4c35", border: "1px solid #d9c9b0", borderRadius: "20px", cursor: "pointer" },
  filterBtnActive: { background: "#fdefd8", color: "#7c4a1e", borderColor: "#a0622a" },
  loadingWrap: { textAlign: "center", padding: "60px" },
  loadingText: { fontSize: "14px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  emptyState: { textAlign: "center", padding: "60px", background: "#fff", borderRadius: "14px", border: "1px solid #e8d9c6" },
  emptyText: { fontSize: "15px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "20px" },
  ordersList: { display: "flex", flexDirection: "column", gap: "16px" },
  orderCard: { background: "#fff", borderRadius: "14px", border: "1px solid #e8d9c6", overflow: "hidden" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", cursor: "pointer" },
  orderMeta: {},
  orderId: { fontSize: "16px", color: "#2c1a0e", marginBottom: "3px" },
  orderDate: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  orderHeaderRight: { display: "flex", alignItems: "center", gap: "14px" },
  statusBadge: { fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", padding: "4px 10px", borderRadius: "20px", fontWeight: "500" },
  orderTotal: { fontSize: "18px", fontWeight: "600", color: "#5c3310" },
  expandIcon: { fontSize: "10px", color: "#a08060" },
  progressWrap: { display: "flex", alignItems: "center", padding: "0 20px 16px" },
  progressStep: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  progressDot: { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif" },
  progressDotDone: { background: "#fdefd8", color: "#7c4a1e", border: "1.5px solid #a0622a" },
  progressDotPending: { background: "#f0e8dc", color: "#b0a090" },
  progressLabel: { fontSize: "10px", fontFamily: "'Trebuchet MS', sans-serif", whiteSpace: "nowrap" },
  progressLine: { flex: 1, height: "1.5px", margin: "0 4px", marginTop: "-12px" },
  orderDetails: { padding: "0 20px 20px", borderTop: "1px solid #f0e4d0" },
  detailSection: { paddingTop: "16px", marginBottom: "4px" },
  detailSectionTitle: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", textTransform: "uppercase", color: "#a08060", marginBottom: "10px" },
  orderItemRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0e4d0" },
  orderItemInfo: { display: "flex", alignItems: "center", gap: "12px" },
  orderItemName: { fontSize: "14px", color: "#2c1a0e" },
  orderItemQty: { fontSize: "13px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  orderItemPrice: { fontSize: "14px", color: "#5c3310", fontFamily: "'Trebuchet MS', sans-serif" },
  orderItemTotal: { display: "flex", justifyContent: "space-between", paddingTop: "12px", fontSize: "15px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" },
  detailText: { fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", lineHeight: "1.6" },
  detailLabel: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  paymentIdRow: { display: "flex", gap: "12px", marginBottom: "6px", alignItems: "center" },
  paymentIdValue: { fontSize: "12px", fontFamily: "monospace", color: "#2c1a0e", background: "#f0e8dc", padding: "3px 8px", borderRadius: "4px" },
  deliveryNote: { background: "#fdefd8", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", marginTop: "12px" },
  primaryBtn: { padding: "12px 24px", fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", background: "#7c4a1e", color: "#fdf8f2", border: "none", borderRadius: "10px", cursor: "pointer" },
};

export default OrderHistory;