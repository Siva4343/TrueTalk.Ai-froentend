// src/components/Buyer/BuyerDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// FIXED services path
import { productApi } from "../services/api.js";

// DEFINE API_BASE HERE → no more missing file error
const API_BASE = "http://localhost:8000";

// ----------- Helpers ----------
const getImageUrl = (image) => {
  if (!image) return "https://via.placeholder.com/300x200?text=No+Image";

  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return API_BASE + image;

  return `${API_BASE}/media/${image}`;
};

const BuyerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // -------- Fetch Products --------
  const loadProducts = useCallback(async () => {
    try {
      const data = await productApi.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      if (String(err).includes("401")) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products
    .filter((p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 border-b">
        <div className="max-w-7xl mx-auto flex justify-between">
          <h1 className="text-xl font-bold">Buyer Dashboard</h1>
          <Link to="/cart" className="border px-3 py-1 rounded">
            Cart
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="flex gap-4 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-64"
            placeholder="Search products..."
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="new">Newest</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded shadow overflow-hidden">
                <img
                  src={getImageUrl(p.image)}
                  className="h-48 w-full object-cover"
                  alt=""
                />

                <div className="p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-gray-600">${p.price}</p>

                  <button
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="mt-3 px-3 py-2 border rounded text-blue-600"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyerDashboard;
