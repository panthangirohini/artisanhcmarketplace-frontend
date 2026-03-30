import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import ArtisanDashboard from "./pages/ArtisanDashboard";
import OrderHistory from "./pages/OrderHistory";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [cart, setCart] = useState([]);

  // Restore session from localStorage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      const u = JSON.parse(savedUser);
      setUser(u);
      // Route artisans straight to their dashboard
      setPage(u.role === "ARTISAN" ? "dashboard" : "products");
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    // Artisans go to dashboard, customers go to products
    setPage(userData.role === "ARTISAN" ? "dashboard" : "products");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    setPage("login");
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Not logged in
  if (!user) {
    if (page === "register") {
      return <Register onGoToLogin={() => setPage("login")} />;
    }
    return <Login setUser={handleLogin} onGoToRegister={() => setPage("register")} />;
  }

  // Artisan dashboard
  if (page === "dashboard" && user.role === "ARTISAN") {
    return (
      <ArtisanDashboard
        user={user}
        onBack={() => setPage("products")}
      />
    );
  }

  // Cart
  if (page === "cart") {
    return (
      <Cart
        cart={cart}
        setCart={setCart}
        user={user}
        onBack={() => setPage("products")}
        onGoToOrders={() => setPage("orders")}
      />
    );
  }

  // My orders
  if (page === "orders") {
    return <OrderHistory user={user} onBack={() => setPage("products")} />;
  }

  // Default: products marketplace
  return (
    <Products
      user={user}
      cart={cart}
      onAddToCart={addToCart}
      onGoToCart={() => setPage("cart")}
      onGoToOrders={() => setPage("orders")}
      onGoToDashboard={() => setPage("dashboard")}
      onLogout={handleLogout}
    />
  );
}

export default App;