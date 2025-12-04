// src/components/Dashboard/UnifiedDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const UnifiedDashboard = () => {
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalValue: 0
  });

  // Calculate stats
  const calculateStats = (productsList) => {
    const totalProducts = productsList.length;
    const activeProducts = productsList.filter(p => p.status === 'active').length;
    const lowStockProducts = productsList.filter(p => p.stock <= 5).length;
    const totalValue = productsList.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue: totalValue.toFixed(2)
    };
  };

  // Load products from localStorage
  useEffect(() => {
    const loadProducts = () => {
      try {
        const savedSellerProducts = JSON.parse(localStorage.getItem('sellerProducts')) || [];
        console.log("Loaded products from localStorage:", savedSellerProducts.length);
        setProducts(savedSellerProducts);
        setStats(calculateStats(savedSellerProducts));
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
        setStats(calculateStats([]));
      }
    };
    
    loadProducts();
    
    // Refresh products every 5 seconds
    const interval = setInterval(loadProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter products
  const filteredProducts = products
    .filter((p) => {
      if (!p.name) return false;
      return p.name.toLowerCase().includes(search.toLowerCase()) ||
             (p.description || "").toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // Sort by newest first (default)
      return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Product Dashboard</h1>
            </div>
            
            <div className="flex items-center">
              {/* Dashboard Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('buyer')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'buyer' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Buyer View
                </button>
                <button
                  onClick={() => setActiveTab('seller')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'seller' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Seller View
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeTab === 'buyer' ? 'Buyer Dashboard' : 'Seller Dashboard'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'buyer' 
              ? 'Browse and purchase products from sellers' 
              : 'Manage your products and inventory'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold">{stats.activeProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-lg mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'buyer' ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Available Products</h2>
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>

            {/* Products */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found</p>
                <button
                  onClick={() => setActiveTab('seller')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add Products as Seller
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                    <p className="font-bold text-blue-600 mt-2">${product.price}</p>
                    <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link 
                to="/seller/add-product"
                className="border rounded-lg p-6 hover:bg-gray-50"
              >
                <h3 className="font-semibold mb-2">Add New Product</h3>
                <p className="text-gray-600">Create a new product listing</p>
              </Link>
              
              <Link 
                to="/seller/my-products"
                className="border rounded-lg p-6 hover:bg-gray-50"
              >
                <h3 className="font-semibold mb-2">Manage Products</h3>
                <p className="text-gray-600">View and edit your products</p>
              </Link>
            </div>

            {/* Recent Products Table */}
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Recent Products ({products.length})</h3>
              {products.length === 0 ? (
                <p className="text-gray-600">No products yet. Add your first product!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-left py-2">Price</th>
                        <th className="text-left py-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 5).map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="py-2">{product.name}</td>
                          <td className="py-2">${product.price}</td>
                          <td className="py-2">{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UnifiedDashboard;