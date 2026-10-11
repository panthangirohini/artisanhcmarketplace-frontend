import React, { useState } from "react";
import api, { imageSrc } from "../Api";
import { Alert, EmptyState, Field, Icon, QtyStepper, Spinner, errorMessage, firstName, fmtPrice } from "../components/ui";

const STEPS = ["Bag", "Address", "Review", "Payment"];
const FREE_SHIPPING_OVER = 999;

const PAYMENT_METHODS = [
  { id: "upi", icon: "phone", title: "UPI", sub: "Google Pay, PhonePe, Paytm" },
  { id: "card", icon: "card", title: "Credit / debit card", sub: "Visa, Mastercard, RuPay" },
  { id: "cod", icon: "cash", title: "Cash on delivery", sub: "Pay when your order arrives" },
];

const Stepper = ({ current }) => (
  <ol className="stepper" aria-label="Checkout progress" style={{ listStyle: "none", padding: 0 }}>
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <li className={"step" + (i < current ? " done" : i === current ? " current" : "")} aria-current={i === current ? "step" : undefined}>
          <span className="step-dot">{i < current ? <Icon name="check" size={14} strokeWidth={2.4} /> : i + 1}</span>
          {label}
        </li>
        {i < STEPS.length - 1 && <li className={"step-line" + (i < current ? " done" : "")} aria-hidden="true" />}
      </React.Fragment>
    ))}
  </ol>
);

const OrderSummary = ({ count, subtotal, shipping, total }) => {
  const remaining = FREE_SHIPPING_OVER + 1 - subtotal;
  return (
    <div className="card summary">
      <h3>Order summary</h3>
      <div className="summary-row"><span>Items ({count})</span><span>{fmtPrice(subtotal)}</span></div>
      <div className="summary-row">
        <span>Shipping</span>
        {shipping === 0 ? <span className="free">Free</span> : <span>{fmtPrice(shipping)}</span>}
      </div>
      {subtotal > 0 && (
        <div className="ship-progress">
          {remaining > 0
            ? <>Add <strong>{fmtPrice(remaining)}</strong> more for free shipping</>
            : <>You've unlocked <strong>free shipping</strong> 🎉</>}
          <div className="ship-bar"><span style={{ width: `${Math.min(100, (subtotal / (FREE_SHIPPING_OVER + 1)) * 100)}%` }} /></div>
        </div>
      )}
      <div className="summary-total"><span>Total</span><strong>{fmtPrice(total)}</strong></div>
    </div>
  );
};

const Cart = ({ cart, setCart, user, onBack, onGoToOrders }) => {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ fullName: user?.name || "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentError, setPaymentError] = useState("");

  const setQty = (id, qty) =>
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)).filter((i) => i.quantity > 0));
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > FREE_SHIPPING_OVER ? 0 : 79;
  const total = subtotal + shipping;

  const goTo = (n) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const setField = (key, transform) => (e) => {
    const value = transform ? transform(e.target.value) : e.target.value;
    setAddress({ ...address, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };
  const digits = (v) => v.replace(/\D/g, "");

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!/^\d{10}$/.test(address.phone)) e.phone = "Enter a 10-digit mobile number";
    if (!address.line1.trim()) e.line1 = "Required";
    if (!address.city.trim()) e.city = "Required";
    if (!address.state.trim()) e.state = "Required";
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = "Enter a 6-digit PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Demo checkout: saves the order, then marks it paid (except cash on delivery)
  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      setPaymentError("Your bag is empty. Add items before placing an order.");
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
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      let order = orderRes.data;
      if (method !== "cod") {
        const paymentId = `DEMO-${method.toUpperCase()}-${Date.now()}`;
        order = (await api.post(`/api/orders/${order.id}/confirm-payment`, null, { params: { paymentId } })).data;
      }
      setPlacedOrder(order);
      setCart([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setPaymentError(errorMessage(err, "Order placement failed. Please try again."));
    } finally {
      setPlacing(false);
    }
  };

  /* ---------- Order confirmed ---------- */
  if (placedOrder) {
    return (
      <div className="container page">
        <div className="card confirm">
          <div className="confirm-icon"><Icon name="check" size={36} strokeWidth={2.2} /></div>
          <h1>Thank you, {firstName(user.name)}!</h1>
          <p>Your order is in. The artisans have been notified and will start preparing your pieces.</p>
          <dl className="kv">
            <div className="kv-row"><dt>Order number</dt><dd>#{placedOrder.id}</dd></div>
            <div className="kv-row"><dt>Amount</dt><dd>{fmtPrice(placedOrder.totalAmount)}</dd></div>
            <div className="kv-row">
              <dt>Payment</dt>
              <dd>{method === "cod" ? "Cash on delivery" : PAYMENT_METHODS.find((m) => m.id === method)?.title + " (demo)"}</dd>
            </div>
            <div className="kv-row"><dt>Estimated delivery</dt><dd>5–8 business days</dd></div>
            <div className="kv-row"><dt>Shipping to</dt><dd style={{ maxWidth: 280 }}>{placedOrder.shippingAddress}</dd></div>
          </dl>
          <div className="confirm-actions">
            <button className="btn btn-primary btn-lg" onClick={onGoToOrders}><Icon name="package" size={17} /> Track my order</button>
            <button className="btn btn-secondary btn-lg" onClick={onBack}>Continue shopping</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Empty bag ---------- */
  if (cart.length === 0) {
    return (
      <div className="container page">
        <div className="card">
          <EmptyState icon="bag" title="Your bag is empty"
            text="Find something made by hand — from blue pottery to Banarasi silk."
            action={<button className="btn btn-primary" onClick={onBack}>Browse the collection <Icon name="arrowRight" size={16} /></button>} />
        </div>
      </div>
    );
  }

  const summary = <OrderSummary count={count} subtotal={subtotal} shipping={shipping} total={total} />;

  return (
    <div className="container page">
      <button className="back-link" onClick={step > 0 ? () => goTo(step - 1) : onBack}>
        <Icon name="arrowLeft" size={16} /> {step > 0 ? `Back to ${STEPS[step - 1].toLowerCase()}` : "Continue shopping"}
      </button>
      <h1 className="page-title">Checkout</h1>
      <Stepper current={step} />

      <div className="checkout-layout">
        <div>
          {/* STEP 0 — BAG */}
          {step === 0 && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Your bag</h2><span className="muted">{count} {count === 1 ? "item" : "items"}</span></div>
              {cart.map((item) => (
                <div key={item.id} className="line-item">
                  <img className="line-item-img" src={imageSrc(item.imageUrl)} alt="" />
                  <div className="line-item-info">
                    <div className="line-item-name">{item.name}</div>
                    <div className="line-item-meta">by {item.artisanName} · {fmtPrice(item.price)} each</div>
                    <div className="line-item-actions">
                      <QtyStepper small value={item.quantity} min={0} onChange={(q) => setQty(item.id, q)} />
                      <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item.id)}><Icon name="trash" size={15} /> Remove</button>
                    </div>
                  </div>
                  <div className="line-item-total">{fmtPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 1 — ADDRESS */}
          {step === 1 && (
            <div className="card section-card">
              <div className="section-card-head"><h3>Where should we send it?</h3></div>
              <div className="form-grid">
                <Field label="Full name" required error={errors.fullName}>
                  <input className={"input" + (errors.fullName ? " has-error" : "")} autoComplete="name" value={address.fullName} onChange={setField("fullName")} />
                </Field>
                <Field label="Mobile number" required error={errors.phone}>
                  <input className={"input" + (errors.phone ? " has-error" : "")} inputMode="numeric" autoComplete="tel" maxLength={10}
                    placeholder="10-digit number" value={address.phone} onChange={setField("phone", digits)} />
                </Field>
              </div>
              <Field label="Address" required error={errors.line1}>
                <input className={"input" + (errors.line1 ? " has-error" : "")} autoComplete="address-line1"
                  placeholder="House / flat, street, area" value={address.line1} onChange={setField("line1")} />
              </Field>
              <Field label="Landmark" hint="Optional">
                <input className="input" autoComplete="address-line2" placeholder="Near…" value={address.line2} onChange={setField("line2")} />
              </Field>
              <div className="form-grid-3">
                <Field label="City" required error={errors.city}>
                  <input className={"input" + (errors.city ? " has-error" : "")} autoComplete="address-level2" value={address.city} onChange={setField("city")} />
                </Field>
                <Field label="State" required error={errors.state}>
                  <input className={"input" + (errors.state ? " has-error" : "")} autoComplete="address-level1" value={address.state} onChange={setField("state")} />
                </Field>
                <Field label="PIN code" required error={errors.pincode}>
                  <input className={"input" + (errors.pincode ? " has-error" : "")} inputMode="numeric" autoComplete="postal-code" maxLength={6}
                    value={address.pincode} onChange={setField("pincode", digits)} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2 — REVIEW */}
          {step === 2 && (
            <>
              <div className="card section-card">
                <div className="section-card-head"><h3>Items</h3><button className="link" onClick={() => goTo(0)}>Edit</button></div>
                {cart.map((item) => (
                  <div key={item.id} className="line-item" style={{ padding: "12px 0" }}>
                    <img className="line-item-img line-item-img-sm" src={imageSrc(item.imageUrl)} alt="" />
                    <div className="line-item-info">
                      <div className="line-item-name" style={{ fontSize: 15 }}>{item.name}</div>
                      <div className="line-item-meta">by {item.artisanName} · qty {item.quantity}</div>
                    </div>
                    <div className="line-item-total">{fmtPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="card section-card">
                <div className="section-card-head"><h3>Shipping to</h3><button className="link" onClick={() => goTo(1)}>Edit</button></div>
                <p><strong>{address.fullName}</strong> · {address.phone}</p>
                <p className="muted">{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} – {address.pincode}</p>
                <div className="note"><Icon name="truck" size={18} /> Estimated delivery in 5–8 business days</div>
              </div>
            </>
          )}

          {/* STEP 3 — PAYMENT */}
          {step === 3 && (
            <div className="card section-card">
              <div className="section-card-head"><h3>How would you like to pay?</h3></div>
              <Alert type="info">This is a demo checkout — no real payment is taken.</Alert>
              <div className="pay-options" role="radiogroup">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={method === m.id}
                    className={"pay-option" + (method === m.id ? " selected" : "")} onClick={() => setMethod(m.id)}>
                    <span className="pay-option-icon"><Icon name={m.icon} size={20} /></span>
                    <span><div className="pay-option-title">{m.title}</div><div className="pay-option-sub">{m.sub}</div></span>
                    <span className="radio" />
                  </button>
                ))}
              </div>
              {paymentError && <div style={{ marginTop: 16 }}><Alert>{paymentError}</Alert></div>}
            </div>
          )}
        </div>

        <aside className="checkout-aside">
          {summary}
          {step === 0 && <button className="btn btn-primary btn-lg btn-block" onClick={() => goTo(1)}>Checkout <Icon name="arrowRight" size={17} /></button>}
          {step === 1 && <button className="btn btn-primary btn-lg btn-block" onClick={() => validateAddress() && goTo(2)}>Review order <Icon name="arrowRight" size={17} /></button>}
          {step === 2 && <button className="btn btn-primary btn-lg btn-block" onClick={() => goTo(3)}>Continue to payment <Icon name="arrowRight" size={17} /></button>}
          {step === 3 && (
            <button className="btn btn-primary btn-lg btn-block" onClick={handleConfirmOrder} disabled={placing}>
              {placing ? <><Spinner small /> Placing order…</> : <>Place order · {fmtPrice(total)}</>}
            </button>
          )}
          <div className="trust"><Icon name="lock" size={14} /> Your details are kept secure</div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
