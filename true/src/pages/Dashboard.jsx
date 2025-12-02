import React from "react";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <header className="bg-white shadow p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">Seller Dashboard</div>

          <nav className="space-x-3">
            <Link to="/add" className="px-4 py-2 bg-blue-600 text-white rounded">Add Product</Link>
            <Link to="/products" className="px-4 py-2 border rounded">My Products</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}