// src/components/Buyer/BuyerDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

// Define API functions directly (no imports needed)
const API_BASE = "http://localhost:8000";

// Define getAllProducts function directly
const getAllProducts = async () => {
  try {
    console.log("Fetching products from:", `${API_BASE}/api/products/`);
    const response = await fetch(`${API_BASE}/api/products/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Products fetched:", data);
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      // Handle paginated response
      return data.results;
    } else if (data && typeof data === 'object') {
      // Handle single object response
      return [data];
    } else {
      console.warn("Unexpected response format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching products from backend:", error.message);
    // Return mock data for development
    return [
      {
        id: 1,
        name: "Sample Laptop",
        price: 999.99,
        category: "electronics",
        description: "High-performance laptop for professionals",
        stock: 15,
        status: "active",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop"
      },
      {
        id: 2,
        name: "Wireless Headphones",
        price: 149.99,
        category: "electronics",
        description: "Noise-cancelling wireless headphones",
        stock: 8,
        status: "active",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
      },
      {
        id: 3,
        name: "Running Shoes",
        price: 89.99,
        category: "sports",
        description: "Comfortable running shoes for all terrains",
        stock: 3,
        status: "active",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w-400&h=300&fit=crop"
      }
    ];
  }
};

// Define getImageUrl function directly
const getImageUrl = (image) => {
  if (!image) {
    return "https://via.placeholder.com/300x200?text=No+Image";
  }
  
  // If it's already a full URL or data URL, return as is
  if (image.startsWith("http") || image.startsWith("data:image")) {
    return image;
  }
  
  // If it starts with /, it's a relative path from the backend
  if (image.startsWith("/")) {
    return `${API_BASE}${image}`;
  }
  
  // Otherwise, assume it's in the media folder
  return `${API_BASE}/media/${image}`;
};

const BuyerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalValue: 0
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00';
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    
    if (isNaN(numPrice)) {
      console.warn('Invalid price value:', price);
      return '0.00';
    }
    
    return numPrice.toFixed(2);
  };

  // Helper function to get numeric price for calculations - wrapped in useCallback
  const getNumericPrice = useCallback((price) => {
    if (price === undefined || price === null) return 0;
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return isNaN(numPrice) ? 0 : numPrice;
  }, []);

  // Calculate stats - wrapped in useCallback to avoid dependency issues
  const calculateStats = useCallback((productsList) => {
    const totalProducts = productsList.length;
    const activeProducts = productsList.filter(p => p.status === 'active').length;
    const lowStockProducts = productsList.filter(p => p.stock <= 5).length;
    const totalValue = productsList.reduce((sum, p) => {
      const price = getNumericPrice(p.price);
      const stock = Number(p.stock) || 0;
      return sum + (price * stock);
    }, 0);
    
    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue: totalValue.toFixed(2)
    };
  }, [getNumericPrice]);

  // Load products from backend API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get products directly from backend
      const allProducts = await getAllProducts();
      
      // Only show active products to buyers
      const activeProducts = allProducts.filter(p => p.status === 'active');
      
      setProducts(activeProducts);
      setStats(calculateStats(activeProducts));
      setLastUpdated(new Date());
      
      console.log(`Loaded ${activeProducts.length} products from backend`);
      
    } catch (err) {
      console.error("Error loading products:", err);
      setError('Failed to load products from server. Please try again.');
      setProducts([]);
      setStats(calculateStats([]));
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // Initial load on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Calculate product value
  const calculateProductValue = useCallback((price, stock) => {
    const numericPrice = getNumericPrice(price);
    const numericStock = Number(stock) || 0;
    return numericPrice * numericStock;
  }, [getNumericPrice]);

  // Filter and sort products - use useMemo to optimize performance
  const filtered = React.useMemo(() => {
    return products
      .filter((p) => {
        if (!p.name) return false;
        return p.name.toLowerCase().includes(search.toLowerCase()) ||
               (p.description || "").toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const priceA = getNumericPrice(a.price);
        const priceB = getNumericPrice(b.price);
        
        if (sortBy === "price_low") return priceA - priceB;
        if (sortBy === "price_high") return priceB - priceA;
        return new Date(b.dateAdded || b.created_at || 0) - new Date(a.dateAdded || a.created_at || 0);
      });
  }, [products, search, sortBy, getNumericPrice]);

  // Format date to avoid "Invalid Date"
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

  // Format time for last updated
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer Dashboard</h1>
          <p className="text-gray-600 text-lg">View available products from sellers</p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Last updated: {formatTime(lastUpdated)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Products Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg mr-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            {/* Active Products Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg mr-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
                </div>
              </div>
            </div>

            {/* Low Stock Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-50 rounded-lg mr-4">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
                </div>
              </div>
            </div>

            {/* Total Inventory Value Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-purple-50 rounded-lg mr-4">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalValue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Available Products</h2>
              <p className="text-gray-600">Browse products from sellers</p>
            </div>
            <Link 
              to="/seller/add-product" 
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sell Products
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Info */}
          {!loading && products.length > 0 && (
            <div className="mb-4 text-sm text-gray-500">
              <p>
                Showing {filtered.length} of {products.length} products
              </p>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading products from server...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                {products.length === 0 
                  ? "No products have been added yet. Add some products as a seller first."
                  : "No products match your search. Try a different search term."
                }
              </p>
              <Link 
                to="/seller/add-product" 
                className="inline-flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Your First Product
              </Link>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product) => {
                  const productValue = calculateProductValue(product.price, product.stock);
                  const formattedPrice = formatPrice(product.price);
                  
                  return (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                          }}
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                          </span>
                        </div>
                        
                        {/* Low Stock Badge */}
                        {product.stock <= 5 && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="p-5">
                        {/* Name and Price */}
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">{product.name}</h3>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">${formattedPrice}</p>
                            <p className="text-xs text-gray-500">per unit</p>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                        
                        {/* Category and Stock */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Category</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{product.category}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Stock</p>
                            <p className={`text-sm font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {product.stock} units
                            </p>
                          </div>
                        </div>
                        
                        {/* Product Value Card */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-1">Product Value</p>
                              <p className="text-xl font-bold text-blue-900">${productValue.toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-full p-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Calculation Formula */}
                          <div className="text-xs text-blue-600 bg-white rounded p-2 border border-blue-100">
                            <div className="flex items-center justify-center space-x-2">
                              <span className="font-medium">${formattedPrice}</span>
                              <span className="text-gray-400">×</span>
                              <span className="font-medium">{product.stock} units</span>
                              <span className="text-gray-400">=</span>
                              <span className="font-bold">${productValue.toFixed(2)}</span>
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-1">
                              Unit Price × Stock Quantity = Total Value
                            </p>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            Added: {formatDate(product.dateAdded || product.created_at)}
                          </span>
                          <button
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            onClick={() => {
                              const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                              const existingItem = cart.find(item => item.id === product.id);
                              
                              if (existingItem) {
                                existingItem.quantity += 1;
                              } else {
                                cart.push({
                                  id: product.id,
                                  name: product.name,
                                  price: getNumericPrice(product.price),
                                  image: product.image,
                                  quantity: 1
                                });
                              }
                              
                              localStorage.setItem('cart', JSON.stringify(cart));
                              alert(`${product.name} added to cart!`);
                            }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Last Updated Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Products loaded from backend: {formatTime(lastUpdated)}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default BuyerDashboard;