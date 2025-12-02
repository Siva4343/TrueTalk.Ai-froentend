import React, { useEffect, useState } from "react";
import { API_BASE, fetchJSON } from "../api";
import { Link } from "react-router-dom";

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await fetchJSON(`${API_BASE}/products/`);
      setProducts(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load() }, []);

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await fetchJSON(`${API_BASE}/products/${id}/`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">My Products</h2>

        {products.length === 0 && <div className="text-gray-500">No products yet.</div>}

        <div className="space-y-4">
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-lg shadow flex items-center">
              <img src={p.photo} alt={p.name} className="w-24 h-24 object-cover rounded mr-4"/>
              <div className="flex-1">
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-sm text-gray-500">${p.price}</div>
              </div>

              <div className="space-x-2">
                <Link to={`/edit/${p.id}`} className="px-3 py-2 border rounded text-sm">Edit</Link>
                <button onClick={()=>handleDelete(p.id)} className="px-3 py-2 bg-red-500 text-white rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}