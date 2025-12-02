import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DragDropUpload from "../components/DragDropUpload";
import { API_BASE, fetchJSON } from "../api";

export default function EditProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [initialPhotoUrl, setInitialPhotoUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(()=>{
    async function load(){
      try {
        const data = await fetchJSON(`${API_BASE}/products/${id}/`);
        setName(data.name || "");
        setPrice(data.price || "");
        setDescription(data.description || "");
        setInitialPhotoUrl(data.photo || null);
      } catch (err) {
        alert("Failed to load product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name", name);
    fd.append("price", price);
    fd.append("description", description);
    if (photoFile) fd.append("photo", photoFile); // if user uploaded new photo

    try {
      await fetchJSON(`${API_BASE}/products/${id}/`, { method: "PUT", body: fd });
      alert("Updated");
      nav("/products");
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white max-w-3xl mx-auto p-10 shadow rounded-xl">
        <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
        <form onSubmit={handleSave}>
          <label className="block mb-2 font-semibold">Product Name *</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full p-3 border rounded-lg mb-5" required />

          <label className="block mb-2 font-semibold">Photo</label>
          <DragDropUpload initialUrl={initialPhotoUrl} onFileChange={(f)=>setPhotoFile(f)} />

          <label className="block mb-2 font-semibold">Price *</label>
          <input value={price} onChange={(e)=>setPrice(e.target.value)} className="w-full p-3 border rounded-lg mb-5" required />

          <label className="block mb-2 font-semibold">Description</label>
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full p-3 border rounded-lg mb-5" rows="3"/>

          <div className="flex space-x-3">
            <button disabled={saving} type="submit" className="bg-green-600 text-white p-3 rounded">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={()=>nav(-1)} className="p-3 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}