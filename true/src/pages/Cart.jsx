// src/pages/Cart.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await api.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await api.addToCart(productId);
      loadCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleCreateOrder = async () => {
    setOrderLoading(true);
    try {
      const result = await api.createOrder();
      if (result.message) {
        alert('Order placed successfully!');
        loadCart();
      }
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Error creating order');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalAmount = cart?.items?.reduce(
    (total, item) => total + (item.product.price * item.quantity),
    0
  ) || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      {!cart?.items?.length ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link to="/products" className="text-blue-600 hover:text-blue-800">
            Continue Shopping →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="p-6 flex items-center">
                  <img
                    src={item.product.image || 'https://via.placeholder.com/100'}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="ml-6 flex-1">
                    <h3 className="text-lg font-semibold">{item.product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {item.product.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xl font-bold">${item.product.price}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAddToCart(item.product.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add More
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={orderLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <p className="text-sm text-gray-500 mt-4">
                By completing your purchase, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;