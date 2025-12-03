import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// INLINE UTILITIES (temporary solution)
const getFallbackImage = () => {
  return 'https://via.placeholder.com/300x200/CCCCCC/969696?text=No+Image';
};

const getImageUrl = (path) => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return getFallbackImage();
  }
  
  const trimmedPath = path.trim();
  
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  if (trimmedPath.startsWith('data:')) {
    return trimmedPath;
  }
  
  if (trimmedPath.startsWith('/uploads/')) {
    const API_BASE_URL = 'http://localhost:3000';
    return `${API_BASE_URL}${trimmedPath}`;
  }
  
  if (trimmedPath.startsWith('/')) {
    return trimmedPath;
  }
  
  return trimmedPath;
};

const parseCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  const valueStr = String(value).trim();
  let cleanedValue = valueStr.replace(/[^\d.,-]/g, '');
  
  if (cleanedValue.includes(',') && !cleanedValue.includes('.')) {
    cleanedValue = cleanedValue.replace(',', '.');
  }
  
  const dotCount = (cleanedValue.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = cleanedValue.split('.');
    cleanedValue = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }
  
  cleanedValue = cleanedValue.replace(/,/g, '');
  
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};

const API_BASE_URL = 'http://localhost:3000';

// END OF INLINE UTILITIES

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cart/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/cart/${itemId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/cart/${itemId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }, []);

  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
      const price = parseCurrency(item.product?.price || 0);
      const quantity = item.quantity || 1;
      subtotal += price * quantity;
      totalItems += quantity;
    });

    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      totalItems
    };
  }, [cartItems]);

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <nav className="flex space-x-4">
            <Link
              to="/buyer-dashboard"
              className="text-gray-600 border px-4 py-2 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/wishlist"
              className="text-gray-600 border px-4 py-2 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              View Wishlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
              <svg 
                className="mx-auto h-16 w-16 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-2 text-gray-500">
                Looks like you haven't added any items to your cart yet.
              </p>
              <div className="mt-6">
                <Link
                  to="/buyer-dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Start Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Cart Items ({totals.totalItems})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => {
                    const product = item.product;
                    const imageUrl = getImageUrl(product?.image);
                    const price = parseCurrency(product?.price || 0);
                    const itemTotal = price * (item.quantity || 1);

                    return (
                      <div key={item.id} className="p-6 flex items-center">
                        <div className="flex-shrink-0">
                          <img
                            className="h-24 w-24 rounded-lg object-cover"
                            src={imageUrl || getFallbackImage()}
                            alt={product?.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImage();
                            }}
                          />
                        </div>
                        
                        <div className="ml-6 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {product?.name || "Unknown Product"}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                ${price.toFixed(2)} each
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                ${itemTotal.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                ${price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                                disabled={(item.quantity || 1) <= 1}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-12 text-center">{item.quantity || 1}</span>
                              <button
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg sticky top-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {totals.shipping === 0 ? "FREE" : `$${totals.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (10%)</span>
                      <span className="font-medium">${totals.tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-medium text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${totals.total.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Including ${totals.tax.toFixed(2)} in taxes
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => navigate("/checkout")}
                      className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Link
                      to="/buyer-dashboard"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;