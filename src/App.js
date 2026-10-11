import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import ArtisanDashboard from "./pages/ArtisanDashboard";
import OrderHistory from "./pages/OrderHistory";
import AdminPanel from "./components/AdminPanel";
import { Navbar, Footer } from "./components/ui";

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// Where each role lands after signing in
const homeFor = (user) =>
  user?.role === "ARTISAN" ? "dashboard" : user?.role === "ADMIN" ? "admin" : "products";

function App() {
  // Restore session from localStorage on first load
  const [user, setUser] = useState(() => (localStorage.getItem("token") ? readJSON("user", null) : null));
  const [page, setPage] = useState(() => homeFor(user));
  const [authPage, setAuthPage] = useState("login");
  const [cart, setCart] = useState(() => readJSON("cart", []));

  // Keep the bag across reloads
  useEffect(() => {
    try { localStorage.setItem("cart", JSON.stringify(cart)); } catch { /* storage unavailable */ }
  }, [cart]);

  const navigate = (next) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  };

  const handleLogin = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    navigate(homeFor(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    setAuthPage("login");
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...product, quantity }];
    });
  };

  // Not logged in
  if (!user) {
    return authPage === "register"
      ? <Register onGoToLogin={() => setAuthPage("login")} />
      : <Login setUser={handleLogin} onGoToRegister={() => setAuthPage("register")} />;
  }

  // Role-gated pages fall back to the shop
  const current =
    (page === "dashboard" && user.role !== "ARTISAN") || (page === "admin" && user.role !== "ADMIN")
      ? "products"
      : page;

  let content;
  switch (current) {
    case "dashboard":
      content = <ArtisanDashboard user={user} />;
      break;
    case "admin":
      content = <AdminPanel user={user} />;
      break;
    case "cart":
      content = (
        <Cart cart={cart} setCart={setCart} user={user}
          onBack={() => navigate("products")} onGoToOrders={() => navigate("orders")} />
      );
      break;
    case "orders":
      content = <OrderHistory user={user} onBack={() => navigate("products")} />;
      break;
    default:
      content = (
        <Products user={user} cart={cart} onAddToCart={addToCart} onGoToCart={() => navigate("cart")} />
      );
  }

  return (
    <div className="app-shell">
      <Navbar
        user={user}
        page={current}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
      <main className="app-main">{content}</main>
      <Footer />
    </div>
  );
}

export default App;
