import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { imageSrc } from "../Api";
import {
  Alert, ConfirmDialog, EmptyState, Icon, Modal, ProductFormModal, QtyStepper,
  errorMessage, firstName, fmtPrice, useToast,
} from "../components/ui";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name", label: "Name: A–Z" },
];

const sortProducts = (list, sort) => {
  const out = [...list];
  if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (sort === "name") out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  else if (sort === "newest") out.sort((a, b) => b.id - a.id);
  return out;
};

const Products = ({ user, cart, onAddToCart, onGoToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selCategory, setSelCategory] = useState(null);
  const [price, setPrice] = useState({ min: "", max: "" });
  const [sort, setSort] = useState("featured");

  const [editing, setEditing] = useState(null);   // {} = new product, product = edit
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewQty, setViewQty] = useState(1);
  const [toast, showToast] = useToast();
  const resultsRef = useRef(null);

  const canAdd = user.role === "ARTISAN" || user.role === "ADMIN";
  const canManage = (p) =>
    user.role === "ADMIN" || (user.role === "ARTISAN" && p.artisanName?.toLowerCase() === user.name?.toLowerCase());

  useEffect(() => {
    api.get("/api/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // Debounce typing so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.append("keyword", query);
    if (selCategory) params.append("categoryId", selCategory);
    if (price.min) params.append("minPrice", price.min);
    if (price.max) params.append("maxPrice", price.max);
    const url = params.toString() ? `/api/products/filter?${params}` : "/api/products";

    setLoading(true);
    return api.get(url)
      .then((res) => { setProducts(res.data); setLoadError(""); })
      .catch((err) => setLoadError(errorMessage(err, "Couldn't load products.")))
      .finally(() => setLoading(false));
  }, [query, selCategory, price.min, price.max]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);
  const hasFilter = Boolean(search || selCategory || price.min || price.max);
  const activeCategory = selCategory ? catById[selCategory] : null;

  const clearFilters = () => {
    setSearch(""); setSelCategory(null); setPrice({ min: "", max: "" });
  };

  const pickCategory = (id) => {
    setSelCategory(selCategory === id ? null : id);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addToBag = (p, qty = 1) => {
    onAddToCart(p, qty);
    showToast(`Added “${p.name}” to your bag`, { action: { label: "View bag", onClick: onGoToCart } });
  };

  const openQuickView = (p) => { setViewing(p); setViewQty(1); };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/products/${deleting.id}`);
      showToast("Product removed");
      setDeleting(null);
      fetchProducts();
    } catch (err) {
      showToast(errorMessage(err, "Couldn't delete the product."), { error: true });
      setDeleting(null);
    }
  };

  const inBag = (id) => cart.find((i) => i.id === id)?.quantity || 0;

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="eyebrow">Namaste, {firstName(user.name)}</span>
            <h1>Objects made slowly, <em>by hand,</em> to be kept for a lifetime.</h1>
            <p className="hero-lead">
              Discover pottery, handloom textiles, jewellery and folk art from skilled makers across India —
              every purchase goes straight to the artisan.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg"
                onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                Explore the collection <Icon name="arrowRight" size={17} />
              </button>
              {canAdd && (
                <button className="btn btn-secondary btn-lg" onClick={() => setEditing({})}>
                  <Icon name="plus" size={17} /> List a product
                </button>
              )}
            </div>
            <div className="hero-points">
              <span><Icon name="hand" size={16} /> 100% handmade</span>
              <span><Icon name="truck" size={16} /> Free shipping over ₹999</span>
              <span><Icon name="shield" size={16} /> Secure checkout</span>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="craft-tiles" aria-label="Shop by craft">
              {categories.slice(0, 6).map((c) => (
                <button key={c.id} className={"craft-tile" + (selCategory === c.id ? " active" : "")}
                  onClick={() => pickCategory(c.id)} aria-pressed={selCategory === c.id}>
                  <span className="craft-tile-icon">{c.icon || "✦"}</span>
                  <span>
                    <div className="craft-tile-name">{c.name}</div>
                    {c.description && <div className="craft-tile-sub">{c.description}</div>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <div className="filter-bar">
        <div className="container">
          <div className="filter-row">
            <div className="search-box input-icon">
              <Icon name="search" />
              <input className="input" type="search" placeholder="Search vases, scarves, jhumkas…"
                value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
            </div>
            <div className="price-range">
              <input className="input" type="number" min="0" placeholder="Min ₹" aria-label="Minimum price"
                value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
              <span>–</span>
              <input className="input" type="number" min="0" placeholder="Max ₹" aria-label="Maximum price"
                value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
            </div>
            <select className="input sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {categories.length > 0 && (
            <div className="filter-row">
              <div className="chips">
                <button className={"chip" + (!selCategory ? " active" : "")} onClick={() => setSelCategory(null)}>All crafts</button>
                {categories.map((c) => (
                  <button key={c.id} className={"chip" + (selCategory === c.id ? " active" : "")}
                    onClick={() => setSelCategory(selCategory === c.id ? null : c.id)}>
                    <span>{c.icon}</span>{c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <section className="container page" style={{ paddingTop: 0 }} ref={resultsRef}>
        <div className="results-head" style={{ scrollMarginTop: 160 }}>
          <h2>
            {activeCategory ? activeCategory.name : query ? `Results for “${query}”` : "The collection"}
            {!loading && <span className="results-count">{sorted.length} {sorted.length === 1 ? "piece" : "pieces"}</span>}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {hasFilter && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}><Icon name="x" size={15} /> Clear filters</button>
            )}
            {canAdd && (
              <button className="btn btn-dark btn-sm" onClick={() => setEditing({})}><Icon name="plus" size={15} /> Add product</button>
            )}
          </div>
        </div>

        {loadError && (
          <Alert>
            {loadError}{" "}
            <button className="link" onClick={fetchProducts}>Try again</button>
          </Alert>
        )}

        {loading && products.length === 0 ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton skeleton-media" />
                <div className="skeleton skeleton-line" style={{ width: "40%" }} />
                <div className="skeleton skeleton-line" style={{ width: "80%" }} />
                <div className="skeleton skeleton-line" style={{ width: "30%" }} />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 && !loadError ? (
          <EmptyState
            icon="vase"
            title={hasFilter ? "Nothing matches those filters" : "No products yet"}
            text={hasFilter ? "Try a different search, category or price range." : canAdd ? "Be the first to list a handmade piece." : "Check back soon — artisans are adding new pieces."}
            action={hasFilter
              ? <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
              : canAdd && <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Add product</button>}
          />
        ) : (
          <div className={"product-grid" + (loading ? " is-refreshing" : "")}>
            {sorted.map((p, i) => {
              const cat = catById[p.categoryId];
              const qty = inBag(p.id);
              return (
                <article key={p.id} className="product-card" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <button className="product-media" onClick={() => openQuickView(p)} aria-label={`Quick view: ${p.name}`}>
                    <img src={imageSrc(p.imageUrl, cat?.icon)} alt="" loading="lazy" />
                    {cat && <span className="product-tag">{cat.icon} {cat.name}</span>}
                    <span className="product-quick"><Icon name="eye" size={16} /> Quick view</span>
                  </button>
                  {canManage(p) && (
                    <div className="product-admin">
                      <button className="icon-btn icon-btn-glass" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Icon name="edit" size={16} /></button>
                      <button className="icon-btn icon-btn-glass icon-btn-danger" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}><Icon name="trash" size={16} /></button>
                    </div>
                  )}
                  <div className="product-body">
                    <div className="product-artisan">{p.artisanName}</div>
                    <button className="product-name" onClick={() => openQuickView(p)}>{p.name}</button>
                    <p className="product-desc">{p.description}</p>
                    <div className="product-footer">
                      <span className="price">{fmtPrice(p.price)}</span>
                      <button className={"btn btn-sm " + (qty ? "btn-secondary" : "btn-primary")} onClick={() => addToBag(p)}>
                        {qty ? <><Icon name="check" size={15} /> In bag · {qty}</> : <><Icon name="bag" size={15} /> Add to bag</>}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick view */}
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} size="lg">
        {viewing && (() => {
          const cat = catById[viewing.categoryId];
          return (
            <div className="quickview">
              <div className="quickview-media"><img src={imageSrc(viewing.imageUrl, cat?.icon)} alt={viewing.name} /></div>
              <div className="quickview-info">
                {cat && <span className="eyebrow">{cat.name}</span>}
                <h2>{viewing.name}</h2>
                <div className="muted">Handmade by <strong style={{ color: "var(--ink-2)" }}>{viewing.artisanName}</strong></div>
                <div className="price-lg" style={{ marginTop: 16 }}>{fmtPrice(viewing.price)}</div>
                <p className="quickview-desc">{viewing.description || "A one-of-a-kind handmade piece."}</p>
                <div className="quickview-buy">
                  <QtyStepper value={viewQty} onChange={(v) => setViewQty(Math.max(1, v))} />
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }}
                    onClick={() => { addToBag(viewing, viewQty); setViewing(null); }}>
                    <Icon name="bag" size={17} /> Add to bag · {fmtPrice(viewing.price * viewQty)}
                  </button>
                </div>
                <div className="perks">
                  <div><Icon name="hand" size={17} /> Handcrafted — slight variations make each piece unique</div>
                  <div><Icon name="truck" size={17} /> Ships in 2–3 days · free over ₹999</div>
                  <div><Icon name="heart" size={17} /> Your purchase supports the artisan directly</div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ProductFormModal
        open={Boolean(editing)}
        product={editing}
        categories={categories}
        user={user}
        onClose={() => setEditing(null)}
        onSaved={(msg) => { showToast(msg); fetchProducts(); }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this product?"
        message={deleting ? `“${deleting.name}” will be removed from the marketplace. This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      {toast}
    </>
  );
};

export default Products;
