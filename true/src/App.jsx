// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout.jsx";

// Seller pages
import Login from "./components/seller/Login.jsx";
import AddProduct from "./components/seller/AddProduct.jsx";
import MyProducts from "./components/seller/MyProducts.jsx";

// Buyer page
import BuyerDashboard from "./components/Buyer/BuyerDashboard.jsx";

function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <Routes>

        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        {isAuthenticated ? (
          <Route path="/" element={<MainLayout />}>

            <Route index element={<Navigate to="/buyer-dashboard" />} />

            {/* Buyer */}
            <Route path="buyer-dashboard" element={<BuyerDashboard />} />

            {/* Seller pages */}
            <Route path="seller/my-products" element={<MyProducts />} />
            <Route path="seller/add-product" element={<AddProduct />} />

            <Route path="*" element={<Navigate to="/buyer-dashboard" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
