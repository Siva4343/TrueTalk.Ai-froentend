import React, { useState } from "react";
import DragDropUpload from "../components/DragDropUpload";
import { API_BASE, fetchJSON } from "../api";

export default function AddProduct({ onAdded }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("price", price);
    fd.append("description", description);
    if (photoFile) fd.append("photo", photoFile);

    try {
      await fetchJSON(`${API_BASE}/products/add/`, { method: "POST", body: fd });
      alert("Product added");
      setName(""); setPrice(""); setDescription(""); setPhotoFile(null);
      onAdded && onAdded();
    } catch (err) {
      alert("Failed to add product");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white max-w-3xl mx-auto p-10 shadow rounded-xl">
        <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold">Product Name *</label>
          <input required value={name} onChange={(e)=>setName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-5" placeholder="Enter product name"/>

          <label className="block mb-2 font-semibold">Product Photo *</label>
          <DragDropUpload onFileChange={(f)=>setPhotoFile(f)} required={true} />

          <label className="block mb-2 font-semibold">Price *</label>
          <input required type="number" value={price} onChange={(e)=>setPrice(e.target.value)}
            className="w-full p-3 border rounded-lg mb-5" placeholder="$ 0.00"/>

          <label className="block mb-2 font-semibold">Description</label>
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg mb-5" rows="3" placeholder="Optional"/>
          <button disabled={loading} className="bg-blue-600 text-white w-full p-3 rounded-lg text-lg hover:bg-blue-700">
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}