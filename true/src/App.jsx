// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import all components
import AddProduct from "./components/seller/AddProduct";
import MyProducts from "./components/seller/MyProducts";
import BuyerDashboard from "./components/Buyer/BuyerDashboard";

// Simple test component to check if routing works
const TestComponent = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Component - Routing Works!</h1>
      <p>If you see this, then routing is working.</p>
      <p>Check your browser console (F12) for errors.</p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* TEST Route - Remove this after testing */}
        <Route path="/test" element={<TestComponent />} />
        
        {/* Main routes */}
        <Route path="/" element={<BuyerDashboard />} />
        <Route path="/buyer" element={<BuyerDashboard />} />
        
        {/* Seller Routes */}
        <Route path="/seller/add-product" element={<AddProduct />} />
        <Route path="/seller/my-products" element={<MyProducts />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;