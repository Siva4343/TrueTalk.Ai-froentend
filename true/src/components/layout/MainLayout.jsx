import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Use environment variable or default URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100';
  };

  // Fetch data on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsLoading(true);
      
      try {
        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.ok && isMounted) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        // Fetch cart count
        const cartResponse = await fetch(`${API_BASE_URL}/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartResponse.ok && isMounted) {
          const cartData = await cartResponse.json();
          setCartCount(cartData.length);
        }

        // Fetch wishlist count
        const wishlistResponse = await fetch(`${API_BASE_URL}/wishlist/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (wishlistResponse.ok && isMounted) {
          const wishlistData = await wishlistResponse.json();
          setWishlistCount(wishlistData.length);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL]);

  // Refresh counts when location changes (user navigates)
  useEffect(() => {
    let isMounted = true;

    const refreshCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const cartResponse = await fetch(`${API_BASE_URL}/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartResponse.ok && isMounted) {
          const cartData = await cartResponse.json();
          setCartCount(cartData.length);
        }

        const wishlistResponse = await fetch(`${API_BASE_URL}/wishlist/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (wishlistResponse.ok && isMounted) {
          const wishlistData = await wishlistResponse.json();
          setWishlistCount(wishlistData.length);
        }
      } catch (error) {
        console.error('Error refreshing counts:', error);
      }
    };

    // Use setTimeout to avoid synchronous state updates
    const timer = setTimeout(() => {
      refreshCounts();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [location.pathname, API_BASE_URL]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle sidebar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">TrueTalk.Ai Marketplace</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-gray-700">{user?.name || 'User'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-64 bg-white shadow-md h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <nav className="mt-5 px-2">
              <div className="space-y-1">
                <Link
                  to="/buyer-dashboard"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/buyer-dashboard')}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                
                <Link
                  to="/my-products"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/my-products')}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  My Products
                </Link>
                
                <Link
                  to="/add-product"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/add-product')}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Product
                </Link>
                
                <Link
                  to="/orders"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/orders')}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Orders
                </Link>
                
                <Link
                  to="/wishlist"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/wishlist')}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Wishlist
                </Link>
                
                <Link
                  to="/cart"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive('/cart')}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Cart ({cartCount})
                </Link>
              </div>
              
              <div className="mt-8">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Stats
                </h3>
                <div className="mt-2 space-y-2">
                  <div className="px-3 py-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">Cart Items</p>
                    <p className="text-sm font-semibold text-blue-600">{cartCount}</p>
                  </div>
                  <div className="px-3 py-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">Wishlist Items</p>
                    <p className="text-sm font-semibold text-green-600">{wishlistCount}</p>
                  </div>
                  <div className="px-3 py-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600">Balance</p>
                    <p className="text-sm font-semibold text-purple-600">
                      ${user?.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${isSidebarOpen ? 'ml-0 md:ml-64' : ''} transition-all duration-300`}>
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          <Link to="/buyer-dashboard" className="flex flex-col items-center p-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link to="/cart" className="flex flex-col items-center p-2 relative">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-4 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </Link>
          
          <Link to="/orders" className="flex flex-col items-center p-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1">Orders</span>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center p-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;