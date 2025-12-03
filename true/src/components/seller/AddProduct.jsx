// src/components/seller/AddProduct.jsx
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

// Correct import (components/services/api.js)
import { productApi } from "../services/api.js";

const AddProduct = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    status: "active",
  });

  const change = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    Object.keys(formData).forEach((k) => form.append(k, formData[k]));

    if (fileRef.current?.files[0]) {
      form.append("image", fileRef.current.files[0]);
    }

    await productApi.create(form);
    navigate("/seller/my-products");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <h1 className="text-2xl font-bold">Add Product</h1>
          <Link to="/seller/my-products" className="text-blue-600">
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <form onSubmit={submit} className="bg-white p-6 rounded shadow">
          <input
            name="name"
            placeholder="Name"
            onChange={change}
            className="border w-full p-2 mb-3"
            required
          />

          <input
            name="price"
            type="number"
            placeholder="Price"
            onChange={change}
            className="border w-full p-2 mb-3"
            required
          />

          <input
            name="stock"
            type="number"
            placeholder="Stock"
            onChange={change}
            className="border w-full p-2 mb-3"
            required
          />

          <input
            name="category"
            placeholder="Category"
            onChange={change}
            className="border w-full p-2 mb-3"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            rows={3}
            onChange={change}
            className="border w-full p-2 mb-3"
          />

          <label className="block mb-2 font-medium">Image</label>
          <input type="file" ref={fileRef} className="mb-4" />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
          >
            Add Product
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddProduct;
