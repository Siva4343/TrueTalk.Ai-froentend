import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { getImageUrl, getFallbackImage } from "../../utils/imageHelper";
// import { parseCurrency } from "../../utils/currencyParser";
// import { API_BASE_URL } from "../../utils/constants";

// INLINE IMPLEMENTATIONS (temporary until files are created)
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
  
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};

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
  
  if (trimmedPath.startsWith('/uploads/')) {
    const API_BASE_URL = 'http://localhost:3000';
    return `${API_BASE_URL}${trimmedPath}`;
  }
  
  return trimmedPath;
};

// API base URL
const API_BASE_URL = 'http://localhost:3000';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <nav className="flex space-x-4">
            <Link
              to="/buyer-dashboard"
              className="text-gray-600 border px-4 py-2 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/cart"
              className="text-gray-600 border px-4 py-2 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              View Cart
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Order History</h2>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <span className="text-xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <span className="text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <span className="text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'processing').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <span className="text-xl">🚚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'shipped').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-2 text-gray-500">
                {statusFilter !== 'all' 
                  ? `No orders with status "${statusFilter}"`
                  : "You haven't placed any orders yet."}
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
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderTotal = parseCurrency(order.total_amount || 0);

              return (
                <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900">
                            Order #{order.order_number || order.id}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Placed on {formatDate(order.created_at || order.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${orderTotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} items
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {(order.items || []).map((item, index) => {
                      const product = item.product;
                      const imageUrl = getImageUrl(product?.image);
                      const price = parseCurrency(product?.price || 0);
                      const itemTotal = price * (item.quantity || 1);

                      return (
                        <div key={index} className="p-6 flex items-center">
                          <div className="flex-shrink-0">
                            <img
                              className="h-20 w-20 rounded-lg object-cover"
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
                                  Quantity: {item.quantity || 1}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                  ${price.toFixed(2)} each
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                  ${itemTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {order.shipping_address && (
                          <p>Shipping to: {order.shipping_address}</p>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate(`/order/${order.id}`)}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </button>
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => alert("This would initiate a return")}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Return Item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;