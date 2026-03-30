import React, { useEffect, useState } from "react";
import api from "../Api";
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

const Products = ({ user, cart, onAddToCart, onGoToCart, onGoToDashboard, onGoToOrders, onGoToAdmin, onLogout }) => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch]         = useState("");
  const [selCategory, setSelCategory] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [open, setOpen]             = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: "", description: "", price: "", artisanName: "", imageUrl: "", categoryId: "" });
  const [editMode, setEditMode]     = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hoveredId, setHoveredId]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addedId, setAddedId]       = useState(null);

  const isArtisanOrAdmin = user?.role === "ARTISAN" || user?.role === "ADMIN";
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    fetchProducts();
    api.get("/api/categories").then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const fetchProducts = () => {
    // Use filter endpoint if any filter is active
    const params = new URLSearchParams();
    if (search)       params.append("keyword", search);
    if (selCategory)  params.append("categoryId", selCategory);
    if (priceRange.min) params.append("minPrice", priceRange.min);
    if (priceRange.max) params.append("maxPrice", priceRange.max);

    const url = params.toString() ? `/api/products/filter?${params}` : "/api/products";
    api.get(url).then(res => setProducts(res.data)).catch(console.error);
  };

  // Re-fetch whenever filters change
  useEffect(() => { fetchProducts(); }, [search, selCategory, priceRange.min, priceRange.max]);

  const clearFilters = () => {
    setSearch(""); setSelCategory(null); setPriceRange({ min: "", max: "" });
  };
  const hasFilter = search || selCategory || priceRange.min || priceRange.max;

  const handleSave = async () => {
    let imageName = currentProduct.imageUrl || "";
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await api.post("/api/products/upload", formData);
      imageName = res.data;
    }
    const payload = { ...currentProduct, imageUrl: imageName, artisanName: user.name };
    if (editMode) { await api.put(`/api/products/${currentProduct.id}`, payload); }
    else          { await api.post("/api/products", payload); }
    setOpen(false);
    setCurrentProduct({ name: "", description: "", price: "", artisanName: "", imageUrl: "", categoryId: "" });
    setEditMode(false); setSelectedFile(null);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/products/${id}`);
    setDeleteConfirm(null); fetchProducts();
  };

  const handleOpen = (product = null) => {
    if (product) { setCurrentProduct(product); setEditMode(true); }
    else { setCurrentProduct({ name: "", description: "", price: "", artisanName: user.name, imageUrl: "", categoryId: "" }); setEditMode(false); }
    setSelectedFile(null); setOpen(true);
  };

  const handleAddToCart = (p) => {
    onAddToCart(p); setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || "";

  return (
    <div style={st.page}>
      {/* Navbar */}
      <nav style={st.navbar}>
        <div style={st.navBrand}>
          <span style={st.navLogoMark}>✦</span>
          <span style={st.navTitle}>Artisan Handcraft</span>
          <span style={st.navSubtitle}>Marketplace</span>
        </div>
        <div style={st.navRight}>
          {user && <span style={st.navUser}>Welcome, {user.name}</span>}
          <button style={st.cartBtn} onClick={onGoToCart}>
            🛍 Cart {cartCount > 0 && <span style={st.cartBadge}>{cartCount}</span>}
          </button>
          <button style={st.navBtn2} onClick={onGoToOrders}>My orders</button>
          {user?.role === "ARTISAN" && <button style={st.navBtn2} onClick={onGoToDashboard}>Dashboard</button>}
          {user?.role === "ADMIN"   && <button style={st.navBtn2} onClick={onGoToAdmin}>Admin</button>}
          <button style={st.logoutBtn} onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={st.heroStrip}>
        <div style={st.heroInner}>
          <h1 style={st.heroTitle}>Handmade with heart, <em>crafted for you</em></h1>
          <p style={st.heroSub}>Discover unique artisan goods from skilled makers across India</p>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div style={st.categoryBar}>
          <button
            style={selCategory === null ? { ...st.catPill, ...st.catPillActive } : st.catPill}
            onClick={() => setSelCategory(null)}>
            All
          </button>
          {categories.map(c => (
            <button key={c.id}
              style={selCategory === c.id ? { ...st.catPill, ...st.catPillActive } : st.catPill}
              onClick={() => setSelCategory(selCategory === c.id ? null : c.id)}>
              {c.icon && <span style={{ marginRight: "5px" }}>{c.icon}</span>}{c.name}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={st.toolbar}>
        <div style={st.searchWrap}>
          <span style={st.searchIcon}>⌕</span>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={st.searchInput}
            onFocus={e => Object.assign(e.target.style, { borderColor: "#a0622a" })}
            onBlur={e => Object.assign(e.target.style, { borderColor: "#d9c9b0" })} />
        </div>

        {/* Price filter */}
        <div style={st.priceFilter}>
          <input placeholder="Min ₹" value={priceRange.min} onChange={e => setPriceRange({ ...priceRange, min: e.target.value })} style={st.priceInput} type="number" />
          <span style={st.priceSeperator}>—</span>
          <input placeholder="Max ₹" value={priceRange.max} onChange={e => setPriceRange({ ...priceRange, max: e.target.value })} style={st.priceInput} type="number" />
        </div>

        <div style={st.toolbarRight}>
          {hasFilter && <button style={st.clearBtn} onClick={clearFilters}>✕ Clear</button>}
          <span style={st.countBadge}>{products.length} items</span>
          {isArtisanOrAdmin && (
            <button style={st.addBtn} onClick={() => handleOpen()}
              onMouseEnter={e => Object.assign(e.target.style, { background: "#a0622a" })}
              onMouseLeave={e => Object.assign(e.target.style, { background: "#7c4a1e" })}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={st.grid}>
        {products.length === 0 && (
          <div style={st.emptyState}>
            <p style={{ fontSize: "48px", marginBottom: "12px" }}>🏺</p>
            <p style={{ color: "#8a6a52", fontSize: "16px", fontFamily: "'Trebuchet MS', sans-serif" }}>
              {hasFilter ? "No products match your filters." : "No products yet."}
            </p>
            {hasFilter && <button style={st.addBtn} onClick={clearFilters}>Clear filters</button>}
          </div>
        )}
        {products.map(p => (
          <div key={p.id}
            style={hoveredId === p.id ? { ...st.card, ...st.cardHover } : st.card}
            onMouseEnter={() => setHoveredId(p.id)} onMouseLeave={() => setHoveredId(null)}>
            <div style={st.imgWrap}>
              <img src={p.imageUrl ? `http://localhost:8080/uploads/${p.imageUrl}` : "https://via.placeholder.com/400x300/f5ead8/a0622a?text=Handcraft"} alt={p.name} style={st.img} />
              {p.categoryId && <span style={st.catTag}>{getCategoryName(p.categoryId)}</span>}
            </div>
            <div style={st.cardBody}>
              <div style={st.artisanBadge}>✦ {p.artisanName}</div>
              <h3 style={st.productName}>{p.name}</h3>
              <p style={st.productDesc}>{p.description}</p>
              <div style={st.cardFooter}>
                <span style={st.price}>₹{Number(p.price).toLocaleString("en-IN")}</span>
                <div style={st.cardActions}>
                  <button
                    style={addedId === p.id ? { ...st.cartAddBtn, background: "#2e7d32" } : st.cartAddBtn}
                    onClick={() => handleAddToCart(p)}>
                    {addedId === p.id ? "Added!" : "+ Cart"}
                  </button>
                  {isArtisanOrAdmin && (
                    <>
                      <button style={st.editBtn} onClick={() => handleOpen(p)}>Edit</button>
                      <button style={st.deleteBtn} onClick={() => setDeleteConfirm(p.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        PaperProps={{ style: { borderRadius: "16px", fontFamily: "'Georgia', serif", padding: "8px" } }}>
        <DialogTitle style={{ fontFamily: "'Georgia', serif", color: "#2c1a0e" }}>Delete product?</DialogTitle>
        <DialogContent><p style={{ fontFamily: "'Trebuchet MS', sans-serif", fontSize: "14px", color: "#6b4c35" }}>This cannot be undone.</p></DialogContent>
        <DialogActions style={{ padding: "16px" }}>
          <Button onClick={() => setDeleteConfirm(null)} style={{ fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", textTransform: "none" }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} variant="contained" style={{ background: "#c0392b", fontFamily: "'Trebuchet MS', sans-serif", textTransform: "none", borderRadius: "8px" }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit dialog */}
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
            { label: "Image URL (optional)", key: "imageUrl", placeholder: "https://..." },
          ].map(field => (
            <TextField key={field.key} label={field.label} fullWidth margin="dense"
              type={field.type || "text"} multiline={field.multiline} rows={field.multiline ? 3 : 1}
              placeholder={field.placeholder} value={currentProduct[field.key] || ""}
              onChange={e => setCurrentProduct({ ...currentProduct, [field.key]: e.target.value })}
              sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "'Georgia', serif",
                "& fieldset": { borderColor: "#d9c9b0" }, "&:hover fieldset": { borderColor: "#a0622a" },
                "&.Mui-focused fieldset": { borderColor: "#7c4a1e" } },
                "& .MuiInputLabel-root.Mui-focused": { color: "#7c4a1e" } }} />
          ))}

          {/* Category selector */}
          <div style={{ marginTop: "8px", marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", textTransform: "uppercase", color: "#6b4c35", marginBottom: "6px" }}>Category</label>
            <select style={{ width: "100%", padding: "12px 14px", fontSize: "14px", fontFamily: "'Georgia', serif", border: "1.5px solid #d9c9b0", borderRadius: "10px", background: "#fff", color: "#2c1a0e", outline: "none" }}
              value={currentProduct.categoryId || ""} onChange={e => setCurrentProduct({ ...currentProduct, categoryId: e.target.value || null })}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ display: "inline-block", padding: "9px 18px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fdefd8", color: "#7c4a1e", border: "1px dashed #a0622a", borderRadius: "8px", cursor: "pointer" }}>
              Upload image
              <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} style={{ display: "none" }} />
            </label>
            {selectedFile && <span style={{ fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" }}>{selectedFile.name}</span>}
          </div>
        </DialogContent>
        <DialogActions style={{ padding: "16px 24px" }}>
          <Button onClick={() => setOpen(false)} style={{ fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35", textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" style={{ background: "#7c4a1e", fontFamily: "'Trebuchet MS', sans-serif", textTransform: "none", borderRadius: "10px", padding: "8px 24px" }}>
            {editMode ? "Update" : "Add product"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const st = {
  page: { minHeight: "100vh", background: "#fdf8f2", fontFamily: "'Georgia', serif" },
  navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "#fff", borderBottom: "1px solid #e8d9c6", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: "10px" },
  navBrand: { display: "flex", alignItems: "baseline", gap: "10px" },
  navLogoMark: { color: "#a0622a", fontSize: "18px" },
  navTitle: { fontSize: "20px", fontWeight: "400", color: "#2c1a0e" },
  navSubtitle: { fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "2px", textTransform: "uppercase", color: "#a08060" },
  navRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  navUser: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#6b4c35" },
  cartBtn: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fdefd8", color: "#7c4a1e", border: "1px solid #d9c9b0", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  cartBadge: { background: "#7c4a1e", color: "#fff", fontSize: "11px", borderRadius: "10px", padding: "1px 7px" },
  navBtn2: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#7c4a1e", border: "1px solid #d9c9b0", borderRadius: "8px", padding: "7px 14px", cursor: "pointer" },
  logoutBtn: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#7c4a1e", border: "1px solid #d9c9b0", borderRadius: "8px", padding: "7px 14px", cursor: "pointer" },
  heroStrip: { background: "linear-gradient(135deg, #5c3310 0%, #7c4a1e 60%, #a0622a 100%)", padding: "48px 40px" },
  heroInner: { maxWidth: "700px" },
  heroTitle: { fontSize: "36px", fontWeight: "400", color: "#fff", marginBottom: "12px", lineHeight: "1.2" },
  heroSub: { fontSize: "16px", color: "#f5d9a8", fontFamily: "'Trebuchet MS', sans-serif" },
  categoryBar: { display: "flex", gap: "8px", padding: "16px 40px", overflowX: "auto", borderBottom: "1px solid #e8d9c6", background: "#fff", flexWrap: "wrap" },
  catPill: { padding: "7px 18px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fdf8f2", color: "#6b4c35", border: "1px solid #d9c9b0", borderRadius: "20px", cursor: "pointer", whiteSpace: "nowrap" },
  catPillActive: { background: "#7c4a1e", color: "#fff", borderColor: "#7c4a1e" },
  toolbar: { display: "flex", alignItems: "center", padding: "20px 40px", gap: "12px", flexWrap: "wrap" },
  searchWrap: { display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #d9c9b0", borderRadius: "12px", padding: "0 16px", flex: "1", minWidth: "200px", maxWidth: "340px" },
  searchIcon: { color: "#a08060", fontSize: "20px", marginRight: "8px", fontFamily: "sans-serif" },
  searchInput: { border: "none", outline: "none", background: "transparent", padding: "10px 0", fontSize: "14px", fontFamily: "'Georgia', serif", color: "#2c1a0e", width: "100%" },
  priceFilter: { display: "flex", alignItems: "center", gap: "8px" },
  priceInput: { width: "90px", padding: "10px 12px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", border: "1.5px solid #d9c9b0", borderRadius: "10px", background: "#fff", color: "#2c1a0e", outline: "none" },
  priceSeperator: { color: "#a08060", fontSize: "12px" },
  toolbarRight: { display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" },
  clearBtn: { padding: "8px 14px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "#fcebeb", color: "#a32d2d", border: "1px solid #f5a5a5", borderRadius: "20px", cursor: "pointer" },
  countBadge: { fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", color: "#8a6a52", background: "#fdefd8", padding: "6px 14px", borderRadius: "20px" },
  addBtn: { padding: "10px 20px", fontSize: "13px", fontFamily: "'Trebuchet MS', sans-serif", background: "#7c4a1e", color: "#fdf8f2", border: "none", borderRadius: "10px", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px", padding: "0 40px 60px" },
  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px" },
  card: { background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #e8d9c6", transition: "transform 0.25s, box-shadow 0.25s" },
  cardHover: { transform: "translateY(-4px)", boxShadow: "0 12px 36px rgba(124,74,30,0.12)" },
  imgWrap: { position: "relative", height: "200px", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  catTag: { position: "absolute", top: "10px", left: "10px", background: "rgba(44,26,14,0.7)", color: "#f5d9a8", fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", padding: "4px 10px", borderRadius: "12px" },
  cardBody: { padding: "16px 18px" },
  artisanBadge: { fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: "1px", color: "#a0622a", textTransform: "uppercase", marginBottom: "6px" },
  productName: { fontSize: "17px", fontWeight: "400", color: "#2c1a0e", marginBottom: "6px" },
  productDesc: { fontSize: "13px", color: "#8a6a52", fontFamily: "'Trebuchet MS', sans-serif", lineHeight: "1.6", marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f0e4d0", paddingTop: "12px" },
  price: { fontSize: "19px", fontWeight: "600", color: "#5c3310" },
  cardActions: { display: "flex", gap: "6px" },
  cartAddBtn: { padding: "6px 12px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "#7c4a1e", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" },
  editBtn: { padding: "6px 12px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#7c4a1e", border: "1px solid #d9c9b0", borderRadius: "8px", cursor: "pointer" },
  deleteBtn: { padding: "6px 12px", fontSize: "12px", fontFamily: "'Trebuchet MS', sans-serif", background: "transparent", color: "#c0392b", border: "1px solid #f5a5a5", borderRadius: "8px", cursor: "pointer" },
};

export default Products;