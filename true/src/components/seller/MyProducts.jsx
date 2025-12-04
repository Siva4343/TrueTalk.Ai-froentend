// src/components/seller/MyProducts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = "http://localhost:8000";

// Helper functions
const getImageUrl = (image) => {
  if (!image) {
    return "https://via.placeholder.com/300x200?text=No+Image";
  }
  
  if (image.startsWith("http") || image.startsWith("data:image")) {
    return image;
  }
  
  if (image.startsWith("/")) {
    return `${API_BASE}${image}`;
  }
  
  return `${API_BASE}/media/${image}`;
};

const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalValue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate product value: unit price × stock quantity
  const calculateProductValue = (price, stock) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    const numStock = Number(stock) || 0;
    const priceValue = isNaN(numPrice) ? 0 : numPrice;
    return priceValue * numStock;
  };

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log("Fetching seller products from:", `${API_BASE}/api/products/`);
      const response = await fetch(`${API_BASE}/api/products/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Products fetched:", data);
      
      let productsArray = [];
      
      // Handle different response formats
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.results)) {
        productsArray = data.results;
      } else if (data && typeof data === 'object') {
        productsArray = [data];
      } else {
        console.warn("Unexpected response format:", data);
        productsArray = [];
      }
      
      setProducts(productsArray);
      
      // Calculate stats
      const totalProducts = productsArray.length;
      const activeProducts = productsArray.filter(p => p.status === 'active').length;
      const lowStockProducts = productsArray.filter(p => (p.stock || 0) <= 5).length;
      
      // Calculate total value of all products
      const totalValue = productsArray.reduce((sum, p) => {
        const price = typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price);
        const stock = Number(p.stock) || 0;
        const priceValue = isNaN(price) ? 0 : price;
        return sum + (priceValue * stock);
      }, 0);
      
      setStats({
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalValue: totalValue.toFixed(2)
      });
      
      console.log(`Loaded ${productsArray.length} products from backend`);
      console.log(`Total inventory value: $${totalValue.toFixed(2)}`);
      
    } catch (err) {
      console.error("Error loading products:", err);
      setError('Failed to load products from server. Please try again.');
      setProducts([]);
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        totalValue: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter(product => {
      const matchesSearch = searchTerm === '' || 
        (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || 
        (product.category?.toLowerCase() || '') === categoryFilter.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Recent";
      }
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Recent";
    }
  };

  // Get unique categories
  const getUniqueCategories = () => {
    const categories = new Set();
    products.forEach(product => {
      if (product.category && typeof product.category === 'string') {
        categories.add(product.category.trim());
      }
    });
    return Array.from(categories).sort();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
            <nav className="flex space-x-4">
              <Link to="/seller/add-product" className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg border">
                Add Product
              </Link>
              <Link to="/seller/my-products" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                My Products
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Products</h2>
            <p className="text-gray-600 mt-2">Manage your product inventory</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            {/* Category Filter */}
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading products from backend...</p>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.lowStockProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.totalValue}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              {products.length === 0 
                ? "You haven't added any products yet. Get started by adding your first product." 
                : "No products match your search criteria. Try adjusting your filters."}
            </p>
            <div className="mt-6">
              <Link 
                to="/seller/add-product" 
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Your First Product
              </Link>
            </div>
          </div>
        ) : !loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const formattedPrice = formatPrice(product.price);
                const productValue = calculateProductValue(product.price, product.stock);
                
                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    {/* Product Image Container */}
                    <div className="relative h-48 bg-gray-100">
                      <img 
                        src={getImageUrl(product.image)} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                        }}
                      />
                      
                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {product.status || 'active'}
                        </span>
                        
                        {(product.stock || 0) <= 5 && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                            Low Stock ({product.stock} left)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="p-5">
                      {/* Product Name and Unit Price Side by Side */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2 line-clamp-1">{product.name}</h3>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold text-blue-600">${formattedPrice}</div>
                          <div className="text-xs text-gray-500">per unit</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      
                      {/* Category and Stock */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Category</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {product.category || 'Uncategorized'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Stock Quantity</p>
                          <p className={`text-sm font-semibold ${
                            (product.stock || 0) <= 5 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {product.stock || 0} units
                          </p>
                        </div>
                      </div>
                      
                      {/* Product Value Calculator */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 text-sm font-medium mb-1">
                            <span className="text-gray-800">Unit: ${formattedPrice}</span>
                            <span className="text-gray-500">×</span>
                            <span className="text-gray-800">Stock: {product.stock || 0}</span>
                            <span className="text-gray-500">=</span>
                          </div>
                          <p className="text-lg font-bold text-blue-700">Total: ${productValue.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-1">Unit Price × Stock Quantity = Total Value</p>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(product.dateAdded || product.created_at)}
                          </div>
                          <span className="font-mono">ID: {product.id?.toString().padStart(3, '0')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <p>Showing {filteredProducts.length} of {products.length} products</p>
                  <p className="text-xs text-gray-400 mt-1">Total Inventory Value: ${stats.totalValue}</p>
                </div>
                <button
                  onClick={fetchProducts}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MyProducts;