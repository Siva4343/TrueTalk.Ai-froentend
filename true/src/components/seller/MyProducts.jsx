// src/components/seller/MyProducts.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// Correct import path
import { productApi } from "../services/api.js";

// 🔥 API_BASE added directly (No import needed)
const API_BASE = "http://localhost:8000";

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productApi.getSellerProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      if (String(error).includes("401")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      await productApi.delete(id);
      fetchProducts();
    }
  };

  const getImageUrl = (image) => {
    if (!image) return "https://via.placeholder.com/400x300?text=No+Image";
    if (image.startsWith("http")) return image;
    return API_BASE + image;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-2xl font-bold">My Products</h1>
          <Link
            to="/seller/add-product"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Product
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded shadow-lg overflow-hidden">
                <img
                  src={getImageUrl(p.image)}
                  className="h-48 w-full object-cover"
                  alt={p.name}
                />

                <div className="p-4">
                  <h2 className="font-semibold">{p.name}</h2>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {p.description}
                  </p>

                  <div className="flex justify-between mt-3 text-sm">
                    <span>${p.price}</span>
                    <span>Stock: {p.stock}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      className="flex-1 border px-3 py-1 rounded text-blue-600"
                      onClick={() => navigate(`/seller/edit-product/${p.id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="flex-1 bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProducts;
