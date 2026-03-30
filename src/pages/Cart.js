import React, { useState } from "react";
import api from "../Api";

const STEPS = ["Cart", "Address", "Review", "Payment", "Order Confirmed"];

const StepBar = ({ current }) => (
  <div style={s.stepBar}>
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div style={s.stepItem}>
          <div style={{ ...s.stepCircle, ...(i < current ? s.stepDone : i === current ? s.stepActive : s.stepPending) }}>
            {i < current ? "✓" : i + 1}
          </div>
          <span style={{ ...s.stepLabel, color: i === current ? "#2c1a0e" : i < current ? "#a0622a" : "#b0a090" }}>{label}</span>
        </div>
        {i < STEPS.length - 1 && <div style={{ ...s.stepLine, background: i < current ? "#a0622a" : "#e8d9c6" }} />}
      </React.Fragment>
    ))}
  </div>
);

const Cart = ({ cart, setCart, user, onBack, onGoToOrders }) => {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ fullName: user?.name || "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentError, setPaymentError] = useState("");

  const updateQty = (id, delta) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping  = subtotal > 999 ? 0 : 79;
  const total     = subtotal + shipping;
  const fmtPrice  = (n) => "₹" + Number(n).toLocaleString("en-IN");

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!/^\d{10}$/.test(address.phone)) e.phone = "Enter valid 10-digit number";
    if (!address.line1.trim()) e.line1 = "Required";
    if (!address.city.trim()) e.city = "Required";
    if (!address.state.trim()) e.state = "Required";
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = "Enter valid 6-digit PIN";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Demo mode: place order directly without payment gateway
  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      setPaymentError("Your cart is empty. Add items before placing an order.");
      return;
    }
    setPlacing(true);
    setPaymentError("");
    try {
      const shippingAddress = `${address.fullName}, ${address.phone}, ${address.line1}${address.line2 ? ", " + address.line2 : ""}, ${address.city}, ${address.state} - ${address.pincode}`;

      const orderRes = await api.post("/api/orders", {
        userId: user.id,
        totalAmount: total,
        shippingAddress,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      setPlacedOrder({ ...orderRes.data, paymentId: "DEMO-" + Date.now() });
      setCart([]);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      const fallback = err.message || "Order placement failed. Please try again.";
      setPaymentError(serverMessage || fallback);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backLink} onClick={step > 0 && step < 4 ? () => setStep(step - 1) : onBack}>
          ← {step > 0 && step < 4 ? "Back" : "Back to products"}
        </button>
        <h1 style={s.pageTitle}>Checkout</h1>
        <StepBar current={step} />
      </div>

      <div style={s.body}>

        {/* STEP 0 — CART */}
        {step === 0 && (
          <div style={s.layout}>
            <div style={s.leftCol}>
              <h2 style={s.colTitle}>Your cart ({cart.length} items)</h2>
              {cart.length === 0 ? (
                <div style={s.emptyCart}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛍</div>
                  <p style={s.emptyText}>Your cart is empty</p>
                  <button style={s.primaryBtn} onClick={onBack}>Browse products</button>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={s.cartItem}>
                  <img src={item.imageUrl ? `http://localhost:8080/uploads/${item.imageUrl}` : "https://via.placeholder.com/80/f5ead8/a0622a?text=✦"} alt={item.name} style={s.itemImg} />
                  <div style={s.itemInfo}>
                    <div style={s.itemName}>{item.name}</div>
                    <div style={s.itemArtisan}>by {item.artisanName}</div>
                    <div style={s.itemUnitPrice}>{fmtPrice(item.price)} each</div>
                  </div>
                  <div style={s.qtyRow}>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                    <span style={s.qtyNum}>{item.quantity}</span>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <div style={s.itemLineTotal}>{fmtPrice(item.price * item.quantity)}</div>
                  <button style={s.removeBtn} onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={s.rightCol}>
                <OrderSummary subtotal={subtotal} shipping={shipping} total={total} fmtPrice={fmtPrice} />
                <button style={s.primaryBtn} onClick={() => { setStep(1); window.scrollTo(0,0); }}>Continue to address →</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 1 — ADDRESS */}
        {step === 1 && (
          <div style={s.layout}>
            <div style={s.leftCol}>
              <h2 style={s.colTitle}>Shipping address</h2>
              <div style={s.formGrid}>
                <Field label="Full name" required error={errors.fullName}>
                  <input style={errors.fullName ? { ...s.input, borderColor: "#e24b4a" } : s.input} placeholder="As on ID" value={address.fullName}
                    onChange={e => setAddress({ ...address, fullName: e.target.value })}
                    onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
                </Field>
                <Field label="Phone" required error={errors.phone}>
                  <input style={errors.phone ? { ...s.input, borderColor: "#e24b4a" } : s.input} placeholder="10-digit mobile" value={address.phone} maxLength={10}
                    onChange={e => setAddress({ ...address, phone: e.target.value.replace(/\D/,"") })}
                    onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
                </Field>
              </div>
              <Field label="Address line 1" required error={errors.line1}>
                <input style={errors.line1 ? { ...s.input, borderColor: "#e24b4a" } : s.input} placeholder="House/Flat, Street, Area" value={address.line1}
                  onChange={e => setAddress({ ...address, line1: e.target.value })}
                  onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
              </Field>
              <Field label="Address line 2 (optional)">
                <input style={s.input} placeholder="Landmark, Building (optional)" value={address.line2}
                  onChange={e => setAddress({ ...address, line2: e.target.value })}
                  onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
              </Field>
              <div style={s.formGrid}>
                <Field label="City" required error={errors.city}>
                  <input style={errors.city ? { ...s.input, borderColor: "#e24b4a" } : s.input} placeholder="City" value={address.city}
                    onChange={e => setAddress({ ...address, city: e.target.value })}
                    onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
                </Field>
                <Field label="State" required error={errors.state}>
                  <input style={errors.state ? { ...s.input, borderColor: "#e24b4a" } : s.input} placeholder="State" value={address.state}
                    onChange={e => setAddress({ ...address, state: e.target.value })}
                    onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
                </Field>
                <Field label="PIN code" required error={errors.pincode}>
                  <input style={errors.pincode ? { ...s.input, borderColor: "#e24b4a" } : s.input} placeholder="6-digit PIN" value={address.pincode} maxLength={6}
                    onChange={e => setAddress({ ...address, pincode: e.target.value.replace(/\D/,"") })}
                    onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0", boxShadow: "none" })} />
                </Field>
              </div>
            </div>
            <div style={s.rightCol}>
              <OrderSummary subtotal={subtotal} shipping={shipping} total={total} fmtPrice={fmtPrice} />
              <button style={s.primaryBtn} onClick={() => { if (validateAddress()) { setStep(2); window.scrollTo(0,0); } }}>Review order →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — REVIEW */}
        {step === 2 && (
          <div style={s.layout}>
            <div style={s.leftCol}>
              <h2 style={s.colTitle}>Review your order</h2>
              <div style={s.reviewSection}>
                <div style={s.reviewSectionHeader}><span style={s.reviewSectionTitle}>Items</span><button style={s.editLink} onClick={() => setStep(0)}>Edit</button></div>
                {cart.map(item => (
                  <div key={item.id} style={s.reviewItem}>
                    <img src={item.imageUrl ? `http://localhost:8080/uploads/${item.imageUrl}` : "https://via.placeholder.com/56/f5ead8/a0622a?text=✦"} alt={item.name} style={s.reviewItemImg} />
                    <div style={{ flex: 1 }}>
                      <div style={s.reviewItemName}>{item.name}</div>
                      <div style={s.reviewItemMeta}>by {item.artisanName} · qty {item.quantity}</div>
                    </div>
                    <div style={s.reviewItemPrice}>{fmtPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div style={s.reviewSection}>
                <div style={s.reviewSectionHeader}><span style={s.reviewSectionTitle}>Shipping address</span><button style={s.editLink} onClick={() => setStep(1)}>Edit</button></div>
                <div style={s.reviewAddress}>
                  <div style={s.reviewAddressName}>{address.fullName}</div>
                  <div style={s.reviewAddressText}>{address.phone}</div>
                  <div style={s.reviewAddressText}>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</div>
                  <div style={s.reviewAddressText}>{address.city}, {address.state} – {address.pincode}</div>
                </div>
              </div>
              <div style={s.deliveryNote}>🚚 Estimated delivery: <strong>5–8 business days</strong></div>
            </div>
            <div style={s.rightCol}>
              <OrderSummary subtotal={subtotal} shipping={shipping} total={total} fmtPrice={fmtPrice} />
              <button style={s.primaryBtn} onClick={() => { setStep(3); window.scrollTo(0,0); }}>Proceed to payment →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — PAYMENT (demo mode) */}
        {step === 3 && (
          <div style={s.layout}>
            <div style={s.leftCol}>
              <h2 style={s.colTitle}>Payment</h2>
              <div style={s.paymentCard}>
                <div style={s.demoHeader}>
                  <span style={s.demoBadge}>🎓 Demo mode</span>
                  <span style={s.demoSecure}>🔒 Order secured</span>
                </div>
                <p style={s.demoNote}>
                  This is a demo checkout. Click "Confirm order" to place your order directly — no real payment required.
                  In production, this step would connect to a payment gateway like Razorpay.
                </p>
                <div style={s.demoFeatures}>
                  {["Order saved to database", "Email confirmation sent", "Artisan notified", "Track in My Orders"].map(f => (
                    <div key={f} style={s.demoFeatureRow}>
                      <span style={s.demoCheck}>✓</span>
                      <span style={s.demoFeatureText}>{f}</span>
                    </div>
                  ))}
                </div>
                {paymentError && <div style={s.paymentError}>{paymentError}</div>}
              </div>
              <div style={s.reviewSection}>
                <div style={s.reviewSectionHeader}>
                  <span style={s.reviewSectionTitle}>Shipping to</span>
                  <button style={s.editLink} onClick={() => setStep(1)}>Edit</button>
                </div>
                <div style={s.reviewAddressText}>{address.fullName}, {address.line1}, {address.city} – {address.pincode}</div>
              </div>
            </div>
            <div style={s.rightCol}>
              <OrderSummary subtotal={subtotal} shipping={shipping} total={total} fmtPrice={fmtPrice} />
              <button
                style={placing ? { ...s.primaryBtn, opacity: 0.7, cursor: "not-allowed" } : s.primaryBtn}
                onClick={handleConfirmOrder}
                disabled={placing}>
                {placing ? "Placing order..." : `Confirm order ${fmtPrice(total)} →`}
              </button>
              <p style={s.disclaimer}>Your order details are saved securely.</p>
            </div>
          </div>
        )}

        {/* STEP 4 — CONFIRMED */}
        {step === 4 && placedOrder && (
          <div style={s.confirmWrap}>
            <div style={s.confirmCard}>
              <div style={s.confirmIcon}>✦</div>
              <h2 style={s.confirmTitle}>Order confirmed!</h2>
              <p style={s.confirmSub}>Thank you for supporting Indian artisans. Your order has been placed successfully.</p>
              <div style={s.confirmOrderId}>Order #{placedOrder.id}</div>
              <div style={s.confirmDetails}>
                <div style={s.confirmRow}><span style={s.confirmLabel}>Amount</span><span style={s.confirmValue}>{fmtPrice(placedOrder.totalAmount)}</span></div>
                <div style={s.confirmRow}><span style={s.confirmLabel}>Status</span><span style={{ ...s.confirmValue, ...s.statusBadge }}>CONFIRMED</span></div>
                <div style={s.confirmRow}><span style={s.confirmLabel}>Estimated delivery</span><span style={s.confirmValue}>5–8 business days</span></div>
                <div style={{ ...s.confirmRow, alignItems: "flex-start" }}>
                  <span style={s.confirmLabel}>Shipping to</span>
                  <span style={{ ...s.confirmValue, textAlign: "right", maxWidth: "200px", lineHeight: "1.5" }}>{placedOrder.shippingAddress}</span>
                </div>
              </div>
              <div style={s.nextSteps}>
                <div style={s.nextStepTitle}>What happens next</div>
                {[
                  { icon: "📧", text: "Email confirmation sent to " + user.email },
                  { icon: "🎨", text: "Artisan will prepare your handcrafted item" },
                  { icon: "📦", text: "Shipped within 2–3 business days" },
                  { icon: "🚚", text: "Track in My Orders" },
                ].map((step, i) => (
                  <div key={i} style={s.nextStepRow}>
                    <span style={{ fontSize: "18px" }}>{step.icon}</span>
                    <span style={s.nextStepText}>{step.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button style={s.primaryBtn} onClick={onBack}>
                  Continue shopping
                </button>
                <button
                  style={{ ...s.primaryBtn, background: "#a0622a" }}
                  onClick={onGoToOrders}
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, required, error, children }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={s.fieldLabel}>{label} {required && <span style={{ color: "#e24b4a" }}>*</span>}</label>
    {children}
    {error && <div style={s.fieldError}>{error}</div>}
  </div>
);

const OrderSummary = ({ subtotal, shipping, total, fmtPrice }) => (
  <div style={s.summary}>
    <div style={s.summaryTitle}>Order summary</div>
    <div style={s.summaryRow}><span style={s.summaryLabel}>Subtotal</span><span style={s.summaryVal}>{fmtPrice(subtotal)}</span></div>
    <div style={s.summaryRow}><span style={s.summaryLabel}>Shipping</span><span style={{ ...s.summaryVal, color: shipping === 0 ? "#3b6d11" : "#2c1a0e" }}>{shipping === 0 ? "FREE" : fmtPrice(shipping)}</span></div>
    {shipping === 0 && <div style={s.freeShippingNote}>🎉 Free shipping on orders above ₹999</div>}
    <div style={s.summaryDivider} />
    <div style={s.summaryRow}>
      <span style={{ ...s.summaryLabel, fontWeight: "600", color: "#2c1a0e", fontSize: "16px" }}>Total</span>
      <span style={{ ...s.summaryVal, fontWeight: "600", fontSize: "20px", color: "#5c3310" }}>{fmtPrice(total)}</span>
    </div>
  </div>
);

const s = {
  page: { minHeight: "100vh", background: "#fdf8f2", fontFamily: "'Georgia', serif" },
  header: { background: "#fff", borderBottom: "1px solid #e8d9c6", padding: "20px 40px 0" },
  backLink: { background: "none", border: "none", color: "#a0622a", fontSize: "14px", cursor: "pointer", fontFamily: "'Trebuchet MS', sans-serif", padding: 0, marginBottom: "16px", display: "block" },
  pageTitle: { fontSize: "26px", fontWeight: "400", color: "#2c1a0e", marginBottom: "24px" },
  body: { padding: "32px 40px 60px" },
  stepBar: { display: "flex", alignItems: "center", paddingBottom: "20px" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepCircle: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", fontWeight: "600" },
  stepActive: { background: "#7c4a1e", color: "#fff" },
  stepDone: { background: "#fdefd8", color: "#a0622a", border: "1.5px solid #a0622a" },
  stepPending: { background: "#f0e8dc", color: "#b0a090" },
  stepLabel: { fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", whiteSpace: "nowrap" },
  stepLine: { flex: 1, height: "1.5px", margin: "0 8px", marginTop: "-14px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "start", maxWidth: "960px" },
  leftCol: {}, rightCol: { position: "sticky", top: "24px" },
  colTitle: { fontSize: "20px", fontWeight: "400", color: "#2c1a0e", marginBottom: "20px" },
  cartItem: { display: "flex", alignItems: "center", gap: "14px", background: "#fff", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e8d9c6", marginBottom: "12px" },
  itemImg: { width: "68px", height: "68px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: "15px", color: "#2c1a0e", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemArtisan: { fontSize: "12px", color: "#a0622a", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "2px" },
  itemUnitPrice: { fontSize: "12px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif" },
  qtyRow: { display: "flex", alignItems: "center", gap: "8px" },
  qtyBtn: { width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #d9c9b0", background: "#fff", cursor: "pointer", fontSize: "16px", color: "#7c4a1e" },
  qtyNum: { fontSize: "15px", color: "#2c1a0e", minWidth: "20px", textAlign: "center" },
  itemLineTotal: { fontSize: "16px", fontWeight: "600", color: "#5c3310", minWidth: "72px", textAlign: "right" },
  removeBtn: { background: "none", border: "none", color: "#c0392b", fontSize: "20px", cursor: "pointer", padding: "0 4px" },
  emptyCart: { background: "#fff", borderRadius: "14px", padding: "60px 20px", textAlign: "center", border: "1px solid #e8d9c6" },
  emptyText: { fontSize: "15px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "20px" },
  summary: { background: "#fff", borderRadius: "14px", padding: "20px", border: "1px solid #e8d9c6", marginBottom: "16px" },
  summaryTitle: { fontSize: "16px", fontWeight: "400", color: "#2c1a0e", marginBottom: "14px" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  summaryLabel: { fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" },
  summaryVal: { fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#2c1a0e" },
  summaryDivider: { height: "1px", background: "#e8d9c6", margin: "14px 0" },
  freeShippingNote: { fontSize: "12px", color: "#3b6d11", fontFamily: "'Trebuchet MS', sans-serif", background: "#eaf3de", padding: "6px 10px", borderRadius: "6px", marginBottom: "8px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" },
  fieldLabel: { display: "block", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", textTransform: "uppercase", color: "#6b4c35", marginBottom: "6px" },
  fieldError: { fontSize: "12px", color: "#e24b4a", fontFamily: "'Trebuchet MS', sans-serif", marginTop: "4px" },
  input: { width: "100%", padding: "12px 14px", fontSize: "14px", fontFamily: "'Georgia', serif", border: "1.5px solid #d9c9b0", borderRadius: "10px", background: "#fff", color: "#2c1a0e", outline: "none", boxSizing: "border-box" },
  inputFocus: { borderColor: "#a0622a", boxShadow: "0 0 0 3px rgba(160,98,42,0.1)" },
  reviewSection: { background: "#fff", borderRadius: "12px", padding: "18px 20px", border: "1px solid #e8d9c6", marginBottom: "14px" },
  reviewSectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  reviewSectionTitle: { fontSize: "15px", fontWeight: "400", color: "#2c1a0e" },
  editLink: { background: "none", border: "none", color: "#a0622a", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer", padding: 0, textDecoration: "underline" },
  reviewItem: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f0e4d0" },
  reviewItemImg: { width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  reviewItemName: { fontSize: "14px", color: "#2c1a0e", marginBottom: "2px" },
  reviewItemMeta: { fontSize: "12px", color: "#a08060", fontFamily: "'Trebuchet MS', sans-serif" },
  reviewItemPrice: { fontSize: "15px", fontWeight: "600", color: "#5c3310", flexShrink: 0 },
  reviewAddress: { lineHeight: "1.7" },
  reviewAddressName: { fontSize: "15px", color: "#2c1a0e" },
  reviewAddressText: { fontSize: "14px", color: "#6b4c35", fontFamily: "'Trebuchet MS', sans-serif" },
  deliveryNote: { background: "#fdefd8", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" },
  paymentCard: { background: "#fff", borderRadius: "14px", padding: "24px", border: "1px solid #e8d9c6", marginBottom: "14px" },
  demoHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  demoBadge: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fdefd8", color: "#7c4a1e", padding: "5px 12px", borderRadius: "20px", border: "1px solid #e8c88a" },
  demoSecure: { fontSize: "12px", color: "#3b6d11", fontFamily: "'Trebuchet MS', sans-serif" },
  demoNote: { fontSize: "13px", color: "#6b4c35", fontFamily: "'Trebuchet MS', sans-serif", lineHeight: "1.7", marginBottom: "18px", background: "#fdf8f2", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e8d9c6" },
  demoFeatures: { display: "flex", flexDirection: "column", gap: "8px" },
  demoFeatureRow: { display: "flex", alignItems: "center", gap: "10px" },
  demoCheck: { color: "#0f6e56", fontWeight: "600", fontSize: "14px" },
  demoFeatureText: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" },
  paymentError: { background: "#fcebeb", border: "1px solid #f09595", color: "#a32d2d", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", marginTop: "12px" },
  disclaimer: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", color: "#a08060", textAlign: "center", lineHeight: "1.6" },
  confirmWrap: { display: "flex", justifyContent: "center", paddingTop: "20px" },
  confirmCard: { background: "#fff", borderRadius: "20px", padding: "40px 48px", border: "1px solid #e8d9c6", maxWidth: "520px", width: "100%", textAlign: "center" },
  confirmIcon: { fontSize: "40px", color: "#a0622a", marginBottom: "16px" },
  confirmTitle: { fontSize: "30px", fontWeight: "400", color: "#2c1a0e", marginBottom: "10px" },
  confirmSub: { fontSize: "15px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", lineHeight: "1.7", marginBottom: "24px" },
  confirmOrderId: { display: "inline-block", background: "#fdefd8", color: "#7c4a1e", fontFamily: "'Trebuchet MS', sans-serif", fontSize: "13px", padding: "6px 18px", borderRadius: "20px", marginBottom: "24px" },
  confirmDetails: { background: "#fdf8f2", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", textAlign: "left" },
  confirmRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0e4d0" },
  confirmLabel: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#8a6a52" },
  confirmValue: { fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#2c1a0e" },
  statusBadge: { background: "#e1f5ee", color: "#0f6e56", padding: "3px 10px", borderRadius: "12px", fontSize: "11px" },
  nextSteps: { background: "#fff", border: "1px solid #e8d9c6", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", textAlign: "left" },
  nextStepTitle: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", textTransform: "uppercase", color: "#a08060", marginBottom: "12px" },
  nextStepRow: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" },
  nextStepText: { fontSize: "14px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", lineHeight: "1.5" },
  primaryBtn: { width: "100%", padding: "14px", fontSize: "15px", fontFamily: "'Trebuchet MS', sans-serif", background: "#7c4a1e", color: "#fdf8f2", border: "none", borderRadius: "10px", cursor: "pointer" },
};

export default Cart;