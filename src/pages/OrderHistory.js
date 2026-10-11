import React, { useEffect, useState } from "react";
import api from "../Api";
import { Alert, EmptyState, Icon, Loading, StatusBadge, errorMessage, fmtDate, fmtPrice, titleCase } from "../components/ui";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
const STEP_LABELS = { PENDING: "Placed", CONFIRMED: "Confirmed", SHIPPED: "Shipped", DELIVERED: "Delivered" };
const FILTERS = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

// "DEMO-UPI-1700000000" → "UPI (demo)"; anything else came from Razorpay
const paymentLabel = (paymentId) => {
  const demo = /^DEMO-([A-Z]+)-/.exec(paymentId || "");
  if (!demo) return "Razorpay";
  return (demo[1] === "UPI" ? "UPI" : titleCase(demo[1])) + " (demo)";
};

export const OrderTracker = ({ status }) => {
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div className="tracker" aria-label={`Order status: ${titleCase(status)}`}>
      {STATUS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={"track-step" + (i < current ? " done" : i === current ? " current" : "")}>
            <span className="track-dot">{i <= current && <Icon name="check" size={12} strokeWidth={3} />}</span>
            {STEP_LABELS[s]}
          </div>
          {i < STATUS_STEPS.length - 1 && <div className={"track-line" + (i < current ? " done" : "")} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const OrderHistory = ({ user, onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.get(`/api/orders/user/${user.id}`)
      .then((res) => {
        setOrders(res.data || []);
        if (res.data?.length) setExpanded(res.data[0].id); // open the latest order
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load your orders.")))
      .finally(() => setLoading(false));
  }, [user.id]);

  const countFor = (f) => (f === "ALL" ? orders.length : orders.filter((o) => o.status === f).length);
  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="container container-narrow page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your orders</h1>
          <p className="page-sub">Track deliveries and revisit past purchases.</p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}><Icon name="store" size={16} /> Continue shopping</button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loading label="Loading your orders…" />
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState icon="package" title="No orders yet"
            text="When you buy something, you'll be able to track it here."
            action={<button className="btn btn-primary" onClick={onBack}>Start shopping <Icon name="arrowRight" size={16} /></button>} />
        </div>
      ) : (
        <>
          <div className="tabs" role="tablist">
            {FILTERS.filter((f) => f === "ALL" || countFor(f) > 0).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={"tab" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>
                {f === "ALL" ? "All" : titleCase(f)}<span className="tab-count">{countFor(f)}</span>
              </button>
            ))}
          </div>

          <div className="order-list">
            {filtered.map((order) => {
              const isOpen = expanded === order.id;
              const itemCount = (order.items || []).reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={order.id} className="card order-card">
                  <button className="order-head" onClick={() => setExpanded(isOpen ? null : order.id)} aria-expanded={isOpen}>
                    <span className="order-thumb"><Icon name="package" size={22} /></span>
                    <span className="order-meta">
                      <div className="order-id">Order #{order.id}</div>
                      <div className="order-sub">
                        {fmtDate(order.createdAt, true)} · {itemCount} {itemCount === 1 ? "item" : "items"}
                        {order.items?.[0] && ` · ${order.items[0].productName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`}
                      </div>
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="order-amount">{fmtPrice(order.totalAmount)}</span>
                    <Icon name="chevronDown" className={"chevron" + (isOpen ? " open" : "")} />
                  </button>

                  {order.status !== "CANCELLED" && <OrderTracker status={order.status} />}

                  {isOpen && (
                    <div className="order-details">
                      <div className="detail-grid">
                        <div className="detail-block">
                          <h4>Items</h4>
                          {(order.items || []).map((item, i) => (
                            <div key={i} className="item-row">
                              <span>{item.productName}<span className="qty-x">× {item.quantity}</span></span>
                              <span>{fmtPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <div className="item-total"><span>Total</span><span>{fmtPrice(order.totalAmount)}</span></div>
                        </div>
                        <div>
                          {order.shippingAddress && (
                            <div className="detail-block">
                              <h4>Shipping to</h4>
                              <p>{order.shippingAddress}</p>
                            </div>
                          )}
                          <div className="detail-block">
                            <h4>Payment</h4>
                            {order.paymentId ? (
                              <p>{paymentLabel(order.paymentId)}<br /><span className="mono">{order.paymentId}</span></p>
                            ) : (
                              <p>{order.status === "CANCELLED" ? "Not charged" : "Cash on delivery"}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {order.status === "SHIPPED" && (
                        <div className="note"><Icon name="truck" size={18} /> On its way — expected within 2–3 days.</div>
                      )}
                      {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                        <div className="note"><Icon name="clock" size={18} /> The artisan is preparing your order. Estimated delivery 5–8 business days.</div>
                      )}
                      {order.status === "DELIVERED" && (
                        <div className="note note-success"><Icon name="heart" size={18} /> Delivered. We hope you love your handcrafted piece!</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderHistory;
